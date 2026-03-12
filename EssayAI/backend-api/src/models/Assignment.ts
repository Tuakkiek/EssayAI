import mongoose, { Document, Schema, Model } from "mongoose"

// ── Types ─────────────────────────────────────────────────────────────
export type AssignmentTaskType = "task1" | "task2"
export type AssignmentStatus   = "draft" | "published" | "closed"

export interface IGradingCriteria {
  /** Word count minimum the AI should enforce */
  minWords?:      number
  /** Extra instructions injected into the AI grading prompt */
  customPrompt?:  string
  /** Whether to show band score breakdown to student (default: true) */
  showBreakdown?: boolean
}

// ── Interface ─────────────────────────────────────────────────────────
export interface IAssignment extends Document {
  centerId:    mongoose.Types.ObjectId
  classId:     mongoose.Types.ObjectId
  teacherId:   mongoose.Types.ObjectId

  title:       string
  description?: string
  taskType:    AssignmentTaskType

  /**
   * The essay prompt shown to students.
   * For Task 1: usually a description of a chart/diagram.
   * For Task 2: the discursive question.
   */
  instructions: string

  dueDate?:    Date
  maxAttempts: number   // how many submissions each student can make (default: 1)

  status: AssignmentStatus   // draft → published → closed

  gradingCriteria: IGradingCriteria

  // Denormalised stats (updated async after each submission)
  stats: {
    submissionCount:  number
    gradedCount:      number
    averageScore:     number
  }

  createdAt: Date
  updatedAt: Date
}

// ── Schema ────────────────────────────────────────────────────────────
const AssignmentSchema = new Schema<IAssignment>(
  {
    centerId: {
      type:     Schema.Types.ObjectId,
      ref:      "Center",
      required: [true, "centerId is required"],
    },
    classId: {
      type:     Schema.Types.ObjectId,
      ref:      "Class",
      required: [true, "classId is required"],
    },
    teacherId: {
      type:     Schema.Types.ObjectId,
      ref:      "User",
      required: [true, "teacherId is required"],
    },

    title: {
      type:      String,
      required:  [true, "Title is required"],
      trim:      true,
      minlength: [3,    "Title must be at least 3 characters"],
      maxlength: [200,  "Title must be at most 200 characters"],
    },

    description: {
      type:      String,
      maxlength: [1000, "Description must be at most 1000 characters"],
      default:   null,
    },

    taskType: {
      type:     String,
      enum:     ["task1", "task2"],
      required: [true, "taskType is required"],
    },

    instructions: {
      type:      String,
      required:  [true, "Instructions are required"],
      minlength: [10,   "Instructions must be at least 10 characters"],
      maxlength: [5000, "Instructions must be at most 5000 characters"],
    },

    dueDate: {
      type:    Date,
      default: null,
    },

    maxAttempts: {
      type:    Number,
      default: 1,
      min:     [1,  "maxAttempts must be at least 1"],
      max:     [10, "maxAttempts must be at most 10"],
    },

    status: {
      type:    String,
      enum:    ["draft", "published", "closed"],
      default: "draft",
    },

    gradingCriteria: {
      minWords:      { type: Number, default: null },
      customPrompt:  { type: String, default: null, maxlength: 2000 },
      showBreakdown: { type: Boolean, default: true },
    },

    stats: {
      submissionCount: { type: Number, default: 0 },
      gradedCount:     { type: Number, default: 0 },
      averageScore:    { type: Number, default: 0, min: 0, max: 9 },
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

// ── Indexes ───────────────────────────────────────────────────────────
AssignmentSchema.index({ centerId: 1, classId: 1, status: 1 })
AssignmentSchema.index({ centerId: 1, teacherId: 1 })
AssignmentSchema.index({ classId: 1, dueDate: 1 })
// Students query: published assignments for their class
AssignmentSchema.index({ classId: 1, status: 1, dueDate: 1 })

// ── Model ─────────────────────────────────────────────────────────────
const Assignment: Model<IAssignment> =
  mongoose.model<IAssignment>("Assignment", AssignmentSchema)

export default Assignment
