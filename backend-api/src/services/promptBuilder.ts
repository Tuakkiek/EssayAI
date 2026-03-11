import { EssayTaskType } from "../models/index"

export interface PromptInput {
  essayText: string
  prompt: string
  taskType: EssayTaskType
  wordCount: number
}

// ── IELTS Band descriptors for context ──────────────────────────────
const BAND_GUIDE = `
IELTS Band Score Guide:
- 9: Expert — fully operational command, appropriate, accurate
- 8: Very Good — fully operational with occasional inaccuracies
- 7: Good — operational command, some inaccuracies in complex situations
- 6: Competent — effective command despite some inaccuracies
- 5: Modest — partial command, many mistakes
- 4: Limited — basic competence, frequent problems
- 3: Extremely Limited — conveys general meaning in familiar situations
`.trim()

// ── Task-specific instructions ────────────────────────────────────
const TASK_INSTRUCTIONS: Record<EssayTaskType, string> = {
  task1: `This is an IELTS Writing Task 1 (describing a graph, chart, or diagram).
Evaluate: task achievement, coherence & cohesion, lexical resource, grammatical range & accuracy.
Minimum expected word count: 150 words.`,
  task2: `This is an IELTS Writing Task 2 (academic essay / argument).
Evaluate: task response, coherence & cohesion, lexical resource, grammatical range & accuracy.
Minimum expected word count: 250 words.`,
}

// ── Main prompt builder ──────────────────────────────────────────
export const buildScoringPrompt = (input: PromptInput): string => {
  const taskInstruction = TASK_INSTRUCTIONS[input.taskType]

  return `You are an expert IELTS writing examiner with 20+ years of experience. Your scoring must be consistent, fair, and detailed.

${BAND_GUIDE}

${taskInstruction}

ESSAY PROMPT:
"${input.prompt}"

STUDENT ESSAY (${input.wordCount} words):
"""
${input.essayText}
"""

Analyze this essay thoroughly and respond with ONLY a valid JSON object. No extra text, no markdown, no explanation outside the JSON.

JSON format:
{
  "score": <overall band 0-9, use 0.5 increments like 5.5, 6.0, 6.5>,
  "scoreBreakdown": {
    "taskAchievement": <0-9>,
    "coherenceCohesion": <0-9>,
    "lexicalResource": <0-9>,
    "grammaticalRange": <0-9>
  },
  "grammarErrors": [
    {
      "original": "<exact phrase from essay>",
      "corrected": "<corrected version>",
      "explanation": "<brief explanation of the error>"
    }
  ],
  "suggestions": [
    {
      "category": "<one of: vocabulary|structure|coherence|argument|general>",
      "text": "<specific, actionable improvement suggestion>"
    }
  ],
  "aiFeedback": "<2-3 paragraph overall assessment of the essay covering strengths, weaknesses, and key areas for improvement>"
}`
}

// ── System prompt ────────────────────────────────────────────────
export const SYSTEM_PROMPT = `You are a strict IELTS writing examiner. You always respond with valid JSON only. You never include markdown code blocks, preamble, or any text outside the JSON object. Your scores are honest, calibrated to official IELTS band descriptors, and never inflated.`
