import { Response } from "express"

export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = "Success",
  statusCode = 200
): Response => {
  const payload: ApiResponse<T> = { success: true, message, data }
  return res.status(statusCode).json(payload)
}

export const sendCreated = <T>(res: Response, data: T, message = "Created"): Response => {
  return sendSuccess(res, data, message, 201)
}

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  error?: string
): Response => {
  const payload: ApiResponse = { success: false, message, error }
  return res.status(statusCode).json(payload)
}

export const sendNotFound = (res: Response, message = "Resource not found"): Response => {
  return sendError(res, message, 404)
}

export const sendBadRequest = (res: Response, message = "Bad request"): Response => {
  return sendError(res, message, 400)
}

export const sendUnauthorized = (res: Response, message = "Unauthorized"): Response => {
  return sendError(res, message, 401)
}

export const sendForbidden = (res: Response, message = "Forbidden"): Response => {
  return sendError(res, message, 403)
}
