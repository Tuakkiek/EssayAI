import mongoose, { Document, Schema, Model } from "mongoose"

// ── Types ────────────────────────────────────────────────────────────
export type UserRole = "student" | "teacher" | "admin"
export type SubscriptionPlan = "free" | "starter" | "pro" | "enterprise"

export interface IUser extends Document {
  name: string
  email: string
  passwordHash: string
  role: UserRole
  avatarUrl?: string
  centerId?: mongoose.Types.ObjectId
  subscription: {
    plan: SubscriptionPlan
    startDate?: Date
    endDate?: Date
    isActive: boolean
  }
  stats: {
    essaysSubmitted: number
    averageScore: number
    lastActiveAt?: Date
  }
  isEmailVerified: boolean
  createdAt: Date
  updatedAt: Date
}

// ── Schema ───────────────────────────────────────────────────────────
const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name must be at most 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
      select: false, // Never returned in queries by default
    },
    role: {
      type: String,
      enum: ["student", "teacher", "admin"],
      default: "student",
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    centerId: {
      type: Schema.Types.ObjectId,
      ref: "Center",
      default: null,
    },
    subscription: {
      plan: {
        type: String,
        enum: ["free", "starter", "pro", "enterprise"],
        default: "free",
      },
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
      isActive: { type: Boolean, default: true },
    },
    stats: {
      essaysSubmitted: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0, min: 0, max: 9 },
      lastActiveAt: { type: Date, default: null },
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        const { passwordHash: _p, __v: _v, ...clean } = ret
        return clean
      },
    },
  }
)

// ── Indexes ──────────────────────────────────────────────────────────
UserSchema.index({ email: 1 }, { unique: true })
UserSchema.index({ centerId: 1 })
UserSchema.index({ "subscription.plan": 1 })

// ── Model ─────────────────────────────────────────────────────────────
const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema)
export default User
