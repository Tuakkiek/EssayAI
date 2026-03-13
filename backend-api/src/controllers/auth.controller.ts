import { Request, Response, NextFunction } from "express";
import { sendSuccess, sendCreated, sendBadRequest } from "../utils/response";
import {
  registerUser,
  login,
  getProfile,
  changePassword,
  registerSelfStudent,
} from "../services/authService";

// ── POST /api/auth/register ────────────────────────────────────────
/**
 * Public registration for teacher or free_student.
 */
export const registerHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const allowedRoles = ["free_student", "teacher"] as const;
    const {
      name,
      phone,
      email,
      password,
      confirmPassword,
      role = "free_student",
      centerName,
    } = req.body;

    if (!name || !phone || !password || !confirmPassword) {
      sendBadRequest(res, "Missing required fields: name, phone, password");
      return;
    }

    if (password !== confirmPassword) {
      sendBadRequest(res, "Password confirmation does not match");
      return;
    }

    if (!allowedRoles.includes(role)) {
      sendBadRequest(res, "Role kh�ng h?p l?");
      return;
    }

    if (role === "teacher" && !centerName?.trim()) {
      sendBadRequest(res, "Gi�o vi�n ph?i nh?p t�n trung t�m/t? ch?c");
      return;
    }

    const result = await registerUser({
      name,
      phone,
      email,
      password,
      role,
      centerName,
    });

    sendCreated(res, result, "Register successful");
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/login ──────────────────────────────────────────
export const loginHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      sendBadRequest(res, "Missing phone or password");
      return;
    }
    const result = await login(phone, password);
    sendSuccess(res, result, "Login successful");
  } catch (err) {
    next(err);
  }
};

// ── GET /api/auth/me ──────────────────────────────────────────────
export const getMeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await getProfile(req.user!.userId);
    sendSuccess(res, { user }, "Profile retrieved");
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/change-password ─────────────────────────────────────────
export const changePasswordHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      sendBadRequest(res, "Missing oldPassword or newPassword");
      return;
    }
    await changePassword(req.user!.userId, oldPassword, newPassword);
    sendSuccess(res, { mustChangePassword: false }, "Password changed successfully");
  } catch (err) {
    next(err);
  }
};

// Deprecated: kept for backward compatibility
export const registerSelfStudentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, phone, password } = req.body;
    if (!name || !phone || !password) {
      sendBadRequest(res, "Thi?u th�ng tin b?t bu?c: name, phone, password");
      return;
    }
    const result = await registerSelfStudent({ name, phone, password });
    sendCreated(res, result, "�ang k� th�nh c�ng!");
  } catch (err) {
    next(err);
  }
};