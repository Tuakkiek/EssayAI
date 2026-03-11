import axios, { AxiosError } from "axios"
import { env } from "../config/env"
import { logger } from "../utils/logger"
import { buildScoringPrompt, SYSTEM_PROMPT, PromptInput } from "./promptBuilder"
import { parseAIResponse, ParsedAIResult } from "./aiResponseParser"

// ── Together AI API types ────────────────────────────────────────
interface TogetherMessage {
  role: "system" | "user" | "assistant"
  content: string
}

interface TogetherRequest {
  model: string
  messages: TogetherMessage[]
  max_tokens: number
  temperature: number
  top_p: number
  stop?: string[]
}

interface TogetherResponse {
  id: string
  choices: Array<{
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// ── Config ───────────────────────────────────────────────────────
const TOGETHER_API_URL = "https://api.together.xyz/v1/chat/completions"
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1500
const REQUEST_TIMEOUT_MS = 60_000

// ── Retry helper ─────────────────────────────────────────────────
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

const isRetryableError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    const status = error.response?.status
    // Retry on rate limit (429) or server errors (5xx), not on bad requests
    return status === 429 || (status !== undefined && status >= 500)
  }
  return false
}

// ── Core API call with retry ─────────────────────────────────────
const callTogetherAI = async (
  messages: TogetherMessage[],
  attempt = 1
): Promise<string> => {
  if (!env.TOGETHER_API_KEY) {
    throw new Error("TOGETHER_API_KEY is not configured")
  }

  const payload: TogetherRequest = {
    model: env.TOGETHER_MODEL,
    messages,
    max_tokens: 2048,
    temperature: 0.2,   // low temp = consistent scoring
    top_p: 0.9,
    stop: ["<|endoftext|>", "</s>"],
  }

  try {
    logger.debug(`Together AI request (attempt ${attempt})`, {
      model: env.TOGETHER_MODEL,
      messageCount: messages.length,
    })

    const response = await axios.post<TogetherResponse>(TOGETHER_API_URL, payload, {
      headers: {
        Authorization: `Bearer ${env.TOGETHER_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: REQUEST_TIMEOUT_MS,
    })

    const content = response.data.choices?.[0]?.message?.content
    if (!content) {
      throw new Error("Together AI returned empty content")
    }

    logger.debug("Together AI response received", {
      finishReason: response.data.choices[0].finish_reason,
      tokens: response.data.usage,
    })

    return content
  } catch (error) {
    if (error instanceof AxiosError) {
      const status = error.response?.status
      const message = (error.response?.data as { error?: { message?: string } })?.error?.message

      logger.warn(`Together AI request failed (attempt ${attempt})`, {
        status,
        message,
      })

      if (isRetryableError(error) && attempt <= MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * attempt
        logger.info(`Retrying in ${delay}ms...`)
        await sleep(delay)
        return callTogetherAI(messages, attempt + 1)
      }

      // Surface a clean error message
      if (status === 401) throw new Error("Invalid Together AI API key")
      if (status === 429) throw new Error("Together AI rate limit exceeded — please try again later")
      if (status === 400) throw new Error(`Together AI bad request: ${message ?? "unknown"}`)
      throw new Error(`Together AI request failed (${status}): ${message ?? error.message}`)
    }

    throw error
  }
}

// ── Public: score an essay ────────────────────────────────────────
export interface ScoringInput extends PromptInput {
  // inherits: essayText, prompt, taskType, wordCount
}

export interface ScoringResult extends ParsedAIResult {
  aiModel: string
  processingTimeMs: number
}

export const scoreEssayWithAI = async (input: ScoringInput): Promise<ScoringResult> => {
  const startTime = Date.now()

  const userPrompt = buildScoringPrompt(input)

  const messages: TogetherMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ]

  logger.info("Scoring essay with AI", {
    model: env.TOGETHER_MODEL,
    taskType: input.taskType,
    wordCount: input.wordCount,
  })

  const rawText = await callTogetherAI(messages)
  const parsed = parseAIResponse(rawText)
  const processingTimeMs = Date.now() - startTime

  logger.info("Essay scored", {
    score: parsed.score,
    processingTimeMs,
    grammarErrors: parsed.grammarErrors.length,
    suggestions: parsed.suggestions.length,
  })

  return {
    ...parsed,
    aiModel: env.TOGETHER_MODEL,
    processingTimeMs,
  }
}

// ── Health check for the AI service ─────────────────────────────
export const checkAIServiceHealth = (): "configured" | "not configured" => {
  return env.TOGETHER_API_KEY ? "configured" : "not configured"
}
