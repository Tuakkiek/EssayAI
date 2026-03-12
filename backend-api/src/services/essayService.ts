/**
 * essayService.ts  (Phase 5)
 *
 * Key invariants enforced here:
 *  1. centerId ALWAYS comes from req.centerFilter (JWT) — never from req.body.
 *  2. Students can only read/act on their own essays.
 *  3. Teachers can read all essays in their centerId scope.
 *  4. Before submitting to an assignment the service validates:
 *       a. Assignment exists and belongs to same centerId.
 *       b. Assignment status === "published".
 *       c. Student is enrolled in the assignment's class.
 *       d. Student has not exceeded maxAttempts for this assignment.
 *       e. Assignment is not past its dueDate.
 *  5. After creating an essay the Assignment.stats counters are updated async.
 */

import mongoose from "mongoose"
import Essay from "../models/Essay"
import { IEssay } from "../models/Essay"
import Assignment from "../models/Assignment"
import { User } from "../models/index"
import { AppError } from "../middlewares/errorHandler"

// ── Helpers ───────────────────────────────────────────────────────────

/** Counts words in an essay string */
const countWords = (text: string): number =>
  text.trim().split(/\s+/).filter(Boolean).length

// ── Submit essay ──────────────────────────────────────────────────────

export interface SubmitEssayInput {
  studentId:    string
  centerId:     string | null   // null for self-registered students (no training center)
  text:         string
  taskType:     "task1" | "task2"
  assignmentId?: string         // undefined = free-write
}

export const submitEssay = async (input: SubmitEssayInput): Promise<IEssay> => {
  const { studentId, centerId, text, taskType, assignmentId } = input

  if (!text || text.trim().length < 50) {
    throw new AppError("Essay must be at least 50 characters long", 400)
  }

  const wordCount = countWords(text)

  let attemptNumber = 1
  let classId: mongoose.Types.ObjectId | undefined

  // ── Quota check for self-registered students ──────────────────────
  if (!centerId) {
    const { checkSelfStudentLimit } = await import("./subscriptionService")
    const quota = await checkSelfStudentLimit(studentId)
    if (!quota.allowed) {
      throw new AppError(quota.reason ?? "Monthly essay limit reached", 429)
    }
  }

  // ── Assignment validation ─────────────────────────────────────────
  if (assignmentId) {
    // Self-registered students (centerId=null) cannot submit to center assignments
    if (!centerId) {
      throw new AppError("Bài tập do trung tâm tạo — bạn cần tài khoản trung tâm để nộp bài", 403)
    }
    const assignment = await Assignment.findOne({
      _id:      new mongoose.Types.ObjectId(assignmentId),
      centerId: new mongoose.Types.ObjectId(centerId),   // tenant isolation
    })

    if (!assignment) {
      throw new AppError("Assignment not found", 404)
    }
    if (assignment.status !== "published") {
      throw new AppError("This assignment is not accepting submissions", 400)
    }

    // Due date check
    if (assignment.dueDate && new Date() > assignment.dueDate) {
      throw new AppError("The submission deadline for this assignment has passed", 400)
    }

    // taskType must match
    if (assignment.taskType !== taskType) {
      throw new AppError(
        `This assignment requires Task ${assignment.taskType.replace("task", "")}`,
        400
      )
    }

    // Student must be enrolled in the assignment's class
    const student = await User.findOne({
      _id:      new mongoose.Types.ObjectId(studentId),
      centerId: new mongoose.Types.ObjectId(centerId),
      classIds: assignment.classId,
    })
    if (!student) {
      throw new AppError("You are not enrolled in the class for this assignment", 403)
    }

    // Count existing attempts
    const previousAttempts = await Essay.countDocuments({
      studentId:    new mongoose.Types.ObjectId(studentId),
      assignmentId: new mongoose.Types.ObjectId(assignmentId),
    })
    if (previousAttempts >= assignment.maxAttempts) {
      throw new AppError(
        `You have used all ${assignment.maxAttempts} attempt(s) for this assignment`,
        400
      )
    }

    // Min words check (if set)
    if (assignment.gradingCriteria.minWords && wordCount < assignment.gradingCriteria.minWords) {
      throw new AppError(
        `Your essay has ${wordCount} words. This assignment requires at least ${assignment.gradingCriteria.minWords} words.`,
        400
      )
    }

    attemptNumber = previousAttempts + 1
    classId       = assignment.classId
  }

  // ── Create essay document ─────────────────────────────────────────
  const essay = await Essay.create({
    centerId:      centerId ? new mongoose.Types.ObjectId(centerId) : null,
    studentId:     new mongoose.Types.ObjectId(studentId),
    assignmentId:  assignmentId ? new mongoose.Types.ObjectId(assignmentId) : null,
    classId:       classId ?? null,
    taskType,
    originalText:  text.trim(),
    wordCount,
    attemptNumber,
    status:        "pending",
    isReviewedByTeacher: false,
  })

  // ── Async: bump Assignment.stats.submissionCount ─────────────────
  if (assignmentId) {
    Assignment.findByIdAndUpdate(assignmentId, {
      $inc: { "stats.submissionCount": 1 },
    }).catch(() => { /* non-critical, don't fail the request */ })
  }

  // ── Async: bump User.stats.essaysSubmitted ────────────────────────
  User.findByIdAndUpdate(studentId, {
    $inc: { "stats.essaysSubmitted": 1 },
    $set: { "stats.lastActiveAt":    new Date() },
  }).catch(() => { /* non-critical */ })

  return essay
}

// ── List essays (students see own; teachers see all in center) ────────

export interface EssayListFilter {
  centerId:      string | null
  requesterId:   string
  requesterRole: string
  assignmentId?: string
  classId?:      string
  status?:       string
  isReviewed?:   boolean
  page?:         number
  limit?:        number
}

export const listEssays = async (filter: EssayListFilter) => {
  const {
    centerId, requesterId, requesterRole,
    assignmentId, classId, status, isReviewed,
    page = 1, limit = 20,
  } = filter

  const query: Record<string, unknown> = {}

  // Self-registered students have centerId=null — scope by studentId only
  if (centerId) {
    query.centerId = new mongoose.Types.ObjectId(centerId)
  } else {
    // Must scope by studentId when there is no centerId
    query.studentId = new mongoose.Types.ObjectId(requesterId)
    query.centerId  = null
  }

  // Center-based students also only see their own essays
  if (requesterRole === "student" && centerId) {
    query.studentId = new mongoose.Types.ObjectId(requesterId)
  }

  if (assignmentId) query.assignmentId = new mongoose.Types.ObjectId(assignmentId)
  if (classId)      query.classId      = new mongoose.Types.ObjectId(classId)
  if (status)       query.status       = status
  if (isReviewed !== undefined) query.isReviewedByTeacher = isReviewed

  const skip = (page - 1) * limit
  const [essays, total] = await Promise.all([
    Essay.find(query)
      .populate("studentId",    "name phone")
      .populate("assignmentId", "title taskType")
      .select("-originalText")   // omit full text from list view (expensive payload)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Essay.countDocuments(query),
  ])

  return {
    essays,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  }
}

// ── Get single essay ──────────────────────────────────────────────────

export const getEssay = async (
  essayId:       string,
  requesterId:   string,
  requesterRole: string,
  centerId:      string | null
): Promise<IEssay> => {
  const query: Record<string, unknown> = {
    _id: new mongoose.Types.ObjectId(essayId),
  }
  if (centerId) {
    query.centerId = new mongoose.Types.ObjectId(centerId)
  } else {
    query.centerId = null  // self-registered student scope
  }

  // Students can only fetch their own
  if (requesterRole === "student") {
    query.studentId = new mongoose.Types.ObjectId(requesterId)
  }

  const essay = await Essay.findOne(query)
    .populate("studentId",    "name phone")
    .populate("assignmentId", "title taskType instructions gradingCriteria")
    .populate("reviewedBy",   "name")

  if (!essay) throw new AppError("Essay not found", 404)
  return essay
}

// ── Teacher: add review note ──────────────────────────────────────────

export const reviewEssay = async (
  essayId:    string,
  centerId:   string,
  teacherId:  string,
  note?:      string
): Promise<IEssay> => {
  const essayQuery: Record<string, unknown> = {
    _id: new mongoose.Types.ObjectId(essayId),
  }
  if (centerId) {
    essayQuery.centerId = new mongoose.Types.ObjectId(centerId)
  }
  const essay = await Essay.findOne(essayQuery)
  if (!essay) throw new AppError("Essay not found", 404)

  essay.isReviewedByTeacher = true
  essay.reviewedAt          = new Date()
  essay.reviewedBy          = new mongoose.Types.ObjectId(teacherId)
  if (note !== undefined) essay.teacherNote = note.trim() || undefined

  await essay.save()

  // Bump Assignment graded count (non-critical)
  if (essay.assignmentId) {
    Assignment.findByIdAndUpdate(essay.assignmentId, {
      $inc: { "stats.gradedCount": 1 },
    }).catch(() => {})
  }

  return essay
}

// ── Internal: AI worker callback — saves grading results ─────────────
/**
 * Called by the background grading worker (not by any HTTP handler directly).
 * Updates the essay with AI-generated scores and feedback.
 * If the AI fails, sets status = "error" with errorMessage.
 */
export interface GradeEssayResult {
  overallScore:    number
  scoreBreakdown:  IEssay["scoreBreakdown"]
  feedback:        string
  grammarErrors:   IEssay["grammarErrors"]
  suggestions:     IEssay["suggestions"]
}

export const saveGradingResult = async (
  essayId: string,
  result:  GradeEssayResult | { error: string }
): Promise<void> => {
  if ("error" in result) {
    await Essay.findByIdAndUpdate(essayId, {
      status:       "error",
      errorMessage: result.error,
    })
    return
  }

  const { overallScore, scoreBreakdown, feedback, grammarErrors, suggestions } = result

  await Essay.findByIdAndUpdate(essayId, {
    status:         "graded",
    overallScore,
    scoreBreakdown,
    feedback,
    grammarErrors,
    suggestions,
    gradedAt:       new Date(),
    errorMessage:   null,
  })

  // Recompute student averageScore (async, non-blocking)
  const essay = await Essay.findById(essayId).select("studentId centerId")
  if (essay) {
    const agg = await Essay.aggregate([
      {
        $match: {
          studentId: essay.studentId,
          status:    "graded",
        },
      },
      {
        $group: {
          _id:          "$studentId",
          avgScore:     { $avg: "$overallScore" },
        },
      },
    ])
    const avg = agg[0]?.avgScore ?? 0
    User.findByIdAndUpdate(essay.studentId, {
      "stats.averageScore": Math.round(avg * 10) / 10,  // round to 1dp
    }).catch(() => {})
  }
}

// ── Student: delete own pending essay ─────────────────────────────────
/**
 * Students may retract an essay only while it is still "pending" (not yet graded).
 */
export const deleteEssay = async (
  essayId:   string,
  studentId: string,
  centerId:  string | null
): Promise<void> => {
  const deleteQuery: Record<string, unknown> = {
    _id:       new mongoose.Types.ObjectId(essayId),
    studentId: new mongoose.Types.ObjectId(studentId),
  }
  if (centerId) {
    deleteQuery.centerId = new mongoose.Types.ObjectId(centerId)
  } else {
    deleteQuery.centerId = null
  }
  const essay = await Essay.findOne(deleteQuery)
  if (!essay) throw new AppError("Essay not found", 404)
  if (essay.status !== "pending") {
    throw new AppError("Only pending essays can be retracted", 400)
  }

  await Essay.findByIdAndDelete(essayId)

  // Undo submission counter
  if (essay.assignmentId) {
    Assignment.findByIdAndUpdate(essay.assignmentId, {
      $inc: { "stats.submissionCount": -1 },
    }).catch(() => {})
  }
  User.findByIdAndUpdate(studentId, {
    $inc: { "stats.essaysSubmitted": -1 },
  }).catch(() => {})
}
