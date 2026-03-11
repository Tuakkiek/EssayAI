import { parseAIResponse } from "../aiResponseParser"

const VALID_RESPONSE = JSON.stringify({
  score: 6.5,
  scoreBreakdown: { taskAchievement: 7, coherenceCohesion: 6.5, lexicalResource: 6, grammaticalRange: 6.5 },
  grammarErrors: [{ original: "peoples are", corrected: "people are", explanation: "People is already plural." }],
  suggestions: [{ category: "vocabulary", text: "Use more precise adjectives." }],
  aiFeedback: "The essay demonstrates a competent grasp of the topic.",
})

describe("parseAIResponse", () => {
  test("parses clean JSON", () => {
    const r = parseAIResponse(VALID_RESPONSE)
    expect(r.score).toBe(6.5)
    expect(r.scoreBreakdown.taskAchievement).toBe(7)
    expect(r.grammarErrors).toHaveLength(1)
    expect(r.suggestions[0].category).toBe("vocabulary")
  })
  test("strips markdown code fences", () => {
    expect(parseAIResponse("```json\n" + VALID_RESPONSE + "\n```").score).toBe(6.5)
  })
  test("extracts JSON from preamble text", () => {
    expect(parseAIResponse("Here is my result:\n" + VALID_RESPONSE + "\nDone.").score).toBe(6.5)
  })
  test("clamps score above 9 to 9", () => {
    expect(parseAIResponse(JSON.stringify({ ...JSON.parse(VALID_RESPONSE), score: 11 })).score).toBe(9)
  })
  test("clamps score below 0 to 0", () => {
    expect(parseAIResponse(JSON.stringify({ ...JSON.parse(VALID_RESPONSE), score: -2 })).score).toBe(0)
  })
  test("rounds score to nearest 0.5", () => {
    expect(parseAIResponse(JSON.stringify({ ...JSON.parse(VALID_RESPONSE), score: 6.3 })).score).toBe(6.5)
  })
  test("falls back to score 5 when missing", () => {
    const p = JSON.parse(VALID_RESPONSE); delete p.score
    expect(parseAIResponse(JSON.stringify(p)).score).toBe(5)
  })
  test("falls back to 'general' for unknown category", () => {
    const p = JSON.parse(VALID_RESPONSE); p.suggestions[0].category = "unknown"
    expect(parseAIResponse(JSON.stringify(p)).suggestions[0].category).toBe("general")
  })
  test("skips malformed grammar errors", () => {
    const p = JSON.parse(VALID_RESPONSE)
    p.grammarErrors = [
      { original: "peoples are" },
      { original: "he go", corrected: "he goes", explanation: "Subject-verb agreement" },
    ]
    const r = parseAIResponse(JSON.stringify(p))
    expect(r.grammarErrors).toHaveLength(1)
    expect(r.grammarErrors[0].original).toBe("he go")
  })
  test("throws on invalid JSON", () => {
    expect(() => parseAIResponse("not json at all")).toThrow()
  })
  test("fallback aiFeedback when missing", () => {
    const p = JSON.parse(VALID_RESPONSE); delete p.aiFeedback
    expect(parseAIResponse(JSON.stringify(p)).aiFeedback).toBe("No detailed feedback was provided.")
  })
})
