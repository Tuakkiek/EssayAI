/**
 * subscription.test.ts  (Phase 6)
 * Tests pure logic — no DB, no HTTP.
 */

import { PLAN_META, withinLimit, SubscriptionPlan } from "../models/PaymentTransaction"

// ── PLAN_META structure ────────────────────────────────────────────────
describe("PLAN_META completeness", () => {
  const plans: SubscriptionPlan[] = ["free", "starter", "pro", "enterprise"]

  test("all four plans are defined", () => {
    plans.forEach(p => expect(PLAN_META[p]).toBeDefined())
  })

  test("each plan has required fields", () => {
    plans.forEach(plan => {
      const m = PLAN_META[plan]
      expect(typeof m.priceVnd).toBe("number")
      expect(typeof m.maxStudents).toBe("number")
      expect(typeof m.maxTeachers).toBe("number")
      expect(typeof m.maxEssaysPerMonth).toBe("number")
      expect(typeof m.aiGradingEnabled).toBe("boolean")
      expect(typeof m.durationDays).toBe("number")
    })
  })

  test("free plan has zero price", () => {
    expect(PLAN_META.free.priceVnd).toBe(0)
  })

  test("pro plan has unlimited essays (-1)", () => {
    expect(PLAN_META.pro.maxEssaysPerMonth).toBe(-1)
  })

  test("enterprise plan has unlimited students and teachers", () => {
    expect(PLAN_META.enterprise.maxStudents).toBe(-1)
    expect(PLAN_META.enterprise.maxTeachers).toBe(-1)
  })

  test("plans are strictly ordered by student limit", () => {
    const { free, starter, pro } = PLAN_META
    expect(free.maxStudents).toBeLessThan(starter.maxStudents)
    expect(starter.maxStudents).toBeLessThan(pro.maxStudents)
    expect(pro.maxStudents).toBeLessThan(Infinity)  // pro is finite
    expect(PLAN_META.enterprise.maxStudents).toBe(-1) // enterprise = unlimited
  })

  test("prices increase with tier", () => {
    expect(PLAN_META.free.priceVnd).toBe(0)
    expect(PLAN_META.starter.priceVnd).toBeGreaterThan(0)
    expect(PLAN_META.pro.priceVnd).toBeGreaterThan(PLAN_META.starter.priceVnd)
  })

  test("AI grading is enabled on all plans", () => {
    plans.forEach(p => expect(PLAN_META[p].aiGradingEnabled).toBe(true))
  })
})

// ── withinLimit ───────────────────────────────────────────────────────
describe("withinLimit", () => {
  test("-1 (unlimited) always returns true", () => {
    expect(withinLimit(0,    -1)).toBe(true)
    expect(withinLimit(999,  -1)).toBe(true)
    expect(withinLimit(9999, -1)).toBe(true)
  })

  test("used < limit returns true", () => {
    expect(withinLimit(0,  10)).toBe(true)
    expect(withinLimit(9,  10)).toBe(true)
    expect(withinLimit(29, 30)).toBe(true)
  })

  test("used === limit returns false (at cap)", () => {
    expect(withinLimit(10, 10)).toBe(false)
    expect(withinLimit(30, 30)).toBe(false)
  })

  test("used > limit returns false", () => {
    expect(withinLimit(11, 10)).toBe(false)
    expect(withinLimit(100, 30)).toBe(false)
  })

  test("edge: zero limit blocks all", () => {
    expect(withinLimit(0, 0)).toBe(false)
  })
})

// ── Order code format ─────────────────────────────────────────────────
describe("Sepay order code generation", () => {
  const makeOrderCode = (centerId: string) =>
    `CTR-${centerId.slice(-6).toUpperCase()}-${Date.now()}`

  test("starts with CTR-", () => {
    const code = makeOrderCode("abc123def456")
    expect(code).toMatch(/^CTR-/)
  })

  test("contains last 6 chars of centerId uppercased", () => {
    const code = makeOrderCode("abc123def456")
    expect(code).toContain("EF456")
  })

  test("two codes generated at different times are unique", async () => {
    const code1 = makeOrderCode("abc123def456")
    await new Promise(r => setTimeout(r, 2))
    const code2 = makeOrderCode("abc123def456")
    expect(code1).not.toBe(code2)
  })
})

// ── Webhook amount tolerance ──────────────────────────────────────────
describe("Sepay webhook amount matching", () => {
  const TOLERANCE = 1000   // VND

  const amountMatches = (expected: number, received: number) =>
    Math.abs(received - expected) <= TOLERANCE

  test.each([
    [299_000, 299_000, true],
    [299_000, 299_500, true],   // within tolerance
    [299_000, 299_999, true],   // within tolerance (999 < 1000)
    [299_000, 300_000, true],   // exactly at boundary (diff === TOLERANCE, allowed)
    [299_000, 300_001, false],  // over tolerance
    [299_000, 298_000, true],   // under by exactly 1000 (allowed)
  ])("expected=%d received=%d → %s", (exp, rec, expected) => {
    expect(amountMatches(exp, rec)).toBe(expected)
  })
})

// ── Subscription expiry ───────────────────────────────────────────────
describe("Subscription expiry check", () => {
  const isExpired = (plan: SubscriptionPlan, endDate: Date | null) =>
    plan !== "free" && endDate !== null && endDate < new Date()

  test("free plan never expires", () => {
    const pastDate = new Date(Date.now() - 86_400_000)
    expect(isExpired("free", pastDate)).toBe(false)
    expect(isExpired("free", null)).toBe(false)
  })

  test("paid plan with past endDate is expired", () => {
    const yesterday = new Date(Date.now() - 86_400_000)
    expect(isExpired("starter", yesterday)).toBe(true)
    expect(isExpired("pro",     yesterday)).toBe(true)
  })

  test("paid plan with future endDate is not expired", () => {
    const tomorrow = new Date(Date.now() + 86_400_000)
    expect(isExpired("starter", tomorrow)).toBe(false)
  })

  test("paid plan with null endDate is not expired (permanent grant)", () => {
    expect(isExpired("enterprise", null)).toBe(false)
  })
})

// ── Period end date calculation ───────────────────────────────────────
describe("Period end date calculation", () => {
  const calcPeriodEnd = (durationDays: number): Date | null => {
    if (durationDays === 0) return null
    return new Date(Date.now() + durationDays * 86_400_000)
  }

  test("0 days returns null (permanent)", () => {
    expect(calcPeriodEnd(0)).toBeNull()
  })

  test("30 days returns ~30 days from now", () => {
    const end = calcPeriodEnd(30)!
    const diff = end.getTime() - Date.now()
    expect(diff).toBeGreaterThan(29 * 86_400_000)
    expect(diff).toBeLessThan(31 * 86_400_000)
  })

  test("365 days returns ~1 year from now", () => {
    const end = calcPeriodEnd(365)!
    const diff = end.getTime() - Date.now()
    expect(diff).toBeGreaterThan(364 * 86_400_000)
    expect(diff).toBeLessThan(366 * 86_400_000)
  })
})
