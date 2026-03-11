import { v2 as cloudinary, UploadApiResponse, UploadApiOptions } from "cloudinary"
import { env } from "./env"
import { logger } from "../utils/logger"

type CloudinaryStatus = "configured" | "not configured"

let _status: CloudinaryStatus = "not configured"

export const initCloudinary = (): void => {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    logger.warn("Cloudinary not configured — file uploads will be disabled")
    return
  }

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key:    env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure:     true,
  })

  _status = "configured"
  logger.info("✅ Cloudinary configured")
}

export const getCloudinaryStatus = (): CloudinaryStatus => _status

export const isCloudinaryReady = (): boolean => _status === "configured"

// ── Typed upload wrapper ──────────────────────────────────────────
export const uploadToCloudinary = (
  buffer: Buffer,
  options: UploadApiOptions
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err || !result) return reject(err ?? new Error("Upload returned no result"))
      resolve(result)
    })
    stream.end(buffer)
  })
}

// ── Delete by public_id ───────────────────────────────────────────
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId)
  logger.info("Cloudinary asset deleted", { publicId })
}

export { cloudinary }
