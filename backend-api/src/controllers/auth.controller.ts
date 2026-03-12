import { Request, Response, NextFunction } from "express"
import { sendSuccess, sendCreated, sendBadRequest } from "../utils/response"
import {
  registerCenter,
  login,
  studentLogin,
  getProfile,
  changePassword,
} from "../services/authService"

// ── POST /api/auth/register ───────────────────────────────────────
/**
 * Public registration for CENTER ADMIN only.
 * Creates both the User and the Center in a single transaction.
 */
export const registerHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const { name, email, phone, password, centerName, contactEmail } = req.body

    if (!name || !email || !phone || !password || !centerName) {
      sendBadRequest(res, "Missing required fields: name, email, phone, password, centerName")
      return
    }

    const result = await registerCenter({ name, email, phone, password, centerName, contactEmail: contactEmail ?? email })
    sendCreated(res, result, "Center registered successfully")
  } catch (err) {
    next(err)
  }
}

// ── POST /api/auth/login ──────────────────────────────────────────
/** Email + password login for center_admin and teacher */
export const loginHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      sendBadRequest(res, "Missing email or password")
      return
    }
    const result = await login(email, password)
    sendSuccess(res, result, "Login successful")
  } catch (err) {
    next(err)
  }
}

// ── POST /api/auth/student/login ──────────────────────────────────
/**
 * Phone + password + centerId login for STUDENTS only.
 * centerId scopes the lookup so the same phone can exist in multiple centers.
 *
 * Response includes mustChangePassword flag — the client must redirect
 * to the change-password screen if it is true.
 */
export const studentLoginHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const { phone, password, centerId } = req.body

    if (!phone || !password || !centerId) {
      sendBadRequest(res, "Missing required fields: phone, password, centerId")
      return
    }

    const result = await studentLogin(phone, password, centerId)
    sendSuccess(res, result, "Login successful")
  } catch (err) {
    next(err)
  }
}

// ── GET /api/auth/me ──────────────────────────────────────────────
export const getMeHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const user = await getProfile(req.user!.userId)
    sendSuccess(res, { user }, "Profile retrieved")
  } catch (err) {
    next(err)
  }
}

// ── POST /api/auth/change-password ────────────────────────────────
/**
 * Works for all roles.
 * Clears mustChangePassword flag when called by a student.
 */
export const changePasswordHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const { oldPassword, newPassword } = req.body
    if (!oldPassword || !newPassword) {
      sendBadRequest(res, "Missing oldPassword or newPassword")
      return
    }
    await changePassword(req.user!.userId, oldPassword, newPassword)
    sendSuccess(res, { mustChangePassword: false }, "Password changed successfully")
  } catch (err) {
    next(err)
  }
}

// ── POST /api/auth/register/student — student tự đăng ký ─────────────
export const registerSelfStudentHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, phone } = req.body

    if (!name || !email || !password) {
      sendBadRequest(res, "Thiếu thông tin bắt buộc: name, email, password")
      return
    }

    const { registerSelfStudent } = await import("../services/authService")
    const result = await registerSelfStudent({ name, email, password, phone })
    sendCreated(res, result, "Đăng ký thành công! Bạn có thể bắt đầu luyện viết ngay.")
  } catch (err) {
    next(err)
  }
}
