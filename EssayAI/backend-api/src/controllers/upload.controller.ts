import { Request, Response, NextFunction } from "express"
import { sendSuccess, sendError } from "../utils/response"
import { logger } from "../utils/logger"
import { isCloudinaryReady } from "../config/cloudinary"
import {
  uploadAvatar,
  uploadEssayAttachment,
  uploadCenterLogo,
  deleteFile,
} from "../services/uploadService"

// ── Guard: check Cloudinary is ready before any upload handler ────
const requireCloudinary = (res: Response): boolean => {
  if (!isCloudinaryReady()) {
    sendError(res, "File upload service is not configured", 503)
    return false
  }
  return true
}

// ── POST /api/upload/avatar ───────────────────────────────────────
export const handleAvatarUpload = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!requireCloudinary(res)) return

    const userId = (req.query["userId"] as string) || (req.body?.userId as string)
    if (!userId) { sendError(res, "userId is required", 400); return }

    if (!req.file) { sendError(res, "No file uploaded. Send file in the 'file' field", 400); return }

    const result = await uploadAvatar(req.file.buffer, req.file.mimetype, userId)

    sendSuccess(res, {
      url:      result.secureUrl,
      publicId: result.publicId,
      width:    result.width,
      height:   result.height,
      bytes:    result.bytes,
      format:   result.format,
    }, "Avatar uploaded and saved successfully")
  } catch (err) {
    next(err)
  }
}

// ── POST /api/upload/attachment ───────────────────────────────────
export const handleAttachmentUpload = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!requireCloudinary(res)) return

    const userId = (req.query["userId"] as string) || (req.body?.userId as string)
    if (!userId) { sendError(res, "userId is required", 400); return }

    if (!req.file) { sendError(res, "No file uploaded", 400); return }

    const result = await uploadEssayAttachment(req.file.buffer, req.file.mimetype, userId)

    sendSuccess(res, {
      url:      result.secureUrl,
      publicId: result.publicId,
      bytes:    result.bytes,
      format:   result.format,
      width:    result.width,
      height:   result.height,
    }, "Attachment uploaded successfully")
  } catch (err) {
    next(err)
  }
}

// ── POST /api/upload/center-logo ──────────────────────────────────
export const handleCenterLogoUpload = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!requireCloudinary(res)) return

    const ownerId = (req.query["ownerId"] as string) || (req.body?.ownerId as string)
    if (!ownerId) { sendError(res, "ownerId is required", 400); return }

    if (!req.file) { sendError(res, "No file uploaded", 400); return }

    const result = await uploadCenterLogo(req.file.buffer, req.file.mimetype, ownerId)

    sendSuccess(res, {
      url:      result.secureUrl,
      publicId: result.publicId,
      bytes:    result.bytes,
      format:   result.format,
      width:    result.width,
      height:   result.height,
    }, "Center logo uploaded successfully")
  } catch (err) {
    next(err)
  }
}

// ── DELETE /api/upload ────────────────────────────────────────────
export const handleDeleteFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!requireCloudinary(res)) return

    const { url } = req.body as { url?: string }
    if (!url) { sendError(res, "url is required in request body", 400); return }

    await deleteFile(url)
    sendSuccess(res, { deleted: true }, "File deleted successfully")
  } catch (err) {
    next(err)
  }
}
