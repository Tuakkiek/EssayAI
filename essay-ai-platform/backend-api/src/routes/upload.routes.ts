import { Router } from "express"
import {
  handleAvatarUpload,
  handleAttachmentUpload,
  handleCenterLogoUpload,
  handleDeleteFile,
} from "../controllers/upload.controller"
import {
  uploadAvatarMiddleware,
  uploadAttachmentMiddleware,
  uploadCenterLogoMiddleware,
} from "../middlewares/upload"

const router = Router()

// POST /api/upload/avatar?userId=
// Content-Type: multipart/form-data  |  field: "file"
router.post("/avatar", uploadAvatarMiddleware, handleAvatarUpload)

// POST /api/upload/attachment?userId=
router.post("/attachment", uploadAttachmentMiddleware, handleAttachmentUpload)

// POST /api/upload/center-logo?ownerId=
router.post("/center-logo", uploadCenterLogoMiddleware, handleCenterLogoUpload)

// DELETE /api/upload  { "url": "https://res.cloudinary.com/..." }
router.delete("/", handleDeleteFile)

export default router
