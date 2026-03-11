import { uploadToCloudinary, deleteFromCloudinary, isCloudinaryReady } from "../config/cloudinary"
import { User } from "../models/index"
import { logger } from "../utils/logger"
import { AppError } from "../middlewares/errorHandler"

// ── Upload type config ────────────────────────────────────────────
export type UploadContext = "avatar" | "essay_attachment" | "center_logo"

interface UploadConfig {
  folder:         string
  maxBytes:       number
  allowedMimes:   string[]
  transformation: object[]
  description:    string
}

const UPLOAD_CONFIGS: Record<UploadContext, UploadConfig> = {
  avatar: {
    folder:       "essay-ai/avatars",
    maxBytes:     5 * 1024 * 1024,     // 5 MB
    allowedMimes: ["image/jpeg", "image/png", "image/webp"],
    transformation: [
      { width: 400, height: 400, crop: "fill", gravity: "face" },
      { quality: "auto", fetch_format: "auto" },
    ],
    description: "User avatar",
  },
  essay_attachment: {
    folder:       "essay-ai/attachments",
    maxBytes:     10 * 1024 * 1024,    // 10 MB
    allowedMimes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    transformation: [
      { quality: "auto", fetch_format: "auto" },
    ],
    description: "Essay attachment",
  },
  center_logo: {
    folder:       "essay-ai/centers",
    maxBytes:     5 * 1024 * 1024,
    allowedMimes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
    transformation: [
      { width: 800, height: 400, crop: "limit" },
      { quality: "auto", fetch_format: "auto" },
    ],
    description: "Center logo / branding",
  },
}

// ── Result shape ──────────────────────────────────────────────────
export interface UploadResult {
  url:          string
  secureUrl:    string
  publicId:     string
  format:       string
  bytes:        number
  width?:       number
  height?:      number
  context:      UploadContext
}

// ── Validate file before uploading ───────────────────────────────
export const validateFile = (
  buffer: Buffer,
  mimeType: string,
  context: UploadContext
): void => {
  const config = UPLOAD_CONFIGS[context]

  if (!config) {
    throw new AppError(`Unknown upload context: ${context}`, 400)
  }

  if (!config.allowedMimes.includes(mimeType)) {
    throw new AppError(
      `File type not allowed for ${config.description}. ` +
      `Allowed: ${config.allowedMimes.map((m) => m.split("/")[1]).join(", ")}`,
      400
    )
  }

  if (buffer.length > config.maxBytes) {
    const maxMB = (config.maxBytes / (1024 * 1024)).toFixed(0)
    throw new AppError(
      `File too large for ${config.description}. Maximum size: ${maxMB} MB`,
      400
    )
  }
}

// ── Core upload function ──────────────────────────────────────────
export const uploadFile = async (
  buffer:   Buffer,
  mimeType: string,
  context:  UploadContext,
  ownerId:  string
): Promise<UploadResult> => {
  if (!isCloudinaryReady()) {
    throw new AppError("File upload service is not configured", 503)
  }

  validateFile(buffer, mimeType, context)

  const config = UPLOAD_CONFIGS[context]
  const resourceType = mimeType === "application/pdf" ? "raw" : "image"

  logger.info("Uploading file to Cloudinary", {
    context,
    mimeType,
    bytes: buffer.length,
    ownerId,
  })

  const result = await uploadToCloudinary(buffer, {
    folder:         config.folder,
    resource_type:  resourceType,
    transformation: config.transformation,
    tags:           [context, `owner_${ownerId}`],
    overwrite:      false,
    unique_filename: true,
  })

  logger.info("File uploaded successfully", {
    publicId: result.public_id,
    bytes:    result.bytes,
    url:      result.secure_url,
  })

  return {
    url:       result.url,
    secureUrl: result.secure_url,
    publicId:  result.public_id,
    format:    result.format,
    bytes:     result.bytes,
    width:     result.width,
    height:    result.height,
    context,
  }
}

// ── Avatar upload + persist to User ──────────────────────────────
export const uploadAvatar = async (
  buffer:   Buffer,
  mimeType: string,
  userId:   string
): Promise<UploadResult> => {
  // Find and delete old avatar if exists
  const user = await User.findById(userId).select("avatarUrl")
  if (user?.avatarUrl) {
    const oldPublicId = extractPublicId(user.avatarUrl)
    if (oldPublicId) {
      await deleteFromCloudinary(oldPublicId).catch((err) =>
        logger.warn("Could not delete old avatar", { err })
      )
    }
  }

  const result = await uploadFile(buffer, mimeType, "avatar", userId)

  // Persist URL to User document
  await User.findByIdAndUpdate(userId, { avatarUrl: result.secureUrl })
  logger.info("Avatar updated for user", { userId, url: result.secureUrl })

  return result
}

// ── Essay attachment upload ───────────────────────────────────────
export const uploadEssayAttachment = async (
  buffer:   Buffer,
  mimeType: string,
  userId:   string
): Promise<UploadResult> => {
  return uploadFile(buffer, mimeType, "essay_attachment", userId)
}

// ── Center logo upload ────────────────────────────────────────────
export const uploadCenterLogo = async (
  buffer:   Buffer,
  mimeType: string,
  ownerId:  string
): Promise<UploadResult> => {
  return uploadFile(buffer, mimeType, "center_logo", ownerId)
}

// ── Delete file by URL ────────────────────────────────────────────
export const deleteFile = async (secureUrl: string): Promise<void> => {
  const publicId = extractPublicId(secureUrl)
  if (!publicId) throw new AppError("Could not extract public_id from URL", 400)
  await deleteFromCloudinary(publicId)
}

// ── Extract Cloudinary public_id from URL ────────────────────────
export const extractPublicId = (url: string): string | null => {
  try {
    // Pattern: .../upload/v123456789/folder/filename.ext
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/)
    return match ? match[1] : null
  } catch {
    return null
  }
}
