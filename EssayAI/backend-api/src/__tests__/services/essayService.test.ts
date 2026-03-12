/**
 * essayService.test.ts  (Phase 5)
 * Tests pure business logic — no DB required.
 */

// ── Word counter (mirrors countWords in essayService) ─────────────────
const countWords = (text: string): number =>
  text.trim().split(/\s+/).filter(Boolean).length

describe("countWords", () => {
  test("counts simple sentence", () =>
    expect(countWords("The quick brown fox")).toBe(4))

  test("ignores leading/trailing whitespace", () =>
    expect(countWords("  hello world  ")).toBe(2))

  test("collapses multiple spaces", () =>
    expect(countWords("a   b   c")).toBe(3))

  test("empty string returns 0", () =>
    expect(countWords("")).toBe(0))

  test("returns 1 for single word", () =>
    expect(countWords("hello")).toBe(1))

  test("counts realistic essay excerpt", () => {
    const text = "Some people believe that global warming is one of the most pressing issues facing humanity today. Others argue that economic development should take priority over environmental concerns."
    expect(countWords(text)).toBe(27)
  })
})

// ── Essay submission validation rules ────────────────────────────────
describe("Essay submission guards", () => {
  // Simulates the checks in submitEssay without hitting the DB

  const MIN_CHARS = 50
  const VALID_TASK_TYPES = ["task1", "task2"]

  const validateSubmission = (text: string, taskType: string): string | null => {
    if (!text || text.trim().length < MIN_CHARS) {
      return `Essay must be at least ${MIN_CHARS} characters long`
    }
    if (!VALID_TASK_TYPES.includes(taskType)) {
      return "taskType must be 'task1' or 'task2'"
    }
    return null  // valid
  }

  test("valid task2 essay passes", () => {
    const text = "A".repeat(MIN_CHARS)
    expect(validateSubmission(text, "task2")).toBeNull()
  })

  test("valid task1 essay passes", () => {
    const text = "B".repeat(MIN_CHARS)
    expect(validateSubmission(text, "task1")).toBeNull()
  })

  test("essay too short fails", () => {
    expect(validateSubmission("short", "task2")).toMatch(/at least 50 characters/)
  })

  test("empty text fails", () => {
    expect(validateSubmission("", "task2")).toMatch(/at least 50 characters/)
  })

  test("invalid taskType fails", () => {
    const text = "A".repeat(MIN_CHARS)
    expect(validateSubmission(text, "task3")).toMatch(/task1.*task2/)
  })
})

// ── centerId isolation invariant ──────────────────────────────────────
describe("centerId isolation", () => {
  /**
   * This tests the architectural rule:
   * centerId comes from the JWT (req.centerFilter), NEVER from req.body.
   *
   * We simulate a controller that strips centerId from req.body.
   */
  interface FakeReq {
    body:         { text: string; taskType: string; centerId?: string }
    centerFilter: { centerId: string }
    user:         { userId: string }
  }

  const extractServiceInput = (req: FakeReq) => ({
    text:      req.body.text,
    taskType:  req.body.taskType,
    centerId:  req.centerFilter.centerId,   // ← always from JWT
    studentId: req.user.userId,
    // centerId is deliberately NOT passed from req.body
  })

  test("centerId from JWT takes precedence over body", () => {
    const req: FakeReq = {
      body:         { text: "essay", taskType: "task2", centerId: "attacker-center-id" },
      centerFilter: { centerId: "real-center-id" },
      user:         { userId: "student-1" },
    }
    const input = extractServiceInput(req)
    expect(input.centerId).toBe("real-center-id")
    expect(input.centerId).not.toBe("attacker-center-id")
  })

  test("body without centerId still works correctly", () => {
    const req: FakeReq = {
      body:         { text: "essay", taskType: "task1" },
      centerFilter: { centerId: "center-abc" },
      user:         { userId: "student-2" },
    }
    const input = extractServiceInput(req)
    expect(input.centerId).toBe("center-abc")
  })
})

// ── Attempt number logic ──────────────────────────────────────────────
describe("Attempt number calculation", () => {
  // attemptNumber = previousAttempts + 1, capped by maxAttempts

  const nextAttempt = (previous: number) => previous + 1
  const canSubmit   = (previous: number, max: number) => previous < max

  test("first submission is attempt 1", () => expect(nextAttempt(0)).toBe(1))
  test("second submission is attempt 2", () => expect(nextAttempt(1)).toBe(2))

  test("can submit if under max", () => {
    expect(canSubmit(0, 1)).toBe(true)
    expect(canSubmit(1, 3)).toBe(true)
  })

  test("blocked when at max", () => {
    expect(canSubmit(1, 1)).toBe(false)
    expect(canSubmit(3, 3)).toBe(false)
  })

  test("blocked when over max (edge case)", () => {
    expect(canSubmit(5, 3)).toBe(false)
  })
})

// ── Grading result application ────────────────────────────────────────
describe("Grading result — averageScore rounding", () => {
  // Mirrors the rounding in saveGradingResult
  const roundScore = (avg: number) => Math.round(avg * 10) / 10

  test.each([
    [6.0,   6.0],
    [6.123, 6.1],
    [6.55,  6.6],
    [6.666, 6.7],
    [0.0,   0.0],
    [9.0,   9.0],
  ])("avg=%d → rounded=%d", (input, expected) => {
    expect(roundScore(input)).toBe(expected)
  })
})

// ── Student role scoping ──────────────────────────────────────────────
describe("Essay query scoping by role", () => {
  interface QueryShape {
    centerId: string
    studentId?: string
  }

  const buildQuery = (
    centerId:     string,
    requesterId:  string,
    role:         string
  ): QueryShape => {
    const q: QueryShape = { centerId }
    if (role === "student") q.studentId = requesterId
    return q
  }

  test("student query includes studentId filter", () => {
    const q = buildQuery("c1", "s1", "student")
    expect(q.studentId).toBe("s1")
  })

  test("teacher query does NOT include studentId filter", () => {
    const q = buildQuery("c1", "t1", "teacher")
    expect(q.studentId).toBeUndefined()
  })

  test("both always include centerId", () => {
    expect(buildQuery("c1", "s1", "student").centerId).toBe("c1")
    expect(buildQuery("c1", "t1", "teacher").centerId).toBe("c1")
  })
})
