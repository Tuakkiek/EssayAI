import bcrypt from "bcryptjs"
import { User } from "../models/index"
import { IUser, UserRole } from "../models/User"
import { AppError } from "../middlewares/errorHandler"
import { signToken, JwtPayload } from "../middlewares/auth"
import { logger } from "../utils/logger"

const SALT_ROUNDS = 12

// ── Register ──────────────────────────────────────────────────────
export interface RegisterInput {
  name:     string
  email:    string
  password: string
  role?:    UserRole
}

export interface AuthResult {
  token:  string
  user: {
    id:    string
    name:  string
    email: string
    role:  UserRole
    subscription: {
      plan:     string
      isActive: boolean
    }
  }
}

export const register = async (input: RegisterInput): Promise<AuthResult> => {
  const { name, email, password, role = "student" } = input

  const existing = await User.findOne({ email: email.toLowerCase() })
  if (existing) throw new AppError("Email already registered", 409)

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

  const user = await User.create({ name, email: email.toLowerCase(), passwordHash, role })

  logger.info("User registered", { userId: user._id, email, role })

  return buildAuthResult(user)
}

// ── Login ─────────────────────────────────────────────────────────
export const login = async (email: string, password: string): Promise<AuthResult> => {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash")
  if (!user) throw new AppError("Invalid email or password", 401)

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw new AppError("Invalid email or password", 401)

  // Update lastActiveAt
  await User.findByIdAndUpdate(user._id, { "stats.lastActiveAt": new Date() })

  logger.info("User logged in", { userId: user._id, email: user.email })

  return buildAuthResult(user)
}

// ── Get profile ───────────────────────────────────────────────────
export const getProfile = async (userId: string): Promise<IUser> => {
  const user = await User.findById(userId)
  if (!user) throw new AppError("User not found", 404)
  return user
}

// ── Change password ───────────────────────────────────────────────
export const changePassword = async (
  userId:      string,
  oldPassword: string,
  newPassword: string
): Promise<void> => {
  const user = await User.findById(userId).select("+passwordHash")
  if (!user) throw new AppError("User not found", 404)

  const valid = await bcrypt.compare(oldPassword, user.passwordHash)
  if (!valid) throw new AppError("Current password is incorrect", 401)

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS)
  await User.findByIdAndUpdate(userId, { passwordHash: newHash })
  logger.info("Password changed", { userId })
}

// ── Helper ────────────────────────────────────────────────────────
const buildAuthResult = (user: IUser): AuthResult => {
  const payload: JwtPayload = {
    userId: (user._id as import("mongoose").Types.ObjectId).toString(),
    email:  user.email,
    role:   user.role,
  }
  const token = signToken(payload)

  return {
    token,
    user: {
      id:    payload.userId,
      name:  user.name,
      email: user.email,
      role:  user.role,
      subscription: {
        plan:     user.subscription.plan,
        isActive: user.subscription.isActive,
      },
    },
  }
}
