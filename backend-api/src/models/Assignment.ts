import mongoose, { Document, Schema, Model } from "mongoose";

// ── Types ─────────────────────────────────────────────────────────────
export type AssignmentTaskType = "task1" | "task2";
export type AssignmentStatus = "draft" | "published" | "closed";

export interface IRequiredVocabulary {
  word: string;
  synonyms?: string[];
  importance?: "required" | "recommended";
}

export interface IBandDescriptor {
  band: number;
  descriptor: string;
}

export interface IGradingCriteria {
  overview?: string;
  requiredVocabulary?: IRequiredVocabulary[];
  bandDescriptors?: IBandDescriptor[];
  structureRequirements?: string;
  penaltyNotes?: string;
  additionalNotes?: string;
}

// ── Interface ───────────────────────────────────────────────────────────
export interface IAssignment extends Document {
  centerId?: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;

  title: string;
  description?: string;
  taskType: AssignmentTaskType;

  // Essay prompt
  prompt: string;

  // Teacher-defined grading criteria (VSTEP Writing)
  gradingCriteria?: IGradingCriteria;

  // Scheduling
  startDate?: Date | null;
  dueDate: Date;

  // State
  status: AssignmentStatus;
  maxAttempts: number;

  // Denormalised stats (updated async after each submission)
  stats: {
    submissionCount: number;
    gradedCount: number;
    averageScore: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ───────────────────────────────────────────────────────────
const AssignmentSchema = new Schema<IAssignment>(
  {
    centerId: {
      type: Schema.Types.ObjectId,
      ref: "Center",
      default: null,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "classId is required"],
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "teacherId is required"],
    },

    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [200, "Title must be at most 200 characters"],
    },

    description: {
      type: String,
      maxlength: [1000, "Description must be at most 1000 characters"],
      default: null,
    },

    taskType: {
      type: String,
      enum: ["task1", "task2"],
      required: [true, "taskType is required"],
    },

    prompt: {
      type: String,
      required: [true, "Prompt is required"],
      minlength: [10, "Prompt must be at least 10 characters"],
      maxlength: [5000, "Prompt must be at most 5000 characters"],
    },

    gradingCriteria: {
      overview: { type: String, default: null },
      requiredVocabulary: [
        {
          word: { type: String, default: null },
          synonyms: { type: [String], default: [] },
          importance: {
            type: String,
            enum: ["required", "recommended"],
            default: "required",
          },
        },
      ],
      bandDescriptors: [
        {
          band: { type: Number, default: null },
          descriptor: { type: String, default: null },
        },
      ],
      structureRequirements: { type: String, default: null },
      penaltyNotes: { type: String, default: null },
      additionalNotes: { type: String, default: null },
    },

    startDate: { type: Date, default: null },
    dueDate: { type: Date, required: [true, "dueDate is required"] },

    status: {
      type: String,
      enum: ["draft", "published", "closed"],
      default: "draft",
    },

    maxAttempts: {
      type: Number,
      default: 1,
      min: [1, "maxAttempts must be at least 1"],
      max: [10, "maxAttempts must be at most 10"],
    },

    stats: {
      submissionCount: { type: Number, default: 0 },
      gradedCount: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0, min: 0, max: 9 },
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
  }
);

// ── Indexes ───────────────────────────────────────────────────────────
AssignmentSchema.index({ centerId: 1, classId: 1, status: 1 });
AssignmentSchema.index({ centerId: 1, teacherId: 1 });
AssignmentSchema.index({ classId: 1, dueDate: 1 });
AssignmentSchema.index({ classId: 1, status: 1, dueDate: 1 });

// ── Model ─────────────────────────────────────────────────────────────
const Assignment: Model<IAssignment> =
  mongoose.model<IAssignment>("Assignment", AssignmentSchema);

export default Assignment;
