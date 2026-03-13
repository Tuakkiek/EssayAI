import mongoose, { Document, Schema, Model } from "mongoose";

// ── Subscription plan types (shared with payment system) ─────────────
export type SubscriptionPlan = "free" | "starter" | "pro" | "enterprise";

// ── Interface ────────────────────────────────────────────────────────
export interface ICenter extends Document {
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  contactEmail?: string | null;
  contactPhone?: string;
  address?: string;

  // Ownership
  ownerId: mongoose.Types.ObjectId; // Ref to User (role: center_admin)

  // Subscription is now on the CENTER, not per-user
  // The center pays for all its students' usage.
  subscription: {
    plan: SubscriptionPlan;
    startDate?: Date;
    endDate?: Date;
    isActive: boolean;
  };

  // Denormalized relationships & counts
  teachers: mongoose.Types.ObjectId[]; // All teachers in this center
  studentCount: number;
  teacherCount: number;

  // State
  isActive: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ───────────────────────────────────────────────────────────
const CenterSchema = new Schema<ICenter>(
  {
    name: {
      type: String,
      required: [true, "Center name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [150, "Name must be at most 150 characters"],
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-z0-9-]+$/,
        "Slug must only contain lowercase letters, numbers, and hyphens",
      ],
    },

    description: {
      type: String,
      maxlength: [1000, "Description must be at most 1000 characters"],
      default: null,
    },

    logoUrl: { type: String, default: null },
    contactEmail: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
      default: null,
    },
    contactPhone: { type: String, default: null, trim: true },
    address: { type: String, default: null, trim: true },

    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
    },

    // ── Subscription (moved from User) ──────────────────────────
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

    teachers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    studentCount: { type: Number, default: 0, min: 0 },
    teacherCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },

  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        const { __v: _v, ...clean } = ret;
        return clean;
      },
    },
  },
);

// ── Indexes ──────────────────────────────────────────────────────────
// slug index created automatically via unique:true in field definition
CenterSchema.index({ ownerId: 1 });
CenterSchema.index({ isActive: 1 });
CenterSchema.index({ "subscription.plan": 1 });

// ── Model ─────────────────────────────────────────────────────────────
const Center: Model<ICenter> = mongoose.model<ICenter>("Center", CenterSchema);
export default Center;
