/**
 * essay.controller.ts  (Phase 5 + self-student update)
 *
 * centerId is ALWAYS taken from req.centerFilter — never from req.body.
 * req.centerFilter is undefined for self-registered students (centerId=null).
 * Services handle null centerId correctly.
 */

import { Request, Response, NextFunction } from "express"
import mongoose from "mongoose"
import { sendSuccess, sendCreated, sendBadRequest } from "../utils/response"
import {
  submitEssay,
  listEssays,
  getEssay,
  reviewEssay,
  deleteEssay,
} from "../services/essayService"

const isValidObjectId = (id: unknown): id is string =>
  typeof id === "string" && mongoose.Types.ObjectId.isValid(id)

// ── POST /api/essays ───────────────────────────────────────────────────
export const submitEssayHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const { text, taskType, assignmentId } = req.body

    if (!text || !taskType) {
      sendBadRequest(res, "Missing required fields: text, taskType")
      return
    }
    if (!["task1", "task2"].includes(taskType)) {
      sendBadRequest(res, "taskType must be 'task1' or 'task2'")
      return
    }

    const essay = await submitEssay({
      studentId:    req.user!.userId,
      centerId:     req.centerFilter?.centerId ?? null,  // ← from JWT, not body
      text,
      taskType,
      assignmentId: assignmentId ?? undefined,
    })

    sendCreated(res, { essay }, "Essay submitted — grading in progress")
  } catch (err) { next(err) }
}

// ── GET /api/essays ────────────────────────────────────────────────────
export const listEssaysHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const { assignmentId, classId, status, isReviewed, page, limit } = req.query
    if (assignmentId && !isValidObjectId(assignmentId)) {
      sendBadRequest(res, "Invalid assignment id")
      return
    }
    if (classId && !isValidObjectId(classId)) {
      sendBadRequest(res, "Invalid class id")
      return
    }

    const result = await listEssays({
      centerId:      req.centerFilter?.centerId ?? null,
      requesterId:   req.user!.userId,
      requesterRole: req.user!.role,
      assignmentId:  assignmentId as string | undefined,
      classId:       classId     as string | undefined,
      status:        status      as string | undefined,
      isReviewed:    isReviewed === "true"  ? true
                   : isReviewed === "false" ? false
                   : undefined,
      page:          page  ? parseInt(page  as string, 10) : undefined,
      limit:         limit ? parseInt(limit as string, 10) : undefined,
    })

    sendSuccess(res, result)
  } catch (err) { next(err) }
}

// ── GET /api/essays/:id ────────────────────────────────────────────────
export const getEssayHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    if (!isValidObjectId(req.params.id)) {
      sendBadRequest(res, "Invalid essay id")
      return
    }
    const essay = await getEssay(
      req.params.id as string,
      req.user!.userId,
      req.user!.role,
      req.centerFilter?.centerId ?? null
    )
    sendSuccess(res, { essay })
  } catch (err) { next(err) }
}

// ── POST /api/essays/:id/review ────────────────────────────────────────
export const reviewEssayHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    if (!isValidObjectId(req.params.id)) {
      sendBadRequest(res, "Invalid essay id")
      return
    }
    const { note } = req.body
    const essay = await reviewEssay(
      req.params.id as string,
      req.centerFilter!.centerId,
      req.user!.userId,
      note
    )
    sendSuccess(res, { essay }, "Essay marked as reviewed")
  } catch (err) { next(err) }
}

// ── DELETE /api/essays/:id ─────────────────────────────────────────────
export const deleteEssayHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    if (!isValidObjectId(req.params.id)) {
      sendBadRequest(res, "Invalid essay id")
      return
    }
    await deleteEssay(
      req.params.id as string,
      req.user!.userId,
      req.centerFilter?.centerId ?? null
    )
    sendSuccess(res, null, "Essay retracted successfully")
  } catch (err) { next(err) }
}
