/**
 * assignment.controller.ts  (Phase 4)
 */

import { Request, Response, NextFunction } from "express"
import { sendSuccess, sendCreated, sendBadRequest } from "../utils/response"
import {
  createAssignment,
  listAssignments,
  listAssignmentsForStudent,
  getAssignment,
  updateAssignment,
  publishAssignment,
  closeAssignment,
  deleteAssignment,
  getAssignmentStats,
} from "../services/assignmentService"
import { User } from "../models/index"
import mongoose from "mongoose"

// ── POST /api/assignments ──────────────────────────────────────────────
export const createAssignmentHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const { classId, title, taskType, prompt, description,
            startDate, dueDate, maxAttempts, gradingCriteria, status } = req.body

    if (!classId || !title || !taskType || !prompt || !dueDate) {
      sendBadRequest(res, "Missing required fields: classId, title, taskType, prompt, dueDate")
      return
    }
    if (!["task1", "task2"].includes(taskType)) {
      sendBadRequest(res, "taskType must be 'task1' or 'task2'")
      return
    }

    const assignment = await createAssignment({
      centerId:    req.centerFilter!.centerId,
      teacherId:   req.user!.userId,
      classId, title, taskType, prompt,
      description, startDate, dueDate, maxAttempts, gradingCriteria, status,
    })

    sendCreated(res, { assignment }, "Assignment created")
  } catch (err) { next(err) }
}

// ── GET /api/assignments ───────────────────────────────────────────────
export const listAssignmentsHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const { classId, status, taskType, page, limit } = req.query
    const role = req.user!.role

    // Students see only their own published assignments via a dedicated endpoint —
    // this general list is teacher/admin only and handled in student.routes.ts
    const isAdminRole = ["admin"].includes(role)
    const teacherFilter = !isAdminRole ? req.user!.userId : undefined

    const result = await listAssignments({
      centerId:  req.centerFilter!.centerId,
      classId:   classId   as string | undefined,
      teacherId: teacherFilter,
      status:    status    as string | undefined as any,
      taskType:  taskType  as string | undefined as any,
      page:      page  ? parseInt(page  as string, 10) : undefined,
      limit:     limit ? parseInt(limit as string, 10) : undefined,
    })

    sendSuccess(res, result)
  } catch (err) { next(err) }
}

// ── GET /api/assignments/my — student-facing ──────────────────────────
/**
 * Returns published, non-expired assignments for the logged-in student's classes.
 */
export const listMyAssignmentsHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const { page, limit } = req.query

    // Fetch the student's enrolled classIds
    const student = await User.findById(req.user!.userId).select("classIds")
    if (!student || student.classIds.length === 0) {
      sendSuccess(res, { assignments: [], pagination: { total: 0, page: 1, limit: 20, pages: 0 } })
      return
    }

    const result = await listAssignmentsForStudent(
      student.classIds as mongoose.Types.ObjectId[],
      req.centerFilter!.centerId,
      page  ? parseInt(page  as string, 10) : undefined,
      limit ? parseInt(limit as string, 10) : undefined,
    )

    sendSuccess(res, result)
  } catch (err) { next(err) }
}

// ── GET /api/assignments/:id ───────────────────────────────────────────
export const getAssignmentHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const assignment = await getAssignment(req.params.id as string, req.centerFilter!.centerId)
    sendSuccess(res, { assignment })
  } catch (err) { next(err) }
}

// ── GET /api/assignments/:id/stats ─────────────────────────────────────
export const getAssignmentStatsHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const data = await getAssignmentStats(req.params.id as string, req.centerFilter!.centerId)
    sendSuccess(res, data)
  } catch (err) { next(err) }
}

// ── PATCH /api/assignments/:id ─────────────────────────────────────────
export const updateAssignmentHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const assignment = await updateAssignment(
      req.params.id as string,
      req.centerFilter!.centerId,
      req.body
    )
    sendSuccess(res, { assignment }, "Assignment updated")
  } catch (err) { next(err) }
}

// ── POST /api/assignments/:id/publish ──────────────────────────────────
export const publishAssignmentHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const assignment = await publishAssignment(req.params.id as string, req.centerFilter!.centerId)
    sendSuccess(res, { assignment }, "Assignment published — students can now submit")
  } catch (err) { next(err) }
}

// ── POST /api/assignments/:id/close ───────────────────────────────────
export const closeAssignmentHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const assignment = await closeAssignment(req.params.id as string, req.centerFilter!.centerId)
    sendSuccess(res, { assignment }, "Assignment closed — no new submissions accepted")
  } catch (err) { next(err) }
}

// ── DELETE /api/assignments/:id ───────────────────────────────────────
export const deleteAssignmentHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    await deleteAssignment(req.params.id as string, req.centerFilter!.centerId)
    sendSuccess(res, null, "Assignment deleted")
  } catch (err) { next(err) }
}
