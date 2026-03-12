import mongoose, { Document, Schema, Model } from "mongoose"

// ── Types ─────────────────────────────────────────────────────────────
export type EssayStatus   = "pending" | "grading" | "graded" | "error"
export type EssayTaskType = "task1" | "task2"

export interface IGrammarError {
  offset?:     number   // character index in originalText
  length?:     number   // span length
  message?:    string   // human-readable description
  type?:       "grammar" | "spelling" | "punctuation" | "style"
  suggestions?: string[] // replacement options

  // From legacy AI format
  original?:    string
  corrected?:   string
  explanation?: string
}

export interface ISuggestion {
  type?:       "vocabulary" | "coherence" | "structure" | "task_achievement"
  original?:   string
  improved?:   string
  explanation?: string

  // From legacy AI format
  category?:   string
  text?:       string
}

export interface IScoreBreakdown {
  // IELTS Task 2 (4 criteria)
  taskAchievement?:       number  // TA
  coherenceCohesion?:     number  // CC
  lexicalResource?:       number  // LR
  grammaticalRangeAccuracy?: number  // GRA

  // IELTS Task 1 (same 4, TA replaced by Task Response)
  taskResponse?:          number

  // Each criterion is 0–9 band, can be 0.5 increments
}

// ── Interface ─────────────────────────────────────────────────────────
export interface IEssay extends Document {
  // ── Tenancy & ownership ─────────────────────────────────────────────
  centerId:      mongoose.Types.ObjectId  // from JWT — NEVER from request body
  studentId:     mongoose.Types.ObjectId

  // ── Assignment link (Phase 5) ────────────────────────────────────────
  assignmentId?: mongoose.Types.ObjectId  // null = free-write (no assignment)
  classId?:      mongoose.Types.ObjectId  // denormalised from assignment for fast queries

  // ── Submission ────────────────────────────────────────────────────────
  taskType:      EssayTaskType
  originalText:  string
  wordCount:     number
  attemptNumber: number  // 1-based, bounded by assignment.maxAttempts

  // ── Grading (populated by AI worker) ─────────────────────────────────
  status:         EssayStatus
  overallScore?:  number            // 0–9 IELTS band
  scoreBreakdown?: IScoreBreakdown
  feedback?:      string            // AI-generated paragraph feedback
  grammarErrors?: IGrammarError[]
  suggestions?:   ISuggestion[]
  gradedAt?:      Date
  errorMessage?:  string            // set when status === "error"

  // ── Teacher review ────────────────────────────────────────────────────
  isReviewedByTeacher: boolean
  teacherNote?:        string       // optional comment added by teacher
  reviewedAt?:         Date
  reviewedBy?:         mongoose.Types.ObjectId

  createdAt: Date
  updatedAt: Date
}

// ── Schema ────────────────────────────────────────────────────────────
const EssaySchema = new Schema<IEssay>(
  {
    // ── Tenancy ─────────────────────────────────────────────────────────
    centerId: {
      type:     Schema.Types.ObjectId,
      ref:      "Center",
      required: [true, "centerId is required"],
    },
    studentId: {
      type:     Schema.Types.ObjectId,
      ref:      "User",
      required: [true, "studentId is required"],
    },
    assignmentId: {
      type:    Schema.Types.ObjectId,
      ref:     "Assignment",
      default: null,
    },
    classId: {
      type:    Schema.Types.ObjectId,
      ref:     "Class",
      default: null,
    },

    // ── Submission ────────────────────────────────────────────────────
    taskType: {
      type:     String,
      enum:     ["task1", "task2"],
      required: [true, "taskType is required"],
    },
    originalText: {
      type:      String,
      required:  [true, "Essay text is required"],
      minlength: [50,   "Essay must be at least 50 characters"],
      maxlength: [20000,"Essay must be at most 20000 characters"],
    },
    wordCount: {
      type:    Number,
      required:true,
      min:     1,
    },
    attemptNumber: {
      type:    Number,
      default: 1,
      min:     1,
    },

    // ── Grading ───────────────────────────────────────────────────────
    status: {
      type:    String,
      enum:    ["pending", "grading", "graded", "error"],
      default: "pending",
    },
    overallScore: {
      type: Number, min: 0, max: 9, default: null,
    },
    scoreBreakdown: {
      taskAchievement:          { type: Number, min: 0, max: 9, default: null },
      coherenceCohesion:         { type: Number, min: 0, max: 9, default: null },
      lexicalResource:           { type: Number, min: 0, max: 9, default: null },
      grammaticalRangeAccuracy:  { type: Number, min: 0, max: 9, default: null },
      taskResponse:              { type: Number, min: 0, max: 9, default: null },
    },
    feedback:     { type: String, default: null },
    grammarErrors:{ type: [Schema.Types.Mixed], default: [] },
    suggestions:  { type: [Schema.Types.Mixed], default: [] },
    gradedAt:     { type: Date,   default: null },
    errorMessage: { type: String, default: null },

    // ── Teacher review ────────────────────────────────────────────────
    isReviewedByTeacher: { type: Boolean, default: false },
    teacherNote:         { type: String,  default: null  },
    reviewedAt:          { type: Date,    default: null  },
    reviewedBy: {
      type:    Schema.Types.ObjectId,
      ref:     "User",
      default: null,
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
// Primary student query: "my essays"
EssaySchema.index({ centerId: 1, studentId: 1, createdAt: -1 })
// Teacher dashboard: "essays for my class/assignment"
EssaySchema.index({ centerId: 1, assignmentId: 1, status: 1 })
EssaySchema.index({ centerId: 1, classId: 1, status: 1 })
// Unreviewed essays queue for teacher
EssaySchema.index({ centerId: 1, isReviewedByTeacher: 1, status: 1 })
// Uniqueness: one essay per student per assignment per attempt
EssaySchema.index(
  { studentId: 1, assignmentId: 1, attemptNumber: 1 },
  { unique: true, sparse: true }   // sparse: null assignmentId (free-writes) excluded
)

// ── Model ─────────────────────────────────────────────────────────────
const Essay: Model<IEssay> = mongoose.model<IEssay>("Essay", EssaySchema)
export default Essay
