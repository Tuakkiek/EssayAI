import { callAI } from "./aiService"
import { Essay } from "../models/index"
import { EssayTaskType } from "../models/Essay"
import { AppError } from "../middlewares/errorHandler"
import { logger } from "../utils/logger"
import mongoose from "mongoose"

// ── Rewrite ───────────────────────────────────────────────────────
export interface RewriteResult {
  rewrittenEssay:  string
  changesExplained: ChangeExplanation[]
  bandEstimate:    number
  keyImprovements: string[]
}

export interface ChangeExplanation {
  original:  string
  rewritten: string
  reason:    string
  type:      "vocabulary" | "grammar" | "structure" | "clarity" | "argument"
}

export const rewriteEssay = async (
  essayId: string,
  userId:  string
): Promise<RewriteResult> => {
  const essay = await Essay.findOne({ _id: essayId, studentId: new mongoose.Types.ObjectId(userId) })
  if (!essay) throw new AppError("Essay not found", 404)
  if (essay.status !== "graded") throw new AppError("Essay must be scored before rewriting", 400)

  const systemPrompt = `You are an expert IELTS writing coach. You rewrite student essays to demonstrate band 7.5+ quality. 
You make targeted, realistic improvements — not a complete rewrite — so the student can see exactly what changed and why.
Always respond with valid JSON only. No markdown, no preamble.`

  const userPrompt = `Improve this IELTS ${essay.taskType === "task2" ? "Task 2 essay" : "Task 1 description"} to demonstrate band 7.5+ writing.

Original score: ${essay.overallScore}/9

ESSAY PROMPT:
""

ORIGINAL ESSAY:
"""
${essay.originalText}
"""

Respond ONLY with this exact JSON:
{
  "rewrittenEssay": "<the improved essay — same general ideas but better language, structure, coherence>",
  "changesExplained": [
    {
      "original": "<exact phrase from original>",
      "rewritten": "<what it became>",
      "reason": "<why this is better — reference IELTS criteria>",
      "type": "<vocabulary|grammar|structure|clarity|argument>"
    }
  ],
  "bandEstimate": <number 7-9 representing estimated band for rewritten essay>,
  "keyImprovements": ["<3-5 concise bullet-point summaries of the main changes made>"]
}`

  logger.info("Rewriting essay", { essayId, score: essay.overallScore })
  const startTime = Date.now()
  const raw = await callAI(systemPrompt, userPrompt)

  // Parse JSON from response
  const clean = raw.replace(/```json|```/g, "").trim()
  let result: RewriteResult
  try {
    result = JSON.parse(clean) as RewriteResult
  } catch {
    // Try extracting JSON block
    const match = clean.match(/\{[\s\S]+\}/)
    if (!match) throw new AppError("AI returned invalid rewrite response", 500)
    result = JSON.parse(match[0]) as RewriteResult
  }

  logger.info("Essay rewritten", { essayId, msElapsed: Date.now() - startTime, changes: result.changesExplained?.length })
  return result
}

// ── Vocabulary enhancer ───────────────────────────────────────────
export interface VocabSuggestion {
  original:    string
  alternatives: { word: string; context: string; register: "formal" | "academic" | "neutral" }[]
  explanation: string
  bandImpact:  string
}

export interface VocabEnhancementResult {
  suggestions:     VocabSuggestion[]
  overallFeedback: string
  vocabBandEstimate: number
}

export const enhanceVocabulary = async (
  essayId: string,
  userId:  string
): Promise<VocabEnhancementResult> => {
  const essay = await Essay.findOne({ _id: essayId, studentId: new mongoose.Types.ObjectId(userId) })
  if (!essay) throw new AppError("Essay not found", 404)

  const systemPrompt = `You are an IELTS vocabulary specialist. You identify basic or overused words in student essays 
and suggest sophisticated academic alternatives. Focus on words that will genuinely improve the band score.
Always respond with valid JSON only. No markdown, no preamble.`

  const userPrompt = `Analyze the vocabulary in this IELTS essay and suggest improvements.

ESSAY TEXT:
"""
${essay.originalText}
"""

Find 5-8 words or phrases that are basic, overused, or weak for IELTS academic writing.
For each, suggest 2-3 better alternatives with context.

Respond ONLY with this JSON:
{
  "suggestions": [
    {
      "original": "<word/phrase from essay>",
      "alternatives": [
        { "word": "<alternative>", "context": "<example sentence using it>", "register": "academic" }
      ],
      "explanation": "<why original is weak for IELTS + how alternatives improve band score>",
      "bandImpact": "<brief: e.g. 'Using this lifts Lexical Resource from 6 to 7'>"
    }
  ],
  "overallFeedback": "<1-2 sentences on the essay's vocabulary range and sophistication>",
  "vocabBandEstimate": <current estimated Lexical Resource band 0-9>
}`

  logger.info("Enhancing vocabulary", { essayId })
  const raw = await callAI(systemPrompt, userPrompt)
  const clean = raw.replace(/```json|```/g, "").trim()

  try {
    return JSON.parse(clean) as VocabEnhancementResult
  } catch {
    const match = clean.match(/\{[\s\S]+\}/)
    if (!match) throw new AppError("AI returned invalid vocabulary response", 500)
    return JSON.parse(match[0]) as VocabEnhancementResult
  }
}

// ── Grammar deep-dive ─────────────────────────────────────────────
export interface GrammarExplanation {
  errorPhrase:  string
  corrected:    string
  ruleName:     string
  fullExplanation: string
  examples:     { wrong: string; right: string }[]
  tip:          string
}

export interface GrammarDeepDiveResult {
  explanations:    GrammarExplanation[]
  topPattern:      string   // Most common error type
  grammarBandNote: string
}

export const explainGrammar = async (
  essayId: string,
  userId:  string
): Promise<GrammarDeepDiveResult> => {
  const essay = await Essay.findOne({ _id: essayId, studentId: new mongoose.Types.ObjectId(userId) })
    .select("originalText grammarErrors taskType")
  if (!essay) throw new AppError("Essay not found", 404)
  if (!essay.grammarErrors?.length) {
    return {
      explanations: [],
      topPattern:   "No grammar errors detected",
      grammarBandNote: "Excellent grammatical control — maintain this standard.",
    }
  }

  const errorList = essay.grammarErrors
    .slice(0, 8)  // Top 8 errors to keep response focused
    .map((e, i) => `${i + 1}. Original: "${e.original}" → Corrected: "${e.corrected}"`)
    .join("\n")

  const systemPrompt = `You are a grammar teacher specializing in IELTS writing. 
You explain grammar errors clearly with rules, examples, and memorable tips.
Always respond with valid JSON only.`

  const userPrompt = `Provide detailed grammar explanations for these errors found in an IELTS essay:

${errorList}

For each error, explain the grammar rule clearly so the student learns — not just the correction but WHY.

Respond ONLY with this JSON:
{
  "explanations": [
    {
      "errorPhrase": "<original error phrase>",
      "corrected": "<corrected version>",
      "ruleName": "<name of the grammar rule e.g. 'Subject-verb agreement'>",
      "fullExplanation": "<2-3 sentences explaining the rule clearly>",
      "examples": [
        { "wrong": "<another example of this error>", "right": "<correct version>" }
      ],
      "tip": "<memorable 1-sentence tip to avoid this in future>"
    }
  ],
  "topPattern": "<the most common error type across all errors e.g. 'Article usage'>",
  "grammarBandNote": "<brief assessment of how fixing these errors impacts Grammatical Range & Accuracy band>"
}`

  logger.info("Explaining grammar errors", { essayId, errorCount: essay.grammarErrors.length })
  const raw = await callAI(systemPrompt, userPrompt)
  const clean = raw.replace(/```json|```/g, "").trim()

  try {
    return JSON.parse(clean) as GrammarDeepDiveResult
  } catch {
    const match = clean.match(/\{[\s\S]+\}/)
    if (!match) throw new AppError("AI returned invalid grammar response", 500)
    return JSON.parse(match[0]) as GrammarDeepDiveResult
  }
}

// ── Progress tracking ─────────────────────────────────────────────
export interface ProgressData {
  timeline: {
    date:    string
    score:   number
    taskType: EssayTaskType
    essayId: string
  }[]
  improvement: {
    firstScore:    number
    latestScore:   number
    delta:         number
    trend:         "improving" | "declining" | "stable"
    streakDays:    number
  }
  criteriaProgress: {
    criterion:  string
    first:      number
    latest:     number
    delta:      number
  }[]
  weakestCriteria: string
  strongestCriteria: string
  totalEssays:   number
  scoredEssays:  number
  averageScore:  number
  personalBest:  number
}

export const getProgressData = async (
  userId: string,
  limit   = 30
): Promise<ProgressData> => {
  const essays = await Essay.find({
    studentId: new mongoose.Types.ObjectId(userId),
    status: "graded",
    overallScore:  { $ne: null },
  })
    .sort({ createdAt: 1 })
    .limit(limit)
    .select("overallScore scoreBreakdown taskType createdAt")
    .lean()

  const total   = await Essay.countDocuments({ studentId: new mongoose.Types.ObjectId(userId) })
  const scored  = essays.length

  if (scored === 0) {
    return {
      timeline: [], totalEssays: total, scoredEssays: 0,
      improvement: { firstScore: 0, latestScore: 0, delta: 0, trend: "stable", streakDays: 0 },
      criteriaProgress: [], weakestCriteria: "", strongestCriteria: "", averageScore: 0, personalBest: 0,
    }
  }

  const timeline = essays.map((e) => ({
    date:     (e.createdAt as Date).toISOString(),
    score:    e.overallScore!,
    taskType: e.taskType,
    essayId:  e._id.toString(),
  }))

  const scores      = essays.map((e) => e.overallScore!)
  const firstScore  = scores[0]
  const latestScore = scores[scores.length - 1]
  const delta       = Math.round((latestScore - firstScore) * 10) / 10
  const avgScore    = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
  const personalBest= Math.max(...scores)

  const trend: "improving" | "declining" | "stable" =
    delta > 0.5 ? "improving" : delta < -0.5 ? "declining" : "stable"

  // Streak: consecutive days with at least one essay
  const dateSet    = new Set(essays.map((e) => (e.createdAt as Date).toDateString()))
  let streakDays   = 0
  const today      = new Date()
  for (let i = 0; i < 60; i++) {
    const d = new Date(today.getTime() - i * 86400000)
    if (dateSet.has(d.toDateString())) streakDays++
    else if (i > 0) break
  }

  // Criteria progress (first vs latest essay that has breakdown)
  const withBreakdown = essays.filter((e) => e.scoreBreakdown)
  const criteriaProgress = []
  const criteriaKeys = [
    { key: "taskAchievement",   label: "Task Achievement" },
    { key: "coherenceCohesion", label: "Coherence & Cohesion" },
    { key: "lexicalResource",   label: "Lexical Resource" },
    { key: "grammaticalRangeAccuracy",  label: "Grammatical Range" },
  ]

  if (withBreakdown.length >= 2) {
    const first  = withBreakdown[0].scoreBreakdown!
    const latest = withBreakdown[withBreakdown.length - 1].scoreBreakdown!
    for (const { key, label } of criteriaKeys) {
      const f = first[key as keyof typeof first] as number
      const l = latest[key as keyof typeof latest] as number
      criteriaProgress.push({ criterion: label, first: f, latest: l, delta: Math.round((l - f) * 10) / 10 })
    }
  }

  const latestBreakdown = withBreakdown[withBreakdown.length - 1]?.scoreBreakdown
  let weakestCriteria   = ""
  let strongestCriteria = ""
  if (latestBreakdown) {
    const entries = criteriaKeys.map(({ key, label }) => ({
      label, val: latestBreakdown[key as keyof typeof latestBreakdown] as number
    }))
    weakestCriteria   = entries.sort((a, b) => a.val - b.val)[0]?.label ?? ""
    strongestCriteria = entries.sort((a, b) => b.val - a.val)[0]?.label ?? ""
  }

  return {
    timeline, totalEssays: total, scoredEssays: scored,
    improvement: { firstScore, latestScore, delta, trend, streakDays },
    criteriaProgress, weakestCriteria, strongestCriteria, averageScore: avgScore, personalBest,
  }
}
