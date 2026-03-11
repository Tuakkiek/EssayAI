import axios from "axios"
import { ApiResponse } from "../types"
import { API_BASE_URL } from "../config/api"

export interface UploadResult {
  url:      string
  publicId: string
  width?:   number
  height?:  number
  bytes:    number
  format:   string
}

// ── Generic multipart upload helper ──────────────────────────────
const uploadMultipart = async (
  endpoint: string,
  fileUri:  string,
  mimeType: string,
  fileName: string,
  params:   Record<string, string>
): Promise<UploadResult> => {
  const formData = new FormData()

  // React Native FormData accepts { uri, type, name }
  formData.append("file", {
    uri:  fileUri,
    type: mimeType,
    name: fileName,
  } as unknown as Blob)

  const res = await axios.post<ApiResponse<UploadResult>>(
    `${API_BASE_URL}${endpoint}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      params,
      timeout: 30_000,
    }
  )

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message ?? "Upload failed")
  }
  return res.data.data
}

// ── Avatar ────────────────────────────────────────────────────────
export const uploadAvatar = (
  fileUri:  string,
  mimeType: string,
  userId:   string
): Promise<UploadResult> =>
  uploadMultipart("/upload/avatar", fileUri, mimeType, "avatar.jpg", { userId })

// ── Essay attachment ──────────────────────────────────────────────
export const uploadAttachment = (
  fileUri:  string,
  mimeType: string,
  userId:   string
): Promise<UploadResult> =>
  uploadMultipart("/upload/attachment", fileUri, mimeType, "attachment", { userId })

// ── Center logo ───────────────────────────────────────────────────
export const uploadCenterLogo = (
  fileUri:  string,
  mimeType: string,
  ownerId:  string
): Promise<UploadResult> =>
  uploadMultipart("/upload/center-logo", fileUri, mimeType, "logo.png", { ownerId })
