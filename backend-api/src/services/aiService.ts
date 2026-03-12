import axios, { AxiosError } from "axios";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import {
  buildScoringPrompt,
  SYSTEM_PROMPT,
  PromptInput,
} from "./promptBuilder";
import { parseAIResponse, ParsedAIResult } from "./aiResponseParser";

// ── Google AI Studio (Gemini) API types ──────────────────────────
interface GeminiPart {
  text: string;
}
interface GeminiContent {
  role?: string;
  parts: GeminiPart[];
}

interface GeminiRequest {
  systemInstruction?: { parts: GeminiPart[] };
  contents: GeminiContent[];
  generationConfig: {
    temperature: number;
    maxOutputTokens: number;
    topP: number;
  };
}

interface GeminiResponse {
  candidates: Array<{
    content: { parts: GeminiPart[]; role: string };
    finishReason: string;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

// ── Config ───────────────────────────────────────────────────────
const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;
const REQUEST_TIMEOUT_MS = 90_000; // Gemini can be slower on long prompts

// ── Helpers ───────────────────────────────────────────────────────
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableError = (err: unknown): boolean => {
  if (err instanceof AxiosError) {
    const s = err.response?.status;
    return s === 429 || s === 503 || (s !== undefined && s >= 500);
  }
  return false;
};

// ── Core Google AI Studio call with retry ─────────────────────────
const callGemini = async (
  systemPrompt: string,
  userPrompt: string,
  attempt = 1,
): Promise<string> => {
  const apiKey = env.GOOGLE_AI_API_KEY ?? process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "❌ Missing Gemini API key — set GEMINI_API_KEY or GOOGLE_AI_API_KEY in .env",
    );
  }

  console.log(
    "[Gemini] API Key loaded:",
    apiKey ? `YES (starts with ${apiKey.substring(0, 7)}...)` : "NO ❌",
  );

  const model = env.GOOGLE_AI_MODEL;
  console.log(`[Gemini] Using model: ${model}`);

  const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey}`;

  const payload: GeminiRequest = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: 0.2, // low = consistent scoring
      maxOutputTokens: 8192,
      topP: 0.9,
    },
  };

  try {
    logger.debug(`Gemini request (attempt ${attempt})`, { model, attempt });

    const response = await axios.post<GeminiResponse>(url, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: REQUEST_TIMEOUT_MS,
    });

    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned empty content");

    const usage = response.data.usageMetadata;
    if (usage) {
      logger.info("[Gemini] Token usage for message", {
        promptTokens: usage.promptTokenCount,
        completionTokens: usage.candidatesTokenCount,
        totalTokens: usage.totalTokenCount,
      });
    }

    logger.debug("Gemini response received", {
      finishReason: response.data.candidates[0].finishReason,
      tokens: usage?.totalTokenCount,
    });

    return text;
  } catch (error) {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const message = (error.response?.data as { error?: { message?: string } })
        ?.error?.message;

      logger.warn(`Gemini request failed (attempt ${attempt})`, {
        status,
        message,
      });

      if (isRetryableError(error) && attempt <= MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * attempt;
        logger.info(`Retrying Gemini in ${delay}ms...`);
        await sleep(delay);
        return callGemini(systemPrompt, userPrompt, attempt + 1);
      }

      if (status === 400)
        throw new Error(`Gemini bad request: ${message ?? "unknown"}`);
      if (status === 401 || status === 403)
        throw new Error("Invalid Google AI API key — check GOOGLE_AI_API_KEY");
      if (status === 429)
        throw new Error("Gemini rate limit exceeded — please try again later");
      if (status === 404) throw new Error(`Gemini model not found: ${model}`);
      logger.error("[Grading] Gemini call FAILED", error);
      throw new Error(
        `Gemini request failed (${status}): ${message ?? error.message}`,
      );
    }
    throw error;
  }
};

// ── Public: score an essay ────────────────────────────────────────
export interface ScoringInput extends PromptInput {}

export interface ScoringResult extends ParsedAIResult {
  aiModel: string;
  processingTimeMs: number;
}

export const scoreEssayWithAI = async (
  input: ScoringInput,
  maxRetries = 2
): Promise<ScoringResult> => {
  const startTime = Date.now();
  const userPrompt = buildScoringPrompt(input);

  logger.info(`[Grading] Starting grading, model=${env.GOOGLE_AI_MODEL}`, {
    taskType: input.taskType,
    wordCount: input.wordCount,
  });

  let rawText: string | undefined;
  let finishReason: string = '';
  let parseAttempt = 0;

  for (parseAttempt = 1; parseAttempt <= maxRetries; parseAttempt++) {
    const maxTokens = parseAttempt === 1 ? 8192 : 2048;
    const concisePrompt = parseAttempt === 1 
      ? userPrompt 
      : `${userPrompt}\n\nKEEP JSON CONCISE: Max 10 grammar errors, 5 suggestions only.`;

    try {
      rawText = await callGemini(SYSTEM_PROMPT, concisePrompt);
      
      // Extract finishReason from callGemini response (modify callGemini to return it)
      // For now log from response if available
      logger.debug(`[Grading] Parse attempt ${parseAttempt}, tokens=${maxTokens}`, { finishReason });
      
      const parsed = parseAIResponse(rawText);
      
      const processingTimeMs = Date.now() - startTime;
      
      logger.info("Essay scored", {
        score: parsed.score,
        processingTimeMs,
        parseAttempts: parseAttempt,
        grammarErrors: parsed.grammarErrors.length,
        suggestions: parsed.suggestions.length,
        finishReason,
      });

      return { ...parsed, aiModel: env.GOOGLE_AI_MODEL, processingTimeMs };
    } catch (parseErr) {
      logger.warn(`[Grading] Parse failed (attempt ${parseAttempt}/${maxRetries})`, {
        error: String(parseErr),
        isFinal: parseAttempt === maxRetries,
        rawTextLength: rawText?.length
      });
      
      if (parseAttempt === maxRetries) {
        // Final fallback
        const fallback = {
          score: 4.0,
          scoreBreakdown: {
            taskAchievement: 4.0,
            coherenceCohesion: 4.0,
            lexicalResource: 4.0,
            grammaticalRangeAccuracy: 4.0
          } as any,
          grammarErrors: [],
          suggestions: [],
          aiFeedback: "Lỗi xử lý AI sau nhiều lần thử. Điểm tạm tính 4.0. Hãy viết bài ngắn gọn hơn và nộp lại."
        };
        const processingTimeMs = Date.now() - startTime;
        return { ...fallback, aiModel: env.GOOGLE_AI_MODEL!, processingTimeMs };
      }
      
      await sleep(1000 * parseAttempt); // Progressive backoff
    }
  }
  
  throw new Error("Unexpected exit from retry loop");
};

// ── Health check ──────────────────────────────────────────────────
export const checkAIServiceHealth = (): "configured" | "not configured" =>
  env.GOOGLE_AI_API_KEY ? "configured" : "not configured";

// ── Generic AI call (used by improvementService) ──────────────────
export const callAI = async (
  systemPrompt: string,
  userPrompt: string,
): Promise<string> => callGemini(systemPrompt, userPrompt);
