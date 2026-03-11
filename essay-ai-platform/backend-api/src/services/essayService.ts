import mongoose from "mongoose"
import { Essay, User, IEssay, EssayStatus, EssayTaskType } from "../models/index"
import { ScoringResult } from "./aiService"
import { logger } from "../utils/logger"

// ── Types ─────────────────────────────────────────────────────────
export interface CreateEssayInput {
  userId: string
  centerId?: string
  prompt: string
  essayText: string
  taskType?: EssayTaskType
  status?: EssayStatus
}

export interface HistoryQuery {
  userId: string
  page?: number
  limit?: number
  status?: EssayStatus
  taskType?: EssayTaskType
  sortBy?: "createdAt" | "score"
  sortOrder?: "asc" | "desc"
  fromDate?: string
  toDate?: string
}

export interface HistoryResult {
  essays: Partial<IEssay>[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface UserEssayStats {
  totalEssays: number
  scoredEssays: number
  averageScore: number
  highestScore: number
  lowestScore: number
  averageWordCount: number
  scoresByMonth: { month: string; avgScore: number; count: number }[]
  scoreDistribution: { band: string; count: number }[]
  taskTypeBreakdown: { taskType: string; count: number; avgScore: number }[]
  recentActivity: { date: string; score: number | null; status: EssayStatus }[]
  improvement: number | null   // score delta between first and most recent scored essay
}

// ── Create essay (pending — no AI yet) ────────────────────────────
export const createEssay = async (input: CreateEssayInput): Promise<IEssay> => {
  const wordCount = input.essayText.trim().split(/\s+/).filter(Boolean).length

  const essay = new Essay({
    userId: new mongoose.Types.ObjectId(input.userId),
    centerId: input.centerId ? new mongoose.Types.ObjectId(input.centerId) : undefined,
    prompt: input.prompt,
    essayText: input.essayText,
    taskType: input.taskType ?? "task2",
    wordCount,
    status: input.status ?? "pending",
  })

  await essay.save()
  logger.info("Essay created", { essayId: essay._id, wordCount })
  return essay
}

// ── Persist AI scoring result onto an existing essay ─────────────
export const applyAIScore = async (
  essayId: mongoose.Types.ObjectId,
  result: ScoringResult
): Promise<IEssay> => {
  const essay = await Essay.findById(essayId)
  if (!essay) throw new Error(`Essay ${essayId} not found`)

  essay.status = "scored"
  essay.score = result.score
  essay.scoreBreakdown = result.scoreBreakdown
  essay.grammarErrors = result.grammarErrors
  essay.suggestions = result.suggestions
  essay.aiFeedback = result.aiFeedback
  essay.aiModel = result.aiModel
  essay.processingTimeMs = result.processingTimeMs

  await essay.save()

  // Update user stats asynchronously (don't block the response)
  syncUserStats(essay.userId.toString()).catch((err) =>
    logger.error("Failed to sync user stats", { userId: essay.userId, err })
  )

  logger.info("AI results saved to essay", { essayId, score: result.score })
  return essay
}

// ── Mark essay as error ───────────────────────────────────────────
export const markEssayError = async (
  essayId: mongoose.Types.ObjectId,
  errorMessage: string
): Promise<void> => {
  await Essay.findByIdAndUpdate(essayId, {
    status: "error",
    errorMessage,
  })
  logger.warn("Essay marked as error", { essayId, errorMessage })
}

// ── Get paginated history with filters ────────────────────────────
export const getHistory = async (query: HistoryQuery): Promise<HistoryResult> => {
  const {
    userId,
    page = 1,
    limit = 10,
    status,
    taskType,
    sortBy = "createdAt",
    sortOrder = "desc",
    fromDate,
    toDate,
  } = query

  const pageNum = Math.max(1, page)
  const limitNum = Math.min(50, Math.max(1, limit))
  const skip = (pageNum - 1) * limitNum

  // Build filter
  const filter: Record<string, unknown> = { userId }
  if (status) filter["status"] = status
  if (taskType) filter["taskType"] = taskType
  if (fromDate || toDate) {
    const dateFilter: Record<string, Date> = {}
    if (fromDate) dateFilter["$gte"] = new Date(fromDate)
    if (toDate) dateFilter["$lte"] = new Date(toDate)
    filter["createdAt"] = dateFilter
  }

  const sortDir = sortOrder === "asc" ? 1 : -1
  const sort: Record<string, 1 | -1> = { [sortBy]: sortDir }
  // Secondary sort for stability
  if (sortBy !== "createdAt") sort["createdAt"] = -1

  const [essays, total] = await Promise.all([
    Essay.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .select("-grammarErrors -suggestions -aiFeedback -essayText"),
    Essay.countDocuments(filter),
  ])

  const totalPages = Math.ceil(total / limitNum)

  return {
    essays,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
    },
  }
}

// ── Get single essay by ID ─────────────────────────────────────────
export const getEssayById = async (
  id: string,
  userId?: string
): Promise<IEssay | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null

  const filter: Record<string, unknown> = { _id: id }
  // Optionally scope to the requesting user (authorization)
  if (userId) filter["userId"] = userId

  return Essay.findOne(filter)
}

// ── Delete essay ──────────────────────────────────────────────────
export const deleteEssay = async (
  id: string,
  userId: string
): Promise<boolean> => {
  if (!mongoose.Types.ObjectId.isValid(id)) return false

  const result = await Essay.findOneAndDelete({ _id: id, userId })
  if (!result) return false

  // Re-sync user stats after deletion
  syncUserStats(userId).catch((err) =>
    logger.error("Failed to sync user stats after delete", { userId, err })
  )

  logger.info("Essay deleted", { essayId: id, userId })
  return true
}

// ── Compute and persist user essay stats ─────────────────────────
export const syncUserStats = async (userId: string): Promise<void> => {
  const scoredEssays = await Essay.find({
    userId,
    status: "scored",
    score: { $ne: null },
  })
    .sort({ createdAt: 1 })
    .select("score wordCount createdAt")

  if (scoredEssays.length === 0) return

  const scores = scoredEssays.map((e) => e.score as number)
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length

  await User.findByIdAndUpdate(userId, {
    "stats.essaysSubmitted": await Essay.countDocuments({ userId }),
    "stats.averageScore": Math.round(avgScore * 10) / 10,
    "stats.lastActiveAt": new Date(),
  })
}

// ── Full analytics stats for a user ──────────────────────────────
export const getUserStats = async (userId: string): Promise<UserEssayStats> => {
  const [allEssays, scoredEssays] = await Promise.all([
    Essay.find({ userId }).select("status taskType wordCount score createdAt"),
    Essay.find({ userId, status: "scored", score: { $ne: null } })
      .sort({ createdAt: 1 })
      .select("score taskType wordCount createdAt"),
  ])

  const scores = scoredEssays.map((e) => e.score as number)
  const wordCounts = allEssays.map((e) => e.wordCount).filter((w) => w > 0)

  // Score distribution by IELTS band
  const bandBuckets: Record<string, number> = {
    "4.0-4.5": 0, "5.0-5.5": 0, "6.0-6.5": 0,
    "7.0-7.5": 0, "8.0-8.5": 0, "9.0": 0,
  }
  for (const s of scores) {
    if (s >= 9) bandBuckets["9.0"]++
    else if (s >= 8) bandBuckets["8.0-8.5"]++
    else if (s >= 7) bandBuckets["7.0-7.5"]++
    else if (s >= 6) bandBuckets["6.0-6.5"]++
    else if (s >= 5) bandBuckets["5.0-5.5"]++
    else bandBuckets["4.0-4.5"]++
  }

  // Monthly averages (last 6 months)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const recentScored = scoredEssays.filter((e) => e.createdAt >= sixMonthsAgo)

  const monthMap = new Map<string, { total: number; count: number }>()
  for (const e of recentScored) {
    const key = e.createdAt.toISOString().slice(0, 7) // "YYYY-MM"
    const existing = monthMap.get(key) ?? { total: 0, count: 0 }
    monthMap.set(key, {
      total: existing.total + (e.score as number),
      count: existing.count + 1,
    })
  }
  const scoresByMonth = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { total, count }]) => ({
      month,
      avgScore: Math.round((total / count) * 10) / 10,
      count,
    }))

  // Task type breakdown
  const taskMap = new Map<string, { total: number; count: number }>()
  for (const e of scoredEssays) {
    const t = e.taskType
    const existing = taskMap.get(t) ?? { total: 0, count: 0 }
    taskMap.set(t, { total: existing.total + (e.score as number), count: existing.count + 1 })
  }
  const taskTypeBreakdown = Array.from(taskMap.entries()).map(([taskType, { total, count }]) => ({
    taskType,
    count,
    avgScore: Math.round((total / count) * 10) / 10,
  }))

  // Improvement: delta between oldest and newest scored essay
  let improvement: number | null = null
  if (scoredEssays.length >= 2) {
    const first = scoredEssays[0].score as number
    const last = scoredEssays[scoredEssays.length - 1].score as number
    improvement = Math.round((last - first) * 10) / 10
  }

  // Recent activity (last 10 essays)
  const recent = allEssays
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10)
  const recentActivity = recent.map((e) => ({
    date: e.createdAt.toISOString(),
    score: e.score ?? null,
    status: e.status,
  }))

  return {
    totalEssays: allEssays.length,
    scoredEssays: scoredEssays.length,
    averageScore: scores.length
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : 0,
    highestScore: scores.length ? Math.max(...scores) : 0,
    lowestScore: scores.length ? Math.min(...scores) : 0,
    averageWordCount: wordCounts.length
      ? Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length)
      : 0,
    scoresByMonth,
    scoreDistribution: Object.entries(bandBuckets).map(([band, count]) => ({ band, count })),
    taskTypeBreakdown,
    recentActivity,
    improvement,
  }
}
