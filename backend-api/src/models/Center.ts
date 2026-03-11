import mongoose, { Document, Schema, Model } from "mongoose"

// ── Types ────────────────────────────────────────────────────────────
export interface ICenter extends Document {
  name: string
  slug: string
  description?: string
  logoUrl?: string
  contactEmail: string
  contactPhone?: string
  address?: string
  ownerId: mongoose.Types.ObjectId
  teacherIds: mongoose.Types.ObjectId[]
  studentCount: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
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
      match: [/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"],
    },
    description: {
      type: String,
      maxlength: [1000, "Description must be at most 1000 characters"],
      default: null,
    },
    logoUrl: {
      type: String,
      default: null,
    },
    contactEmail: {
      type: String,
      required: [true, "Contact email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    contactPhone: {
      type: String,
      default: null,
      trim: true,
    },
    address: {
      type: String,
      default: null,
      trim: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
    },
    teacherIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    studentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        const { __v: _v, ...clean } = ret
        return clean
      },
    },
  }
)

// ── Indexes ──────────────────────────────────────────────────────────
CenterSchema.index({ slug: 1 }, { unique: true })
CenterSchema.index({ ownerId: 1 })
CenterSchema.index({ isActive: 1 })

// ── Model ─────────────────────────────────────────────────────────────
const Center: Model<ICenter> = mongoose.model<ICenter>("Center", CenterSchema)
export default Center
