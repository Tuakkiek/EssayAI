import mongoose, { Document, Schema, Model } from "mongoose"

// ── Types ────────────────────────────────────────────────────────────
export type EssayStatus = "pending" | "scoring" | "scored" | "error"
export type EssayTaskType = "task1" | "task2"

export interface IGrammarError {
  original: string
  corrected: string
  explanation: string
  position?: number
}

export interface ISuggestion {
  category: "vocabulary" | "structure" | "coherence" | "argument" | "general"
  text: string
}

export interface IScoreBreakdown {
  taskAchievement: number      // 0–9
  coherenceCohesion: number    // 0–9
  lexicalResource: number      // 0–9
  grammaticalRange: number     // 0–9
}

export interface ITeacherComment {
  teacherId: mongoose.Types.ObjectId
  teacherName: string
  comment: string
  createdAt: Date
  updatedAt: Date
}

export interface IEssay extends Document {
  userId: mongoose.Types.ObjectId
  centerId?: mongoose.Types.ObjectId
  prompt: string
  essayText: string
  wordCount: number
  taskType: EssayTaskType
  status: EssayStatus
  score?: number                     // 0–9 overall band
  scoreBreakdown?: IScoreBreakdown
  grammarErrors: IGrammarError[]
  suggestions: ISuggestion[]
  aiFeedback?: string                // full AI narrative
  aiModel?: string                   // which model produced this
  processingTimeMs?: number
  errorMessage?: string
  isReviewedByTeacher?: boolean
  teacherComment?: ITeacherComment
  createdAt: Date
  updatedAt: Date
}

// ── Sub-schemas ──────────────────────────────────────────────────────
const GrammarErrorSchema = new Schema<IGrammarError>(
  {
    original: { type: String, required: true },
    corrected: { type: String, required: true },
    explanation: { type: String, required: true },
    position: { type: Number, default: null },
  },
  { _id: false }
)

const SuggestionSchema = new Schema<ISuggestion>(
  {
    category: {
      type: String,
      enum: ["vocabulary", "structure", "coherence", "argument", "general"],
      default: "general",
    },
    text: { type: String, required: true },
  },
  { _id: false }
)

const ScoreBreakdownSchema = new Schema<IScoreBreakdown>(
  {
    taskAchievement: { type: Number, min: 0, max: 9 },
    coherenceCohesion: { type: Number, min: 0, max: 9 },
    lexicalResource: { type: Number, min: 0, max: 9 },
    grammaticalRange: { type: Number, min: 0, max: 9 },
  },
  { _id: false }
)

const TeacherCommentSchema = new Schema<ITeacherComment>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    teacherName: { type: String, required: true },
    comment: { type: String, required: true },
  },
  { timestamps: true, _id: false }
)

// ── Main Schema ──────────────────────────────────────────────────────
const EssaySchema = new Schema<IEssay>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    centerId: {
      type: Schema.Types.ObjectId,
      ref: "Center",
      default: null,
    },
    prompt: {
      type: String,
      required: [true, "Essay prompt is required"],
      trim: true,
      maxlength: [1000, "Prompt must be at most 1000 characters"],
    },
    essayText: {
      type: String,
      required: [true, "Essay text is required"],
      trim: true,
      minlength: [50, "Essay must be at least 50 characters"],
      maxlength: [10000, "Essay must be at most 10000 characters"],
    },
    wordCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taskType: {
      type: String,
      enum: ["task1", "task2"],
      default: "task2",
    },
    status: {
      type: String,
      enum: ["pending", "scoring", "scored", "error"],
      default: "pending",
    },
    score: {
      type: Number,
      min: 0,
      max: 9,
      default: null,
    },
    scoreBreakdown: {
      type: ScoreBreakdownSchema,
      default: null,
    },
    grammarErrors: {
      type: [GrammarErrorSchema],
      default: [],
    },
    suggestions: {
      type: [SuggestionSchema],
      default: [],
    },
    aiFeedback: {
      type: String,
      default: null,
    },
    aiModel: {
      type: String,
      default: null,
    },
    processingTimeMs: {
      type: Number,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    isReviewedByTeacher: {
      type: Boolean,
      default: false,
    },
    teacherComment: {
      type: TeacherCommentSchema,
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

// ── Virtual: word count helper ────────────────────────────────────────
// Utility: count words in essay text (called by controller before saving)
EssaySchema.virtual("computedWordCount").get(function (this: IEssay) {
  return this.essayText ? this.essayText.trim().split(/\s+/).filter(Boolean).length : 0
})

// ── Indexes ──────────────────────────────────────────────────────────
EssaySchema.index({ userId: 1, createdAt: -1 })
EssaySchema.index({ centerId: 1 })
EssaySchema.index({ status: 1 })
EssaySchema.index({ score: 1 })

// ── Model ─────────────────────────────────────────────────────────────
const Essay: Model<IEssay> = mongoose.model<IEssay>("Essay", EssaySchema)
export default Essay
