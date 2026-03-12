import mongoose, { Document, Schema, Model } from "mongoose";

// ── Types ────────────────────────────────────────────────────────────
/**
 * Role hierarchy (highest → lowest privilege):
 *   super_admin  — platform owner, no centerId
 *   center_admin — training center owner/manager
 *   teacher      — manages classes & students within a center
 *   student      — read-only, created by teacher/admin
 *
 * "admin" is kept as a deprecated alias for center_admin to avoid
 * breaking any existing JWT tokens during the migration window.
 */

export type UserRole =
  | "super_admin"
  | "center_admin"
  | "teacher"
  | "student"
  | "individual_user"
  | "admin"; // ← deprecated alias — treat as center_admin in all checks

export const ADMIN_ROLES: UserRole[] = ["super_admin", "center_admin", "admin"];
export const TEACHER_ROLES: UserRole[] = [
  "super_admin",
  "center_admin",
  "admin",
  "teacher",
];
export const ALL_ROLES: UserRole[] = [
  "super_admin",
  "center_admin",
  "admin",
  "teacher",
  "student",
];

/** True if the role has teacher-level access or higher */
export const isTeacherOrAbove = (role: UserRole): boolean =>
  TEACHER_ROLES.includes(role);

/** True if the role has admin-level access or higher */
export const isAdminOrAbove = (role: UserRole): boolean =>
  ADMIN_ROLES.includes(role);

// ── Interface ────────────────────────────────────────────────────────
export interface IUser extends Document {
  // Identity
  name: string;
  phone: string; // Primary login identifier for students (unique within center)
  email?: string; // Required for center_admin, teachers, self-registered students; optional for center-created students
  passwordHash: string;

  // Role & tenancy
  role: UserRole;
  centerId?: mongoose.Types.ObjectId; // null only for super_admin and self-registered students

  /**
   * "center"  = tài khoản do trung tâm cấp (teacher/admin tạo)
   * "self"    = tự đăng ký, không cần trung tâm
   * undefined = legacy records (treat as "center")
   */
  registrationMode?: "center" | "self";

  // Self-registered students manage their own subscription (not via Center)
  selfSubscription?: {
    plan: string; // "individual_free" | "individual_pro"
    startDate?: Date;
    endDate?: Date;
    isActive: boolean;
  };

  // Profile
  avatarUrl?: string;
  classIds: mongoose.Types.ObjectId[]; // Classes this student is enrolled in

  // Account state
  isActive: boolean; // false = disabled (cannot login)
  mustChangePassword: boolean; // true = force password change on next login

  // Audit
  createdBy?: mongoose.Types.ObjectId; // Teacher/admin who created this account

  // Denormalized stats (updated async after each essay)
  stats: {
    essaysSubmitted: number;
    averageScore: number;
    lastActiveAt?: Date;
  };

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
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

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      // Uniqueness is enforced via a compound index { phone, centerId }
      // so the same phone can exist across different centers.
    },

    email: {
      type: String,
      unique: true,
      sparse: true, // allows multiple null values (students have no email)
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
      default: null,
    },

    passwordHash: {
      type: String,
      required: [true, "Password is required"],
      select: false, // Never returned in queries by default
    },

    role: {
      type: String,
      enum: ["super_admin", "center_admin", "admin", "teacher", "student"],
      default: "student",
    },

    centerId: {
      type: Schema.Types.ObjectId,
      ref: "Center",
      default: null,
    },

    avatarUrl: {
      type: String,
      default: null,
    },

    classIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Class",
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },

    mustChangePassword: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    registrationMode: {
      type: String,
      enum: ["center", "self"],
      default: "center",
    },

    selfSubscription: {
      plan: {
        type: String,
        enum: ["individual_free", "individual_pro"],
        default: "individual_free",
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
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        const { passwordHash: _p, __v: _v, ...clean } = ret;
        return clean;
      },
    },
  },
);

// ── Indexes ──────────────────────────────────────────────────────────
// Unique phone within a center (students) — sparse allows null centerId (super_admin)
UserSchema.index({ phone: 1, centerId: 1 }, { unique: true, sparse: true });
// Fast lookup for teachers listing students in their center
UserSchema.index({ centerId: 1, role: 1 });
// Email is separately indexed via { unique: true, sparse: true } above
UserSchema.index({ createdBy: 1 });

// Self-registered students: fast lookup by registrationMode
UserSchema.index({ registrationMode: 1, role: 1 });
// Self-subscription expiry check (cron job queries this)
UserSchema.index({ "selfSubscription.endDate": 1, registrationMode: 1 });

// ── Model ─────────────────────────────────────────────────────────────
const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);
export default User;
