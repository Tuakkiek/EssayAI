import mongoose, { Document, Schema, Model } from "mongoose";

// ── Types ────────────────────────────────────────────────────────────
/**
 * Role hierarchy (highest → lowest privilege):
 *   admin          — system administrator (seeded only)
 *   teacher        — creates classes, assignments, reviews submissions
 *   center_student — student in a teacher's class
 *   free_student   — self-registered student (no class)
 */

export type UserRole = "admin" | "teacher" | "center_student" | "free_student";

export const ADMIN_ROLES: UserRole[] = ["admin"];
export const TEACHER_ROLES: UserRole[] = ["admin", "teacher"];
export const ALL_ROLES: UserRole[] = [
  "admin",
  "teacher",
  "center_student",
  "free_student",
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
  phone: string; // Primary login identifier (required)
  email?: string | null; // Optional
  passwordHash: string;

  // Role & tenancy
  role: UserRole;
  centerId?: mongoose.Types.ObjectId; // null only for super_admin and self-registered students

  /**
   * "invited" = teacher/admin created (center-managed)
   * "self"    = self-registered
   * "system"  = seeded system account (admin)
   */
  registrationMode?: "invited" | "self" | "system";

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
  classId?: mongoose.Types.ObjectId; // Current class (single)
  teacherId?: mongoose.Types.ObjectId; // Teacher who manages this student
  centerName?: string; // Teacher organization name
  bio?: string; // Teacher bio

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
      required: [true, "Phone is required"],
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      unique: true,
      sparse: true, // allows multiple missing values (students have no email)
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
      enum: ["admin", "teacher", "center_student", "free_student"],
      default: "free_student",
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
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      default: null,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    centerName: {
      type: String,
      default: null,
      trim: true,
    },
    bio: {
      type: String,
      default: null,
      trim: true,
      maxlength: [1000, "Bio must be at most 1000 characters"],
    },

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
      enum: ["invited", "self", "system"],
      default: "self",
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
// Phone index is created via unique: true in schema
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
