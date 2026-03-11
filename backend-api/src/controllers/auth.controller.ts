import { Request, Response, NextFunction } from "express"
import { sendSuccess, sendCreated, sendBadRequest } from "../utils/response"
import { register, login, getProfile, changePassword } from "../services/authService"

export const registerHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, role } = req.body
    if (!name || !email || !password) {
      sendBadRequest(res, "Missing required fields")
      return
    }
    const result = await register({ name, email, password, role })
    sendCreated(res, result, "Registration successful")
  } catch (err) {
    next(err)
  }
}

export const loginHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

export const getMeHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId
    const user = await getProfile(userId)
    sendSuccess(res, { user }, "Profile retrieved")
  } catch (err) {
    next(err)
  }
}

export const changePasswordHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { oldPassword, newPassword } = req.body
    if (!oldPassword || !newPassword) {
      sendBadRequest(res, "Missing old or new password")
      return
    }
    await changePassword(req.user!.userId, oldPassword, newPassword)
    sendSuccess(res, null, "Password changed successfully")
  } catch (err) {
    next(err)
  }
}
