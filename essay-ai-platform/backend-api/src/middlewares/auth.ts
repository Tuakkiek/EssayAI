import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { env } from "../config/env"
import { sendUnauthorized, sendForbidden } from "../utils/response"
import { UserRole } from "../models/User"

// ── Augment express Request ────────────────────────────────────────
export interface AuthUser {
  userId: string
  email:  string
  role:   UserRole
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

export interface JwtPayload {
  userId: string
  email:  string
  role:   UserRole
  iat?:   number
  exp?:   number
}

// ── Sign token ────────────────────────────────────────────────────
export const signToken = (payload: Omit<JwtPayload, "iat" | "exp">): string =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] })

// ── Verify token ──────────────────────────────────────────────────
export const verifyToken = (token: string): JwtPayload =>
  jwt.verify(token, env.JWT_SECRET) as JwtPayload

// ── Middleware: require any valid JWT ─────────────────────────────
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers["authorization"]
  if (!header?.startsWith("Bearer ")) {
    sendUnauthorized(res, "Authorization header missing or malformed")
    return
  }

  const token = header.slice(7)
  try {
    req.user = verifyToken(token)
    next()
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      sendUnauthorized(res, "Token expired — please log in again")
    } else {
      sendUnauthorized(res, "Invalid token")
    }
  }
}

// ── Middleware: require specific role(s) ──────────────────────────
export const requireRole = (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) { sendUnauthorized(res, "Not authenticated"); return }
    if (!roles.includes(req.user.role)) {
      sendForbidden(res, `Access requires role: ${roles.join(" or ")}`)
      return
    }
    next()
  }

// ── Convenience composers ─────────────────────────────────────────
export const requireTeacher = [requireAuth, requireRole("teacher", "admin")]
export const requireAdmin   = [requireAuth, requireRole("admin")]
export const requireStudent = [requireAuth, requireRole("student", "teacher", "admin")]
