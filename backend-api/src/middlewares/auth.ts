import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { env } from "../config/env"
import { sendUnauthorized, sendForbidden } from "../utils/response"
import { UserRole, isTeacherOrAbove, isAdminOrAbove } from "../models/User"

// ── Augment express Request ────────────────────────────────────────
export interface AuthUser {
  userId:    string
  email:     string   // may be the phone number for student tokens
  role:      UserRole
  centerId?: string   // always present except for super_admin
}

declare global {
  namespace Express {
    interface Request {
      user?:         AuthUser
      /**
       * Injected by requireCenter middleware.
       * Services should always spread this into their MongoDB queries
       * to enforce tenant isolation:
       *   User.find({ ...req.centerFilter, role: "student" })
       */
      centerFilter?: { centerId: string }
    }
  }
}

// ── JWT payload ───────────────────────────────────────────────────
export interface JwtPayload {
  userId:    string
  email:     string   // or phone for students
  role:      UserRole
  centerId?: string
  iat?:      number
  exp?:      number
}

// ── Sign & verify ─────────────────────────────────────────────────
export const signToken = (payload: Omit<JwtPayload, "iat" | "exp">): string =>
  jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  })

export const verifyToken = (token: string): JwtPayload =>
  jwt.verify(token, env.JWT_SECRET) as JwtPayload

// ── requireAuth ───────────────────────────────────────────────────
/**
 * Validates the Bearer JWT and attaches req.user.
 * Does NOT enforce roles — compose with requireRole() for that.
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers["authorization"]
  if (!header?.startsWith("Bearer ")) {
    sendUnauthorized(res, "Authorization header missing or malformed")
    return
  }

  const token = header.slice(7)
  try {
    const payload = verifyToken(token)
    req.user = {
      userId:   payload.userId,
      email:    payload.email,
      role:     payload.role,
      centerId: payload.centerId,
    }
    next()
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      sendUnauthorized(res, "Token expired — please log in again")
    } else {
      sendUnauthorized(res, "Invalid token")
    }
  }
}

// ── requireRole ───────────────────────────────────────────────────
/**
 * Must be used AFTER requireAuth.
 * Pass any number of allowed roles.
 *
 * NOTE: "admin" is treated the same as "center_admin" here to support
 * existing tokens during the migration window.
 */
export const requireRole = (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res, "Not authenticated")
      return
    }

    const userRole = req.user.role
    // Treat legacy "admin" as "center_admin" for role matching
    const effectiveRole = userRole === "admin" ? "center_admin" : userRole
    const normalizedAllowed = roles.map(r => r === "admin" ? "center_admin" : r)

    if (!normalizedAllowed.includes(effectiveRole)) {
      sendForbidden(res, `Access requires role: ${roles.join(" or ")}`)
      return
    }
    next()
  }

// ── requireCenter ─────────────────────────────────────────────────
/**
 * Must be used AFTER requireAuth.
 * Injects req.centerFilter = { centerId: req.user.centerId }
 * so services can spread it into every MongoDB query automatically.
 *
 * Rejects requests from users without a centerId (i.e. super_admin
 * hitting a center-scoped route is a programming error — they should
 * use the admin routes which don't use requireCenter).
 */
export const requireCenter = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    sendUnauthorized(res, "Not authenticated")
    return
  }
  if (!req.user.centerId) {
    sendForbidden(res, "This route requires a center-scoped account")
    return
  }
  req.centerFilter = { centerId: req.user.centerId }
  next()
}

// ── requireActiveAccount ──────────────────────────────────────────
/**
 * Optionally compose this to block disabled accounts.
 * The isActive check is also done in login, but this adds a
 * runtime guard in case a token was issued before the account was disabled.
 * Requires a DB lookup — use sparingly on sensitive routes only.
 */
export const requireActiveAccount = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  if (!req.user) { sendUnauthorized(res); return }

  const { User } = await import("../models/index")
  const user = await User.findById(req.user.userId).select("isActive")
  if (!user || !user.isActive) {
    sendForbidden(res, "Your account has been disabled. Contact your center admin.")
    return
  }
  next()
}

// ── requirePasswordChanged ────────────────────────────────────────
/**
 * Blocks all requests from students who haven't changed their
 * system-generated password yet.
 * Apply this to ALL student-facing routes except POST /auth/change-password.
 */
export const requirePasswordChanged = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  if (!req.user) { sendUnauthorized(res); return }
  if (req.user.role !== "student") { next(); return }

  const { User } = await import("../models/index")
  const user = await User.findById(req.user.userId).select("mustChangePassword")
  if (user?.mustChangePassword) {
    sendForbidden(res, "PASSWORD_CHANGE_REQUIRED")
    return
  }
  next()
}

// ── Convenience middleware arrays ──────────────────────────────────
/**
 * Use these pre-composed arrays on routes instead of repeating
 * [requireAuth, requireRole(...), requireCenter] every time.
 *
 * Example:
 *   router.get("/students", ...requireTeacher, handler)
 */
export const requireSuperAdmin = [requireAuth, requireRole("super_admin")]

export const requireAdmin = [
  requireAuth,
  requireRole("super_admin", "center_admin", "admin"),
]

export const requireCenterAdmin = [
  requireAuth,
  requireRole("center_admin", "admin"),
  requireCenter,
]

export const requireTeacher = [
  requireAuth,
  requireRole("super_admin", "center_admin", "admin", "teacher"),
  requireCenter,
]

export const requireStudent = [
  requireAuth,
  requireRole("student", "teacher", "center_admin", "admin", "super_admin"),
  requireCenter,
]

// ── requireSelfStudent ────────────────────────────────────────────────
/**
 * Middleware cho student tự đăng ký (không có centerId).
 *
 * Khác với requireStudent (bắt buộc phải có centerId từ trung tâm),
 * middleware này cho phép cả hai trường hợp:
 *   - Student tự đăng ký (centerId = null) → centerFilter = null
 *   - Student từ trung tâm (centerId có giá trị) → centerFilter được set bình thường
 *
 * Dùng cho các route mà cả hai loại student đều có thể truy cập (VD: nộp bài, xem bài).
 */
export const requireSelfStudent = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) { sendUnauthorized(res, "Not authenticated"); return }

  const role = req.user.role
  const allowedRoles: UserRole[] = ["student", "teacher", "center_admin", "admin", "super_admin"]
  const effectiveRole = role === "admin" ? "center_admin" : role

  if (!allowedRoles.map(r => r === "admin" ? "center_admin" : r).includes(effectiveRole)) {
    sendForbidden(res, "Access denied"); return
  }

  // Nếu có centerId → inject centerFilter như bình thường
  // Nếu không → để centerFilter = undefined (service sẽ handle)
  if (req.user.centerId) {
    req.centerFilter = { centerId: req.user.centerId }
  }
  // centerFilter = undefined cho self-registered students → OK

  next()
}

/**
 * Pre-composed array dùng trên các essay/assignment routes
 * để cho phép cả center-student lẫn self-student truy cập.
 */
export const requireAnyStudent = [
  requireAuth,
  requireSelfStudent,
]
