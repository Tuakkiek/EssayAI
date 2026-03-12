import bcrypt from "bcryptjs"
import { User, Center } from "../models/index"
import { IUser, UserRole } from "../models/User"
import { AppError } from "../middlewares/errorHandler"
import { signToken, JwtPayload } from "../middlewares/auth"
import { logger } from "../utils/logger"

const SALT_ROUNDS = 12

// ── Shared result shape ────────────────────────────────────────────
export interface AuthResult {
  token: string
  user: {
    id:                 string
    name:               string
    email:              string | null
    phone:              string
    role:               UserRole
    centerId:           string | null
    mustChangePassword: boolean
    avatarUrl:          string | null
  }
}

// ── Register (Center Admin only) ──────────────────────────────────
/**
 * Public registration is ONLY for center admins creating a new center.
 * Students and teachers are created by admins/teachers via the student API.
 */
export interface RegisterCenterInput {
  name:         string
  email:        string
  phone:        string
  password:     string
  centerName:   string
  contactEmail: string
}

export const registerCenter = async (input: RegisterCenterInput): Promise<AuthResult> => {
  const { name, email, phone, password, centerName, contactEmail } = input

  // Check email uniqueness
  const existing = await User.findOne({ email: email.toLowerCase() })
  if (existing) throw new AppError("Email already registered", 409)

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

  // Import slugify here to avoid circular deps
  const { slugify } = await import("../utils/textUtils")
  let slug = slugify(centerName)

  // Ensure slug uniqueness
  const slugExists = await Center.findOne({ slug })
  if (slugExists) slug = `${slug}-${Date.now().toString().slice(-4)}`

  // Create the center first (so ownerId can reference it)
  const center = await Center.create({
    name:         centerName,
    slug,
    contactEmail,
    ownerId:      new (await import("mongoose")).default.Types.ObjectId(), // temp, updated below
    subscription: { plan: "free", isActive: true },
  })

  // Create the owner user linked to the center
  const user = await User.create({
    name,
    email:    email.toLowerCase(),
    phone,
    passwordHash,
    role:     "center_admin",
    centerId: center._id,
    mustChangePassword: false,
    isActive: true,
  })

  // Backfill ownerId
  await Center.findByIdAndUpdate(center._id, { ownerId: user._id })

  logger.info("Center registered", { userId: user._id, centerId: center._id, centerName })

  return buildAuthResult(user, center._id.toString())
}

// ── Login (Center Admin / Teacher) ────────────────────────────────
/**
 * Email + password login for center_admin and teacher roles.
 * Existing flow — unchanged except centerId is now included in the JWT.
 */
export const login = async (email: string, password: string): Promise<AuthResult> => {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash")
  if (!user) throw new AppError("Invalid email or password", 401)
  if (!user.isActive) throw new AppError("Your account has been disabled. Contact your center admin.", 403)

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw new AppError("Invalid email or password", 401)

  await User.findByIdAndUpdate(user._id, { "stats.lastActiveAt": new Date() })
  logger.info("User logged in", { userId: user._id, email: user.email, role: user.role })

  return buildAuthResult(user, user.centerId?.toString())
}

// ── Student Login (phone + password + centerId) ────────────────────
/**
 * Students log in using their phone number and the auto-generated
 * (or changed) password.  centerId is required to scope the lookup
 * since the same phone number can exist in different centers.
 */
export const studentLogin = async (
  phone:    string,
  password: string,
  centerId: string
): Promise<AuthResult> => {
  const mongoose = await import("mongoose")

  const user = await User.findOne({
    phone,
    centerId: new mongoose.default.Types.ObjectId(centerId),
    role:     "student",
  }).select("+passwordHash")

  if (!user) throw new AppError("Invalid phone number or password", 401)
  if (!user.isActive) throw new AppError("Your account has been disabled. Contact your teacher.", 403)

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw new AppError("Invalid phone number or password", 401)

  await User.findByIdAndUpdate(user._id, { "stats.lastActiveAt": new Date() })
  logger.info("Student logged in", { userId: user._id, phone, centerId })

  return buildAuthResult(user, centerId)
}

// ── Get profile ───────────────────────────────────────────────────
export const getProfile = async (userId: string): Promise<IUser> => {
  const user = await User.findById(userId)
  if (!user) throw new AppError("User not found", 404)
  return user
}

// ── Change own password ───────────────────────────────────────────
export const changePassword = async (
  userId:      string,
  oldPassword: string,
  newPassword: string
): Promise<void> => {
  const user = await User.findById(userId).select("+passwordHash")
  if (!user) throw new AppError("User not found", 404)

  const valid = await bcrypt.compare(oldPassword, user.passwordHash)
  if (!valid) throw new AppError("Current password is incorrect", 401)

  if (newPassword.length < 6) {
    throw new AppError("New password must be at least 6 characters", 400)
  }

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS)
  await User.findByIdAndUpdate(userId, {
    passwordHash:       newHash,
    mustChangePassword: false,   // clears the first-login flag
  })

  logger.info("Password changed", { userId })
}

// ── Helper ────────────────────────────────────────────────────────
const buildAuthResult = (user: IUser, centerId?: string | null): AuthResult => {
  const payload: JwtPayload = {
    userId:   (user._id as import("mongoose").Types.ObjectId).toString(),
    email:    user.email ?? user.phone,   // students may have no email
    role:     user.role,
    centerId: centerId ?? undefined,
  }
  const token = signToken(payload)

  return {
    token,
    user: {
      id:                 payload.userId,
      name:               user.name,
      email:              user.email ?? null,
      phone:              user.phone,
      role:               user.role,
      centerId:           centerId ?? null,
      mustChangePassword: user.mustChangePassword,
      avatarUrl:          user.avatarUrl ?? null,
    },
  }
}

// ── Register Self Student ──────────────────────────────────────────────
/**
 * Student tự đăng ký — không cần trung tâm.
 *
 * Khác với center student:
 *  - Đăng nhập bằng email + password (không cần phone + centerId)
 *  - centerId = null
 *  - registrationMode = "self"
 *  - mustChangePassword = false (họ tự chọn password)
 *  - Được cấp plan individual_free tự động
 */
export interface RegisterSelfStudentInput {
  name:     string
  email:    string
  phone?:   string
  password: string
}

export const registerSelfStudent = async (
  input: RegisterSelfStudentInput
): Promise<AuthResult> => {
  const { name, email, phone, password } = input

  if (password.length < 6) {
    throw new AppError("Mật khẩu phải có ít nhất 6 ký tự", 400)
  }

  const existing = await User.findOne({ email: email.toLowerCase() })
  if (existing) throw new AppError("Email này đã được đăng ký", 409)

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

  const user = await User.create({
    name:               name.trim(),
    email:              email.toLowerCase(),
    phone:              phone ?? email, // phone optional cho self-registered
    passwordHash,
    role:               "student",
    centerId:           null,           // không thuộc trung tâm nào
    registrationMode:   "self",
    mustChangePassword: false,          // student tự chọn password
    isActive:           true,
    selfSubscription: {
      plan:     "individual_free",
      isActive: true,
    },
  })

  logger.info("Self-registered student", { userId: user._id, email })
  return buildAuthResult(user, null)
}

// ── Login for self-registered students (email + password) ────────────
/**
 * Dùng cùng endpoint login thông thường — phân biệt bằng registrationMode trong DB.
 * Hàm login() hiện tại đã xử lý được — chỉ cần gọi login(email, password).
 * Không cần hàm riêng.
 */
