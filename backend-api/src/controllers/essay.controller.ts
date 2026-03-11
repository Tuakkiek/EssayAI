import { Request, Response, NextFunction } from "express"
import mongoose from "mongoose"
import { sendSuccess, sendCreated, sendError, sendNotFound } from "../utils/response"
import { logger } from "../utils/logger"
import { scoreEssayWithAI } from "../services/aiService"
import { EssayTaskType } from "../models/Essay"
import {
  createEssay,
  applyAIScore,
  markEssayError,
  getHistory,
  getEssayById,
  deleteEssay,
  getUserStats,
} from "../services/essayService"

// ── POST /api/essay/score ──────────────────────────────────────────
export const scoreEssay = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const {
    essayText,
    prompt,
    taskType = "task2",
    userId,
    centerId,
  } = req.body as {
    essayText: string
    prompt?: string
    taskType?: EssayTaskType
    userId?: string
    centerId?: string
  }

  const resolvedUserId = userId ?? new mongoose.Types.ObjectId().toString()
  const wordCount = essayText.trim().split(/\s+/).filter(Boolean).length

  // Step 1 — Persist essay immediately with status "scoring"
  let essay
  try {
    essay = await createEssay({
      userId: resolvedUserId,
      centerId,
      prompt: prompt || "No prompt provided",
      essayText,
      taskType,
      status: "scoring",
    })
    logger.info("Essay created, starting AI scoring", { essayId: essay._id })
  } catch (err) {
    next(err)
    return
  }

  // Step 2 — Call Together AI
  try {
    const result = await scoreEssayWithAI({
      essayText,
      prompt: prompt || "Write an IELTS essay on the given topic.",
      taskType,
      wordCount,
    })

    // Step 3 — Persist AI results and sync user stats
    const scored = await applyAIScore(essay._id as mongoose.Types.ObjectId, result)

    sendSuccess(
      res,
      {
        essayId: scored._id,
        score: scored.score,
        scoreBreakdown: scored.scoreBreakdown,
        grammarErrors: scored.grammarErrors,
        suggestions: scored.suggestions,
        aiFeedback: scored.aiFeedback,
        wordCount: scored.wordCount,
        taskType: scored.taskType,
        processingTimeMs: scored.processingTimeMs,
        createdAt: scored.createdAt,
      },
      "Essay scored successfully"
    )
  } catch (err) {
    // Step 4 — Persist error state so the client can see what happened
    const errorMessage = err instanceof Error ? err.message : "Unknown AI error"
    await markEssayError(essay._id as mongoose.Types.ObjectId, errorMessage)
    next(err)
  }
}

// ── POST /api/essay ────────────────────────────────────────────────
export const createEssayHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { prompt, essayText, taskType, userId, centerId } = req.body as {
      prompt: string
      essayText: string
      taskType?: EssayTaskType
      userId: string
      centerId?: string
    }

    const essay = await createEssay({ prompt, essayText, taskType, userId, centerId })
    sendCreated(res, essay, "Essay saved successfully")
  } catch (error) {
    next(error)
  }
}

// ── GET /api/essay/history ─────────────────────────────────────────
export const getEssayHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const q = req.query as Record<string, string>

    if (!q["userId"]) {
      sendError(res, "userId query param is required", 400)
      return
    }

    const result = await getHistory({
      userId: q["userId"],
      page: q["page"] ? parseInt(q["page"], 10) : 1,
      limit: q["limit"] ? parseInt(q["limit"], 10) : 10,
      status: q["status"] as import("../models/Essay").EssayStatus | undefined,
      taskType: q["taskType"] as EssayTaskType | undefined,
      sortBy: (q["sortBy"] as "createdAt" | "score") || "createdAt",
      sortOrder: (q["sortOrder"] as "asc" | "desc") || "desc",
      fromDate: q["fromDate"],
      toDate: q["toDate"],
    })

    sendSuccess(res, result)
  } catch (error) {
    next(error)
  }
}

// ── GET /api/essay/stats ───────────────────────────────────────────
export const getEssayStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.query["userId"] as string | undefined

    if (!userId) {
      sendError(res, "userId query param is required", 400)
      return
    }

    const stats = await getUserStats(userId)
    sendSuccess(res, stats)
  } catch (error) {
    next(error)
  }
}

// ── GET /api/essay/:id ─────────────────────────────────────────────
export const getEssayByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params["id"] as string
    const userId = req.query["userId"] as string | undefined

    const essay = await getEssayById(id, userId)

    if (!essay) {
      // Could be not found OR invalid ID — getEssayById returns null for both
      if (!mongoose.Types.ObjectId.isValid(id)) {
        sendError(res, "Invalid essay ID", 400)
      } else {
        sendNotFound(res, "Essay not found")
      }
      return
    }

    sendSuccess(res, essay)
  } catch (error) {
    next(error)
  }
}

// ── DELETE /api/essay/:id ──────────────────────────────────────────
export const deleteEssayHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params["id"] as string
    const userId = req.query["userId"] as string | undefined

    if (!userId) {
      sendError(res, "userId query param is required", 400)
      return
    }

    const deleted = await deleteEssay(id, userId)

    if (!deleted) {
      sendNotFound(res, "Essay not found or not owned by this user")
      return
    }

    sendSuccess(res, { deleted: true, essayId: id }, "Essay deleted successfully")
  } catch (error) {
    next(error)
  }
}
