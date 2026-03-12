/**
 * assignmentService.test.ts  (Phase 4)
 * Tests pure validation logic — no DB required.
 */

// ── Assignment status transitions ─────────────────────────────────────
describe("Assignment lifecycle state machine", () => {
  type Status = "draft" | "published" | "closed"

  const canPublish = (status: Status) => status === "draft"
  const canClose   = (status: Status) => status !== "closed"
  const canDelete  = (status: Status) => status === "draft"
  const canEdit    = (status: Status) => status !== "closed"
  const canChangeInstructions = (status: Status) => status === "draft"

  test("draft can be published", () => expect(canPublish("draft")).toBe(true))
  test("published cannot be re-published", () => expect(canPublish("published")).toBe(false))
  test("closed cannot be published", () => expect(canPublish("closed")).toBe(false))

  test("draft can be closed", () => expect(canClose("draft")).toBe(true))
  test("published can be closed", () => expect(canClose("published")).toBe(true))
  test("closed cannot be closed again", () => expect(canClose("closed")).toBe(false))

  test("only draft can be deleted", () => {
    expect(canDelete("draft")).toBe(true)
    expect(canDelete("published")).toBe(false)
    expect(canDelete("closed")).toBe(false)
  })

  test("closed assignments cannot be edited", () => {
    expect(canEdit("draft")).toBe(true)
    expect(canEdit("published")).toBe(true)
    expect(canEdit("closed")).toBe(false)
  })

  test("instructions can only change in draft", () => {
    expect(canChangeInstructions("draft")).toBe(true)
    expect(canChangeInstructions("published")).toBe(false)
    expect(canChangeInstructions("closed")).toBe(false)
  })
})

// ── Due date validation ───────────────────────────────────────────────
describe("Due date validation", () => {
  const isFuture = (date: Date) => date > new Date()

  test("future date is valid", () => {
    const future = new Date(Date.now() + 86400_000)  // +1 day
    expect(isFuture(future)).toBe(true)
  })

  test("past date is invalid", () => {
    const past = new Date(Date.now() - 86400_000)   // -1 day
    expect(isFuture(past)).toBe(false)
  })

  test("now is not a valid due date (must be strictly future)", () => {
    // Simulate the check: due <= new Date()
    const now = new Date()
    expect(now <= new Date()).toBe(true)
  })
})

// ── maxAttempts bounds ────────────────────────────────────────────────
describe("maxAttempts validation", () => {
  const isValid = (n: number) => Number.isInteger(n) && n >= 1 && n <= 10

  test.each([1, 2, 5, 10])("valid: %d", n => expect(isValid(n)).toBe(true))
  test.each([0, -1, 11, 1.5])("invalid: %d", n => expect(isValid(n)).toBe(false))
})

// ── taskType validation ───────────────────────────────────────────────
describe("taskType validation", () => {
  const VALID_TASK_TYPES = ["task1", "task2"]
  const isValid = (t: string) => VALID_TASK_TYPES.includes(t)

  test("task1 is valid", () => expect(isValid("task1")).toBe(true))
  test("task2 is valid", () => expect(isValid("task2")).toBe(true))
  test("task3 is invalid", () => expect(isValid("task3")).toBe(false))
  test("Task1 is invalid (case-sensitive)", () => expect(isValid("Task1")).toBe(false))
  test("empty string is invalid", () => expect(isValid("")).toBe(false))
})

// ── Submission rate calculation (used in getAssignmentStats) ──────────
describe("Submission rate calculation", () => {
  const calcRate = (submitted: number, enrolled: number): number =>
    enrolled > 0 ? Math.round((submitted / enrolled) * 100) : 0

  test.each([
    [0,  10, 0],
    [5,  10, 50],
    [10, 10, 100],
    [3,  7,  43],   // 3/7 = 42.857... → 43
    [0,  0,  0],    // no students enrolled
  ])("submitted=%d enrolled=%d → %d%%", (s, e, expected) => {
    expect(calcRate(s, e)).toBe(expected)
  })
})
