/**
 * assignmentService.ts  (Phase 4)
 *
 * Business rules:
 *  - Only teachers/admins of the same center can create/edit assignments.
 *  - An assignment can only target a class that belongs to the same center.
 *  - draft → published → closed (one-way transitions; can't unpublish once students have submitted).
 *  - Deleting a published assignment with submissions is blocked — use close instead.
 *  - centerId is NEVER taken from the request body; always from req.centerFilter.
 */

import mongoose from "mongoose"
import { Assignment, Class, User } from "../models/index"
import { IAssignment, AssignmentStatus, AssignmentTaskType } from "../models/Assignment"
import { AppError } from "../middlewares/errorHandler"

// ── Input types ───────────────────────────────────────────────────────

export interface CreateAssignmentInput {
  centerId:    string
  teacherId:   string
  classId:     string
  title:       string
  taskType:    AssignmentTaskType
  instructions: string
  description?: string
  dueDate?:    string | Date
  maxAttempts?: number
  gradingCriteria?: {
    minWords?:      number
    customPrompt?:  string
    showBreakdown?: boolean
  }
}

export interface UpdateAssignmentInput {
  title?:       string
  description?: string
  instructions?: string
  dueDate?:     string | Date | null
  maxAttempts?: number
  gradingCriteria?: {
    minWords?:      number | null
    customPrompt?:  string | null
    showBreakdown?: boolean
  }
}

export interface AssignmentListFilter {
  centerId:   string
  classId?:   string
  teacherId?: string
  status?:    AssignmentStatus
  taskType?:  AssignmentTaskType
  page?:      number
  limit?:     number
}

// ── Helpers ───────────────────────────────────────────────────────────

const assertClassBelongsToCenter = async (classId: string, centerId: string) => {
  const cls = await Class.findOne({
    _id:      new mongoose.Types.ObjectId(classId),
    centerId: new mongoose.Types.ObjectId(centerId),
    isActive: true,
  })
  if (!cls) throw new AppError("Class not found in this center", 404)
  return cls
}

const assertAssignmentEditable = (assignment: IAssignment) => {
  if (assignment.status === "closed") {
    throw new AppError("Cannot modify a closed assignment", 400)
  }
}

// ── Create ────────────────────────────────────────────────────────────

export const createAssignment = async (
  input: CreateAssignmentInput
): Promise<IAssignment> => {
  const {
    centerId, teacherId, classId, title, taskType,
    instructions, description, dueDate, maxAttempts, gradingCriteria,
  } = input

  await assertClassBelongsToCenter(classId, centerId)

  // Validate due date is in the future (if provided)
  if (dueDate) {
    const due = new Date(dueDate)
    if (due <= new Date()) throw new AppError("dueDate must be in the future", 400)
  }

  const assignment = await Assignment.create({
    centerId:    new mongoose.Types.ObjectId(centerId),
    classId:     new mongoose.Types.ObjectId(classId),
    teacherId:   new mongoose.Types.ObjectId(teacherId),
    title:       title.trim(),
    taskType,
    instructions: instructions.trim(),
    description:  description?.trim() ?? null,
    dueDate:      dueDate ? new Date(dueDate) : null,
    maxAttempts:  maxAttempts ?? 1,
    status:       "draft",
    gradingCriteria: {
      minWords:      gradingCriteria?.minWords      ?? null,
      customPrompt:  gradingCriteria?.customPrompt  ?? null,
      showBreakdown: gradingCriteria?.showBreakdown ?? true,
    },
  })

  return assignment
}

// ── List ──────────────────────────────────────────────────────────────

export const listAssignments = async (filter: AssignmentListFilter) => {
  const { centerId, classId, teacherId, status, taskType, page = 1, limit = 20 } = filter

  const query: Record<string, unknown> = {
    centerId: new mongoose.Types.ObjectId(centerId),
  }
  if (classId)   query.classId   = new mongoose.Types.ObjectId(classId)
  if (teacherId) query.teacherId = new mongoose.Types.ObjectId(teacherId)
  if (status)    query.status    = status
  if (taskType)  query.taskType  = taskType

  const skip = (page - 1) * limit
  const [assignments, total] = await Promise.all([
    Assignment.find(query)
      .populate("classId",   "name")
      .populate("teacherId", "name")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Assignment.countDocuments(query),
  ])

  return {
    assignments,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  }
}

// ── List for students — only published, non-expired ───────────────────
/**
 * Called from the student-facing endpoint.
 * Returns published assignments for the student's enrolled classes.
 */
export const listAssignmentsForStudent = async (
  classIds: mongoose.Types.ObjectId[],
  centerId: string,
  page = 1,
  limit = 20
) => {
  const now = new Date()
  const query = {
    centerId: new mongoose.Types.ObjectId(centerId),
    classId:  { $in: classIds },
    status:   "published",
    $or: [
      { dueDate: null },
      { dueDate: { $gte: now } },
    ],
  }

  const skip = (page - 1) * limit
  const [assignments, total] = await Promise.all([
    Assignment.find(query)
      .select("-gradingCriteria.customPrompt")  // don't leak AI prompt to students
      .populate("classId", "name")
      .skip(skip)
      .limit(limit)
      .sort({ dueDate: 1, createdAt: -1 }),
    Assignment.countDocuments(query),
  ])

  return {
    assignments,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  }
}

// ── Get single ────────────────────────────────────────────────────────

export const getAssignment = async (
  assignmentId: string,
  centerId:     string
): Promise<IAssignment> => {
  const assignment = await Assignment.findOne({
    _id:      new mongoose.Types.ObjectId(assignmentId),
    centerId: new mongoose.Types.ObjectId(centerId),
  })
    .populate("classId",   "name")
    .populate("teacherId", "name email")

  if (!assignment) throw new AppError("Assignment not found", 404)
  return assignment
}

// ── Update ────────────────────────────────────────────────────────────

export const updateAssignment = async (
  assignmentId: string,
  centerId:     string,
  input:        UpdateAssignmentInput
): Promise<IAssignment> => {
  const assignment = await Assignment.findOne({
    _id:      new mongoose.Types.ObjectId(assignmentId),
    centerId: new mongoose.Types.ObjectId(centerId),
  })
  if (!assignment) throw new AppError("Assignment not found", 404)
  assertAssignmentEditable(assignment)

  // Can't change instructions once published (students may already be mid-essay)
  if (assignment.status === "published" && input.instructions) {
    throw new AppError(
      "Cannot change instructions on a published assignment. Close it and create a new one.",
      400
    )
  }

  if (input.title       !== undefined) assignment.title        = input.title.trim()
  if (input.description !== undefined) assignment.description  = input.description?.trim() ?? undefined
  if (input.instructions !== undefined) assignment.instructions = input.instructions.trim()
  if (input.maxAttempts !== undefined) assignment.maxAttempts  = input.maxAttempts

  if (input.dueDate !== undefined) {
    if (input.dueDate === null) {
      assignment.dueDate = undefined
    } else {
      const due = new Date(input.dueDate)
      if (due <= new Date()) throw new AppError("dueDate must be in the future", 400)
      assignment.dueDate = due
    }
  }

  if (input.gradingCriteria) {
    const gc = input.gradingCriteria
    if (gc.minWords      !== undefined) assignment.gradingCriteria.minWords      = gc.minWords ?? undefined
    if (gc.customPrompt  !== undefined) assignment.gradingCriteria.customPrompt  = gc.customPrompt ?? undefined
    if (gc.showBreakdown !== undefined) assignment.gradingCriteria.showBreakdown = gc.showBreakdown
  }

  await assignment.save()
  return assignment
}

// ── Publish ───────────────────────────────────────────────────────────

export const publishAssignment = async (
  assignmentId: string,
  centerId:     string
): Promise<IAssignment> => {
  const assignment = await Assignment.findOne({
    _id:      new mongoose.Types.ObjectId(assignmentId),
    centerId: new mongoose.Types.ObjectId(centerId),
  })
  if (!assignment) throw new AppError("Assignment not found", 404)

  if (assignment.status === "published") {
    throw new AppError("Assignment is already published", 400)
  }
  if (assignment.status === "closed") {
    throw new AppError("Cannot re-publish a closed assignment", 400)
  }

  assignment.status = "published"
  await assignment.save()
  return assignment
}

// ── Close ─────────────────────────────────────────────────────────────
/**
 * Closes an assignment — no new submissions accepted.
 * This is the safe alternative to deletion when submissions exist.
 */
export const closeAssignment = async (
  assignmentId: string,
  centerId:     string
): Promise<IAssignment> => {
  const assignment = await Assignment.findOne({
    _id:      new mongoose.Types.ObjectId(assignmentId),
    centerId: new mongoose.Types.ObjectId(centerId),
  })
  if (!assignment) throw new AppError("Assignment not found", 404)

  if (assignment.status === "closed") {
    throw new AppError("Assignment is already closed", 400)
  }

  assignment.status = "closed"
  await assignment.save()
  return assignment
}

// ── Delete (drafts only) ──────────────────────────────────────────────

export const deleteAssignment = async (
  assignmentId: string,
  centerId:     string
): Promise<void> => {
  const assignment = await Assignment.findOne({
    _id:      new mongoose.Types.ObjectId(assignmentId),
    centerId: new mongoose.Types.ObjectId(centerId),
  })
  if (!assignment) throw new AppError("Assignment not found", 404)

  if (assignment.status !== "draft") {
    throw new AppError(
      "Only draft assignments can be deleted. Use close to retire a published assignment.",
      400
    )
  }

  await Assignment.findByIdAndDelete(assignmentId)
}

// ── Stats (for teacher dashboard) ────────────────────────────────────

export const getAssignmentStats = async (
  assignmentId: string,
  centerId:     string
) => {
  const assignment = await Assignment.findOne({
    _id:      new mongoose.Types.ObjectId(assignmentId),
    centerId: new mongoose.Types.ObjectId(centerId),
  }).select("title taskType status stats classId dueDate")

  if (!assignment) throw new AppError("Assignment not found", 404)

  // Count enrolled students in target class
  const enrolledCount = await User.countDocuments({
    classIds: assignment.classId,
    centerId: new mongoose.Types.ObjectId(centerId),
    role:     "student",
    isActive: true,
  })

  return {
    assignment,
    enrolledCount,
    submissionRate: enrolledCount > 0
      ? Math.round((assignment.stats.submissionCount / enrolledCount) * 100)
      : 0,
  }
}
