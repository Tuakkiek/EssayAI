/**
 * superAdmin.test.ts  (Phase 7)
 * Tests pure logic — no DB, no HTTP.
 */

// ── Platform stats shape ───────────────────────────────────────────────
describe("Platform stats structure", () => {
  // Simulate the shape returned by getPlatformStats
  const mockStats = {
    centers:       { total: 42, active: 38 },
    users:         { total: 1500, students: 1200 },
    essays:        { total: 8000, thisMonth: 650 },
    revenue:       { totalVnd: 15_000_000 },
    planBreakdown: [
      { plan: "free",     count: 25 },
      { plan: "starter",  count: 10 },
      { plan: "pro",      count: 5 },
      { plan: "enterprise", count: 2 },
    ],
  }

  test("has all required top-level keys", () => {
    expect(mockStats).toHaveProperty("centers")
    expect(mockStats).toHaveProperty("users")
    expect(mockStats).toHaveProperty("essays")
    expect(mockStats).toHaveProperty("revenue")
    expect(mockStats).toHaveProperty("planBreakdown")
  })

  test("planBreakdown sums to total centers", () => {
    const total = mockStats.planBreakdown.reduce((s, p) => s + p.count, 0)
    expect(total).toBe(mockStats.centers.total)
  })

  test("active centers <= total centers", () => {
    expect(mockStats.centers.active).toBeLessThanOrEqual(mockStats.centers.total)
  })

  test("students count <= total users", () => {
    expect(mockStats.users.students).toBeLessThanOrEqual(mockStats.users.total)
  })

  test("thisMonth essays <= total essays", () => {
    expect(mockStats.essays.thisMonth).toBeLessThanOrEqual(mockStats.essays.total)
  })
})

// ── Growth timeseries shape ───────────────────────────────────────────
describe("Growth timeseries", () => {
  const makeTimeseries = (days: number) => {
    const result: { date: string; count: number }[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000)
      result.push({
        date:  d.toISOString().slice(0, 10),
        count: Math.floor(Math.random() * 10),
      })
    }
    return result
  }

  test("returns correct number of days", () => {
    expect(makeTimeseries(30)).toHaveLength(30)
    expect(makeTimeseries(7)).toHaveLength(7)
  })

  test("dates are in YYYY-MM-DD format", () => {
    const ts = makeTimeseries(5)
    ts.forEach(row => expect(row.date).toMatch(/^\d{4}-\d{2}-\d{2}$/))
  })

  test("dates are in ascending order", () => {
    const ts = makeTimeseries(10)
    for (let i = 1; i < ts.length; i++) {
      expect(ts[i].date >= ts[i - 1].date).toBe(true)
    }
  })
})

// ── Center filter query building ──────────────────────────────────────
describe("Center list filter", () => {
  interface Query { isActive?: boolean; "subscription.plan"?: string; $or?: unknown[] }

  const buildQuery = (opts: {
    isActive?: boolean
    plan?:     string
    search?:   string
  }): Query => {
    const q: Query = {}
    if (opts.isActive !== undefined) q.isActive = opts.isActive
    if (opts.plan)    q["subscription.plan"] = opts.plan
    if (opts.search) {
      const esc = opts.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      q.$or = [
        { name:         { $regex: esc, $options: "i" } },
        { slug:         { $regex: esc, $options: "i" } },
        { contactEmail: { $regex: esc, $options: "i" } },
      ]
    }
    return q
  }

  test("empty filter produces empty query", () => {
    expect(buildQuery({})).toEqual({})
  })

  test("isActive filter applied", () => {
    expect(buildQuery({ isActive: false }).isActive).toBe(false)
    expect(buildQuery({ isActive: true  }).isActive).toBe(true)
  })

  test("plan filter applied on subscription.plan", () => {
    expect(buildQuery({ plan: "pro" })["subscription.plan"]).toBe("pro")
  })

  test("search adds $or with 3 fields", () => {
    const q = buildQuery({ search: "abc" })
    expect(Array.isArray(q.$or)).toBe(true)
    expect((q.$or as unknown[]).length).toBe(3)
  })

  test("search escapes regex special chars", () => {
    const q = buildQuery({ search: "center.io" })
    const nameField = (q.$or as any[])[0].name.$regex
    expect(nameField).toBe("center\\.io")
  })
})

// ── Impersonation token claims ────────────────────────────────────────
describe("Impersonation token", () => {
  const buildImpersonationPayload = (superAdminId: string, centerId: string) => ({
    userId:       superAdminId,
    email:        "super@admin",
    role:         "super_admin",
    centerId,
    _impersonate: true,
  })

  test("payload includes _impersonate flag", () => {
    const p = buildImpersonationPayload("sa1", "c1")
    expect(p._impersonate).toBe(true)
  })

  test("payload preserves super_admin role", () => {
    const p = buildImpersonationPayload("sa1", "c1")
    expect(p.role).toBe("super_admin")
  })

  test("payload includes target centerId", () => {
    const p = buildImpersonationPayload("sa1", "center-xyz")
    expect(p.centerId).toBe("center-xyz")
  })

  test("payload preserves superAdminId as userId", () => {
    const p = buildImpersonationPayload("superadmin-abc", "c1")
    expect(p.userId).toBe("superadmin-abc")
  })
})

// ── Manual plan grant validation ──────────────────────────────────────
describe("Manual plan grant validation", () => {
  const VALID_PLANS = ["free", "starter", "pro", "enterprise"]

  const validate = (plan: string, durationDays: unknown): string | null => {
    if (!VALID_PLANS.includes(plan)) return `Invalid plan: ${plan}`
    if (typeof durationDays !== "number") return "durationDays must be a number"
    if (durationDays < 0) return "durationDays cannot be negative"
    return null
  }

  test("valid inputs pass", () => {
    expect(validate("pro", 30)).toBeNull()
    expect(validate("enterprise", 0)).toBeNull()   // 0 = permanent
    expect(validate("free", 0)).toBeNull()
  })

  test("invalid plan fails", () => {
    expect(validate("ultimate", 30)).toMatch(/Invalid plan/)
  })

  test("missing durationDays fails", () => {
    expect(validate("pro", undefined)).toMatch(/number/)
  })

  test("negative durationDays fails", () => {
    expect(validate("pro", -1)).toMatch(/negative/)
  })
})

// ── Essay analytics score bucket labels ──────────────────────────────
describe("Essay score bucket boundaries", () => {
  const BOUNDARIES = [0, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.1]

  const getBucket = (score: number): string => {
    for (let i = 0; i < BOUNDARIES.length - 1; i++) {
      if (score >= BOUNDARIES[i] && score < BOUNDARIES[i + 1]) {
        return `${BOUNDARIES[i]}-${BOUNDARIES[i + 1]}`
      }
    }
    return "other"
  }

  test.each([
    [0,   "0-4"],
    [3.5, "0-4"],
    [4,   "4-4.5"],
    [5,   "5-5.5"],
    [6.5, "6.5-7"],
    [7,   "7-7.5"],
    [9,   "9-9.1"],
  ])("score %d → bucket %s", (score, expected) => {
    expect(getBucket(score)).toBe(expected)
  })
})
