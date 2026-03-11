/**
 * Unit tests for essayService helpers that are pure computation
 * (no MongoDB required — these test the logic, not the DB calls)
 */

// ── Helpers extracted from essayService for isolated testing ──────
const computeWordCount = (text: string): number =>
  text.trim().split(/\s+/).filter(Boolean).length

const clampPage = (page: number): number => Math.max(1, page)
const clampLimit = (limit: number): number => Math.min(50, Math.max(1, limit))
const calcSkip = (page: number, limit: number): number => (page - 1) * limit
const calcTotalPages = (total: number, limit: number): number => Math.ceil(total / limit)

const roundScore = (score: number): number => Math.round(score * 10) / 10

const computeImprovement = (scores: number[]): number | null => {
  if (scores.length < 2) return null
  return roundScore(scores[scores.length - 1] - scores[0])
}

const getBandBucket = (score: number): string => {
  if (score >= 9) return "9.0"
  if (score >= 8) return "8.0-8.5"
  if (score >= 7) return "7.0-7.5"
  if (score >= 6) return "6.0-6.5"
  if (score >= 5) return "5.0-5.5"
  return "4.0-4.5"
}

// ── Tests ─────────────────────────────────────────────────────────

describe("Word count", () => {
  test("counts words correctly", () => {
    expect(computeWordCount("The quick brown fox")).toBe(4)
  })
  test("handles extra whitespace", () => {
    expect(computeWordCount("  hello   world  ")).toBe(2)
  })
  test("returns 0 for empty string", () => {
    expect(computeWordCount("")).toBe(0)
  })
  test("counts a 250-word essay correctly", () => {
    const essay = Array(250).fill("word").join(" ")
    expect(computeWordCount(essay)).toBe(250)
  })
})

describe("Pagination helpers", () => {
  test("clamps page below 1 to 1", () => {
    expect(clampPage(0)).toBe(1)
    expect(clampPage(-5)).toBe(1)
  })
  test("clamps limit above 50 to 50", () => {
    expect(clampLimit(200)).toBe(50)
  })
  test("clamps limit below 1 to 1", () => {
    expect(clampLimit(0)).toBe(1)
  })
  test("calculates skip correctly", () => {
    expect(calcSkip(1, 10)).toBe(0)
    expect(calcSkip(2, 10)).toBe(10)
    expect(calcSkip(3, 10)).toBe(20)
  })
  test("calculates totalPages correctly", () => {
    expect(calcTotalPages(25, 10)).toBe(3)
    expect(calcTotalPages(10, 10)).toBe(1)
    expect(calcTotalPages(11, 10)).toBe(2)
    expect(calcTotalPages(0, 10)).toBe(0)
  })
})

describe("Score analytics", () => {
  test("rounds scores to 1 decimal", () => {
    expect(roundScore(6.333)).toBe(6.3)
    expect(roundScore(7.666)).toBe(7.7)
  })

  test("computes improvement correctly", () => {
    expect(computeImprovement([5.0, 5.5, 6.0, 6.5])).toBe(1.5)
    expect(computeImprovement([7.0, 6.5])).toBe(-0.5) // regression
    expect(computeImprovement([6.0])).toBeNull()       // not enough data
    expect(computeImprovement([])).toBeNull()
  })

  test("assigns correct band buckets", () => {
    expect(getBandBucket(9.0)).toBe("9.0")
    expect(getBandBucket(8.5)).toBe("8.0-8.5")
    expect(getBandBucket(8.0)).toBe("8.0-8.5")
    expect(getBandBucket(7.0)).toBe("7.0-7.5")
    expect(getBandBucket(6.5)).toBe("6.0-6.5")
    expect(getBandBucket(5.0)).toBe("5.0-5.5")
    expect(getBandBucket(4.5)).toBe("4.0-4.5")
    expect(getBandBucket(3.0)).toBe("4.0-4.5")
  })

  test("computes average score correctly", () => {
    const scores = [5.0, 6.0, 7.0, 8.0]
    const avg = roundScore(scores.reduce((a, b) => a + b, 0) / scores.length)
    expect(avg).toBe(6.5)
  })
})

describe("hasNextPage / hasPrevPage", () => {
  const hasNext = (page: number, totalPages: number) => page < totalPages
  const hasPrev = (page: number) => page > 1

  test("first page has no prev, has next when multiple pages", () => {
    expect(hasPrev(1)).toBe(false)
    expect(hasNext(1, 3)).toBe(true)
  })
  test("last page has prev, no next", () => {
    expect(hasPrev(3)).toBe(true)
    expect(hasNext(3, 3)).toBe(false)
  })
  test("single page has neither", () => {
    expect(hasPrev(1)).toBe(false)
    expect(hasNext(1, 1)).toBe(false)
  })
})
