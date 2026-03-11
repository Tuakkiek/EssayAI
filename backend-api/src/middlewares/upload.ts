import multer, { FileFilterCallback } from "multer"
import { Request, Response, NextFunction } from "express"
import { UploadContext } from "../services/uploadService"
import { sendError } from "../utils/response"

const CONTEXT_MAX_BYTES: Record<UploadContext, number> = {
  avatar:           5  * 1024 * 1024,
  essay_attachment: 10 * 1024 * 1024,
  center_logo:      5  * 1024 * 1024,
}

const ALLOWED_MIMES: Record<UploadContext, string[]> = {
  avatar:           ["image/jpeg", "image/png", "image/webp"],
  essay_attachment: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  center_logo:      ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
}

// ── Build multer instance for a given context ─────────────────────
export const createUploadMiddleware = (context: UploadContext) => {
  const maxBytes     = CONTEXT_MAX_BYTES[context]
  const allowedMimes = ALLOWED_MIMES[context]

  const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (allowedMimes.includes(file.mimetype)) cb(null, true)
    else cb(new Error(
      `File type "${file.mimetype}" not allowed. ` +
      `Accepted: ${allowedMimes.map((m) => m.split("/")[1]).join(", ")}`
    ))
  }

  return multer({ storage: multer.memoryStorage(), limits: { fileSize: maxBytes }, fileFilter }).single("file")
}

// ── Error-handling wrapper ────────────────────────────────────────
export const handleUploadError = (
  req: Request, res: Response, next: NextFunction, context: UploadContext
) => {
  createUploadMiddleware(context)(req, res, (err) => {
    if (!err) return next()
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      const maxMB = (CONTEXT_MAX_BYTES[context] / (1024 * 1024)).toFixed(0)
      return sendError(res, `File too large. Maximum: ${maxMB} MB`, 400)
    }
    return sendError(res, (err as Error).message ?? "File upload failed", 400)
  })
}

// ── Named middleware factories ────────────────────────────────────
export const uploadAvatarMiddleware = (req: Request, res: Response, next: NextFunction) =>
  handleUploadError(req, res, next, "avatar")

export const uploadAttachmentMiddleware = (req: Request, res: Response, next: NextFunction) =>
  handleUploadError(req, res, next, "essay_attachment")

export const uploadCenterLogoMiddleware = (req: Request, res: Response, next: NextFunction) =>
  handleUploadError(req, res, next, "center_logo")
