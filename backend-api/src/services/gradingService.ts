import Essay from "../models/Essay"
import { scoreEssayWithAI } from "./aiService"
import { saveGradingResult } from "./essayService"
import { logger } from "../utils/logger"

const GRADING_TIMEOUT_MS = 75_000

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  let timeoutId: NodeJS.Timeout | null = null

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`AI grading timed out after ${timeoutMs}ms`))
        }, timeoutMs)
      }),
    ])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

export const startEssayGrading = async (essayId: string): Promise<void> => {
  logger.info("[Grading] ▶ Start", { essayId })

  // Atomically claim only pending essays to avoid duplicate graders.
  const essay = await Essay.findOneAndUpdate(
    { _id: essayId, status: "pending" },
    { status: "grading", errorMessage: null },
    { new: true }
  )
    .populate("assignmentId", "title prompt gradingCriteria")
    .select("taskType originalText wordCount status assignmentId gradingCriteria")

  if (!essay) {
    logger.info("[Grading] Skip missing/non-pending essay", { essayId })
    return
  }

  const assignment = essay.assignmentId as {
    title?: string
    prompt?: string
    gradingCriteria?: Record<string, unknown>
  } | null
  const prompt = assignment?.prompt || assignment?.title || "No assignment prompt provided."
  const criteria = (essay as any).gradingCriteria ?? assignment?.gradingCriteria ?? undefined

  try {
    logger.info("[Grading] Calling Gemini", {
      essayId,
      wordCount: essay.wordCount,
      taskType: essay.taskType,
    })

    const aiResult = await withTimeout(
      scoreEssayWithAI({
        taskType: essay.taskType,
        essayText: essay.originalText,
        wordCount: essay.wordCount,
        prompt,
        gradingCriteria: criteria,
      }),
      GRADING_TIMEOUT_MS
    )

    await saveGradingResult(essayId, {
      overallScore: aiResult.score,
      scoreBreakdown: aiResult.scoreBreakdown,
      feedback: aiResult.aiFeedback,
      grammarErrors: aiResult.grammarErrors,
      suggestions: aiResult.suggestions,
    })

    logger.info("[Grading] ✅ Done", {
      essayId,
      score: aiResult.score,
      processingTimeMs: aiResult.processingTimeMs,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown grading error"
    logger.error("[Grading] ❌ Failed", { essayId, error: message })
    await saveGradingResult(essayId, { error: message })
  }
}
