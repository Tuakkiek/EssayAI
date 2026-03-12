import mongoose, { Document, Schema, Model } from "mongoose";

// ── Interface ────────────────────────────────────────────────────────
export interface IClass extends Document {
  centerId: mongoose.Types.ObjectId;
  name: string;
  teacherId: mongoose.Types.ObjectId; // primary teacher
  studentIds: mongoose.Types.ObjectId[];
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ───────────────────────────────────────────────────────────
const ClassSchema = new Schema<IClass>(
  {
    centerId: {
      type: Schema.Types.ObjectId,
      ref: "Center",
      required: [true, "centerId is required"],
    },
    name: {
      type: String,
      required: [true, "Class name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name must be at most 100 characters"],
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "teacherId is required"],
    },
    studentIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    description: {
      type: String,
      maxlength: [500, "Description must be at most 500 characters"],
      default: null,
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
        const { __v: _v, ...clean } = ret;
        return clean;
      },
    },
  },
);

// ── Virtual: student count ────────────────────────────────────────────
ClassSchema.virtual("studentCount").get(function (this: IClass) {
  return this.studentIds.length;
});

// ── Indexes ──────────────────────────────────────────────────────────
ClassSchema.index({ centerId: 1, isActive: 1 });
ClassSchema.index({ centerId: 1, teacherId: 1 });
// Unique class name per center
ClassSchema.index({ centerId: 1, name: 1 }, { unique: true });

// ── Model ─────────────────────────────────────────────────────────────
const Class: Model<IClass> = mongoose.model<IClass>("Class", ClassSchema);
export default Class;
