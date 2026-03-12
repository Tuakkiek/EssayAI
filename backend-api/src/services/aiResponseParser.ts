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
const robustExtractJSON = (text: string): string | null => {
  // Heuristic 1: Balanced brace matching (handles nesting)
  let start = text.indexOf("{")
  if (start !== -1) {
    let braceCount = 1
    let i = start + 1
    for (; i < text.length; i++) {
      if (text[i] === "{") braceCount++
      else if (text[i] === "}") {
        braceCount--
        if (braceCount === 0) break
      }
    }
    if (braceCount === 0) {
      const candidate = text.slice(start, i + 1)
      if (isValidJSON(candidate.trim())) return candidate.trim()
    }
  }


  // Heuristic 2: Regex for complete JSON object (handles trailing text)
  // Heuristic 2: Regex for single-level JSON objects (no deep nesting)
  const jsonMatch = text.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/)
  if (jsonMatch && isValidJSON(jsonMatch[0])) return jsonMatch[0]


  // Heuristic 3: Find last complete field before truncation
  // Heuristic 3: Last complete top-level object before truncation
  const lastComplete = text.match(/\{(?:[^{}]|(?:\{[^{}]*\}[^{}]*))*\}/)
  if (lastComplete && isValidJSON(lastComplete[0])) return lastComplete[0]


  return null
}

const isValidJSON = (str: string): boolean => {
  try {
    return JSON.parse(str.trim()) != null
  } catch {
    return false
  }
}

// ── Fallback result ───────────────────────────────────────────────────
const fallbackResult = (): ParsedAIResult => ({
  score: 5,
  scoreBreakdown: {
    taskAchievement: 5,
    coherenceCohesion: 5,
    lexicalResource: 5,
    grammaticalRangeAccuracy: 5
  },
  grammarErrors: [],
  suggestions: [],
  aiFeedback: "Unable to parse AI response. Default scores applied."
})





// ── Main parser ──────────────────────────────────────────────────
export const parseAIResponse = (rawText: string): ParsedAIResult => {
  let cleaned = stripMarkdown(rawText)
  const jsonStr = robustExtractJSON(cleaned)
  
  let raw: RawAIResponse
  if (!jsonStr) {
    logger.error("Failed to extract valid JSON from AI response", { rawText })
    return fallbackResult()
  }
  
  try {
    raw = JSON.parse(jsonStr) as RawAIResponse
  } catch (parseErr) {
    logger.error("Failed to parse extracted JSON", { 
      jsonStr: jsonStr.slice(0, 1000), 
      fullRawText: rawText,
      parseError: String(parseErr)
    })
    return fallbackResult()
  }

  // ── Score ──────────────────────────────────────────────────────
  const score = clampBand(raw.score, 5)

  // ── Score breakdown ────────────────────────────────────────────
  const bd = raw.scoreBreakdown || {}
  const scoreBreakdown: IScoreBreakdown = {
    taskAchievement: clampBand(bd.taskAchievement, score),
    coherenceCohesion: clampBand(bd.coherenceCohesion, score),
    lexicalResource: clampBand(bd.lexicalResource, score),
    grammaticalRangeAccuracy: clampBand(bd.grammaticalRange, score),
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
        grammarErrors.push({ original, corrected, explanation } as IGrammarError)
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
        suggestions.push({ category, text } as ISuggestion)
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
    usedFallback: false
  })

  return { score, scoreBreakdown, grammarErrors, suggestions, aiFeedback }
}
