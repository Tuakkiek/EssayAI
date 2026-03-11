import { IGrammarError, ISuggestion, IScoreBreakdown } from "../models/index"
import { logger } from "../utils/logger"

// ── Raw AI response shape ────────────────────────────────────────
interface RawAIResponse {
  score?: unknown
  scoreBreakdown?: {
    taskAchievement?: unknown
    coherenceCohesion?: unknown
    lexicalResource?: unknown
    grammaticalRange?: unknown
  }
  grammarErrors?: unknown[]
  suggestions?: unknown[]
  aiFeedback?: unknown
}

export interface ParsedAIResult {
  score: number
  scoreBreakdown: IScoreBreakdown
  grammarErrors: IGrammarError[]
  suggestions: ISuggestion[]
  aiFeedback: string
}

// ── Helpers ──────────────────────────────────────────────────────
const clampBand = (val: unknown, fallback = 5): number => {
  const n = parseFloat(String(val))
  if (isNaN(n)) return fallback
  return Math.min(9, Math.max(0, Math.round(n * 2) / 2)) // round to 0.5
}

const cleanString = (val: unknown, fallback = ""): string => {
  return typeof val === "string" && val.trim() ? val.trim() : fallback
}

const VALID_CATEGORIES = new Set([
  "vocabulary", "structure", "coherence", "argument", "general",
])

// ── Strip markdown code fences if model wraps in ```json ─────────
const stripMarkdown = (text: string): string => {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim()
}

// ── Find JSON object even if model adds preamble text ────────────
const extractJSON = (text: string): string => {
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in AI response")
  }
  return text.slice(start, end + 1)
}

// ── Main parser ──────────────────────────────────────────────────
export const parseAIResponse = (rawText: string): ParsedAIResult => {
  let cleaned = stripMarkdown(rawText)
  cleaned = extractJSON(cleaned)

  let raw: RawAIResponse
  try {
    raw = JSON.parse(cleaned) as RawAIResponse
  } catch {
    logger.error("Failed to parse AI response JSON", { rawText: rawText.slice(0, 500) })
    throw new Error("AI returned invalid JSON — cannot parse scoring result")
  }

  // ── Score ──────────────────────────────────────────────────────
  const score = clampBand(raw.score, 5)

  // ── Score breakdown ────────────────────────────────────────────
  const bd = raw.scoreBreakdown || {}
  const scoreBreakdown: IScoreBreakdown = {
    taskAchievement: clampBand(bd.taskAchievement, score),
    coherenceCohesion: clampBand(bd.coherenceCohesion, score),
    lexicalResource: clampBand(bd.lexicalResource, score),
    grammaticalRange: clampBand(bd.grammaticalRange, score),
  }

  // ── Grammar errors ─────────────────────────────────────────────
  const grammarErrors: IGrammarError[] = []
  if (Array.isArray(raw.grammarErrors)) {
    for (const item of raw.grammarErrors) {
      if (typeof item !== "object" || item === null) continue
      const e = item as Record<string, unknown>
      const original = cleanString(e["original"])
      const corrected = cleanString(e["corrected"])
      const explanation = cleanString(e["explanation"])
      if (original && corrected && explanation) {
        grammarErrors.push({ original, corrected, explanation })
      }
    }
  }

  // ── Suggestions ────────────────────────────────────────────────
  const suggestions: ISuggestion[] = []
  if (Array.isArray(raw.suggestions)) {
    for (const item of raw.suggestions) {
      if (typeof item !== "object" || item === null) continue
      const s = item as Record<string, unknown>
      const text = cleanString(s["text"])
      const rawCat = cleanString(s["category"], "general").toLowerCase()
      const category = VALID_CATEGORIES.has(rawCat)
        ? (rawCat as ISuggestion["category"])
        : "general"
      if (text) {
        suggestions.push({ category, text })
      }
    }
  }

  // ── AI feedback ────────────────────────────────────────────────
  const aiFeedback = cleanString(
    raw.aiFeedback,
    "No detailed feedback was provided."
  )

  logger.debug("AI response parsed", {
    score,
    grammarErrorCount: grammarErrors.length,
    suggestionCount: suggestions.length,
  })

  return { score, scoreBreakdown, grammarErrors, suggestions, aiFeedback }
}
