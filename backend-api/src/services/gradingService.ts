/**
 * src/services/gradingService.ts
 */

import Essay from "../models/Essay";
import { saveGradingResult } from "./essayService";
import { essayModel } from "../config/gemini";
import { logger } from "../utils/logger";

// ── Prompt builder ────────────────────────────────────────────────────

function buildPrompt(text: string, taskType: "task1" | "task2"): string {
  const taskDesc =
    taskType === "task2"
      ? "IELTS Academic Writing Task 2 (argumentative/discursive essay, 250+ words)"
      : "IELTS Academic Writing Task 1 (data description / graph report, 150+ words)";

  return `You are an expert IELTS examiner. Grade the following ${taskDesc}.

Return ONLY a valid JSON object matching this exact schema (no markdown, no explanation):
{
  "overallScore": <number 0-9, rounded to nearest 0.5>,
  "scoreBreakdown": {
    "taskAchievement": <number 0-9>,
    "coherenceCohesion": <number 0-9>,
    "lexicalResource": <number 0-9>,
    "grammaticalRangeAccuracy": <number 0-9>
  },
  "feedback": "<2-4 sentence overall examiner comment>",
  "grammarErrors": [
    {
      "original": "<exact phrase from essay>",
      "corrected": "<corrected version>",
      "explanation": "<why it is wrong>",
      "tip": "<rule or tip to remember>"
    }
  ],
  "suggestions": [
    {
      "category": "<vocabulary|structure|coherence|argument|general>",
      "text": "<specific improvement suggestion>",
      "example": "<optional example sentence>"
    }
  ]
}

Rules:
- grammarErrors: include up to 5 most significant errors only
- suggestions: include 3-5 actionable suggestions
- overallScore is the mean of the four criteria, rounded to nearest 0.5

ESSAY TO GRADE:
"""
${text}
"""`;
}

// ── JSON extractor (handles markdown fences) ──────────────────────────

function extractJSON(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  return raw.trim();
}

// ── Gemini call with timeout ──────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`TIMEOUT: ${label} did not respond within ${ms / 1000}s`));
    }, ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

// ── Main grading function (fire-and-forget) ───────────────────────────

export async function gradeEssayAsync(essayId: string): Promise<void> {
  logger.info(`[Grading] ▶ Start — essayId=${essayId}`);

  try {
    // 1. Load essay
    logger.info(`[Grading] Loading essay from DB...`);
    const essay = await Essay.findById(essayId);
    if (!essay) {
      logger.error(`[Grading] ❌ Essay not found in DB — essayId=${essayId}`);
      return;
    }
    logger.info(`[Grading] Essay loaded — wordCount=${essay.wordCount}, taskType=${essay.taskType}`);

    // 2. Mark as scoring
    await Essay.findByIdAndUpdate(essayId, { status: "scoring" });
    logger.info(`[Grading] Status → scoring`);

    // 3. Build prompt
    const prompt = buildPrompt(essay.originalText, essay.taskType);
    logger.info(`[Grading] Prompt built (${prompt.length} chars). Calling Gemini now...`);
    logger.info(`[Grading] Model config: ${JSON.stringify(essayModel)}`);

    // 4. Call Gemini WITH 60s timeout
    const startMs = Date.now();
    let result: Awaited<ReturnType<typeof essayModel.generateContent>>;
    try {
      result = await withTimeout(
        essayModel.generateContent(prompt),
        60_000,
        "Gemini generateContent"
      );
    } catch (geminiErr: unknown) {
      const msg =
        geminiErr instanceof Error
          ? geminiErr.message
          : JSON.stringify(geminiErr);
      logger.error(`[Grading] ❌ Gemini call threw: ${msg}`);
      throw new Error(`Gemini failed: ${msg}`);
    }

    const elapsed = Date.now() - startMs;
    logger.info(`[Grading] ✅ Gemini call completed in ${elapsed}ms`);

    // 5. Extract text
    let rawText: string;
    try {
      rawText = result.response.text();
      logger.info(`[Grading] Response text length: ${rawText.length} chars`);
      logger.info(`[Grading] Raw response (first 500 chars): ${rawText.substring(0, 500)}`);
    } catch (textErr: unknown) {
      logger.error(`[Grading] ❌ Failed to extract text from response:`, textErr);
      logger.error(`[Grading] Response object:`, JSON.stringify(result.response));
      throw new Error(`Could not extract text from Gemini response`);
    }

    // 6. Parse JSON
    const jsonStr = extractJSON(rawText);
    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
      logger.info(`[Grading] JSON parsed — overallScore=${parsed.overallScore}`);
    } catch (parseErr: unknown) {
      logger.error(`[Grading] ❌ JSON parse failed.`);
      logger.error(`[Grading] Full raw text:\n${rawText}`);
      throw new Error(`AI response was not valid JSON: ${(parseErr as Error).message}`);
    }

    // 7. Validate
    const { overallScore, scoreBreakdown, feedback, grammarErrors, suggestions } = parsed;
    if (typeof overallScore !== "number") {
      logger.error(`[Grading] ❌ Missing overallScore in parsed response:`, parsed);
      throw new Error(`Missing or invalid overallScore in AI response`);
    }

    // 8. Save result
    logger.info(`[Grading] Saving result to DB — score=${overallScore}`);
    await saveGradingResult(essayId, {
      overallScore,
      scoreBreakdown: {
        taskAchievement:          scoreBreakdown?.taskAchievement          ?? 0,
        coherenceCohesion:        scoreBreakdown?.coherenceCohesion        ?? 0,
        lexicalResource:          scoreBreakdown?.lexicalResource          ?? 0,
        grammaticalRangeAccuracy: scoreBreakdown?.grammaticalRangeAccuracy ?? 0,
        taskResponse:             scoreBreakdown?.taskResponse             ?? null,
      },
      feedback:      feedback      ?? "",
      grammarErrors: Array.isArray(grammarErrors)  ? grammarErrors  : [],
      suggestions:   Array.isArray(suggestions)    ? suggestions    : [],
    });

    logger.info(`[Grading] ✅ Complete — essayId=${essayId}, score=${overallScore}`);

  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null
        ? JSON.stringify(err)
        : String(err);

    logger.error(`[Grading] ❌ FAILED — essayId=${essayId}: ${msg}`);

    // Always update DB so frontend stops polling with "error" status
    await Essay.findByIdAndUpdate(essayId, {
      status: "error",
      errorMessage: msg,
    }).catch((dbErr) => {
      logger.error(`[Grading] ❌ Could not save error status to DB:`, dbErr);
    });
  }
}
