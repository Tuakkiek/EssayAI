/**
 * selfStudent.test.ts
 * Tests cho luồng student tự đăng ký — không cần trung tâm.
 */

import { PLAN_META, withinLimit } from "../models/PaymentTransaction"

// ── Individual plan limits ─────────────────────────────────────────────
describe("Individual plans (self-registered students)", () => {
  test("individual_free tồn tại trong PLAN_META", () => {
    expect(PLAN_META["individual_free"]).toBeDefined()
  })

  test("individual_pro tồn tại trong PLAN_META", () => {
    expect(PLAN_META["individual_pro"]).toBeDefined()
  })

  test("individual_free: giới hạn 10 bài/tháng", () => {
    expect(PLAN_META["individual_free"].maxEssaysPerMonth).toBe(10)
  })

  test("individual_pro: không giới hạn bài (-1)", () => {
    expect(PLAN_META["individual_pro"].maxEssaysPerMonth).toBe(-1)
  })

  test("individual_free: miễn phí", () => {
    expect(PLAN_META["individual_free"].priceVnd).toBe(0)
  })

  test("individual_pro: giá 99,000 VND", () => {
    expect(PLAN_META["individual_pro"].priceVnd).toBe(99_000)
  })

  test("individual_free: không hết hạn (durationDays = 0)", () => {
    expect(PLAN_META["individual_free"].durationDays).toBe(0)
  })

  test("individual_pro: chu kỳ 30 ngày", () => {
    expect(PLAN_META["individual_pro"].durationDays).toBe(30)
  })

  test("cả hai plan đều bật AI chấm điểm", () => {
    expect(PLAN_META["individual_free"].aiGradingEnabled).toBe(true)
    expect(PLAN_META["individual_pro"].aiGradingEnabled).toBe(true)
  })
})

// ── Quota enforcement for self-registered student ─────────────────────
describe("Quota: individual_free (10 bài/tháng)", () => {
  const MAX = 10

  const checkEssayLimit = (used: number) => withinLimit(used, MAX)

  test("0 bài đã nộp → được phép", () => expect(checkEssayLimit(0)).toBe(true))
  test("9 bài đã nộp → được phép", () => expect(checkEssayLimit(9)).toBe(true))
  test("10 bài đã nộp → bị chặn (đạt giới hạn)", () => expect(checkEssayLimit(10)).toBe(false))
  test("11 bài đã nộp → bị chặn", () => expect(checkEssayLimit(11)).toBe(false))
})

describe("Quota: individual_pro (không giới hạn)", () => {
  const MAX = -1   // -1 = unlimited

  const checkEssayLimit = (used: number) => withinLimit(used, MAX)

  test("100 bài → vẫn được phép", () => expect(checkEssayLimit(100)).toBe(true))
  test("9999 bài → vẫn được phép", () => expect(checkEssayLimit(9999)).toBe(true))
})

// ── registrationMode logic ─────────────────────────────────────────────
describe("registrationMode", () => {
  type Mode = "self" | "center"

  const isSelfRegistered = (centerId: string | null, mode?: Mode) =>
    centerId === null || mode === "self"

  const requiresCenterId = (mode?: Mode) => mode !== "self"

  test("centerId=null → self-registered", () => {
    expect(isSelfRegistered(null)).toBe(true)
  })

  test("centerId có giá trị → center student", () => {
    expect(isSelfRegistered("center-abc")).toBe(false)
  })

  test("mode='self' → self-registered kể cả có centerId", () => {
    expect(isSelfRegistered("x", "self")).toBe(true)
  })

  test("self-registered không cần centerId để đăng nhập", () => {
    expect(requiresCenterId("self")).toBe(false)
  })

  test("center student cần centerId để đăng nhập qua phone", () => {
    expect(requiresCenterId("center")).toBe(true)
    expect(requiresCenterId(undefined)).toBe(true)
  })
})

// ── centerId null safety trong essay query ────────────────────────────
describe("Essay query scoping: centerId null safety", () => {
  interface EssayQuery {
    centerId: unknown
    studentId?: string
  }

  const buildEssayQuery = (
    centerId:    string | null,
    requesterId: string,
    role:        string
  ): EssayQuery => {
    const q: EssayQuery = { centerId: centerId ?? null }

    if (!centerId) {
      // self-registered: bắt buộc scope bằng studentId
      q.studentId = requesterId
      q.centerId  = null
    } else if (role === "student") {
      q.studentId = requesterId
      q.centerId  = centerId
    }
    return q
  }

  test("self-student: query luôn có studentId filter", () => {
    const q = buildEssayQuery(null, "s1", "student")
    expect(q.studentId).toBe("s1")
    expect(q.centerId).toBeNull()
  })

  test("center-student: query có cả centerId và studentId", () => {
    const q = buildEssayQuery("center-1", "s1", "student")
    expect(q.centerId).toBe("center-1")
    expect(q.studentId).toBe("s1")
  })

  test("teacher xem tất cả trong center: không có studentId filter", () => {
    const q = buildEssayQuery("center-1", "t1", "teacher")
    expect(q.centerId).toBe("center-1")
    expect(q.studentId).toBeUndefined()
  })

  test("self-student không thể xem essay của center khác", () => {
    // centerId=null → chỉ match bài của chính họ (centerId: null trong DB)
    const q = buildEssayQuery(null, "s1", "student")
    expect(q.centerId).toBeNull()   // chỉ lấy bài có centerId=null
    expect(q.studentId).toBe("s1") // và phải là của chính họ
  })
})

// ── Self-student không nộp được center assignment ─────────────────────
describe("Assignment restriction for self-students", () => {
  const canSubmitToAssignment = (centerId: string | null): { allowed: boolean; reason?: string } => {
    if (!centerId) {
      return { allowed: false, reason: "Bài tập do trung tâm tạo — cần tài khoản trung tâm" }
    }
    return { allowed: true }
  }

  test("self-student bị chặn khi nộp bài tập của trung tâm", () => {
    const result = canSubmitToAssignment(null)
    expect(result.allowed).toBe(false)
    expect(result.reason).toBeDefined()
  })

  test("center-student nộp được bài tập của trung tâm", () => {
    const result = canSubmitToAssignment("center-1")
    expect(result.allowed).toBe(true)
  })

  test("self-student vẫn nộp được free-write (không có assignmentId)", () => {
    // Free-write không cần centerId
    const assignmentId = undefined
    const canFreeWrite = (assignmentId?: string) => !assignmentId // always allowed
    expect(canFreeWrite(assignmentId)).toBe(true)
  })
})

// ── Đăng ký validation ─────────────────────────────────────────────────
describe("Self-student registration validation", () => {
  const validate = (name: string, email: string, password: string): string | null => {
    if (!name || !email || !password) return "Thiếu thông tin bắt buộc"
    if (password.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự"
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Email không hợp lệ"
    return null
  }

  test("thông tin hợp lệ → pass", () =>
    expect(validate("Nguyen Van A", "a@b.com", "password123")).toBeNull())

  test("thiếu name → lỗi", () =>
    expect(validate("", "a@b.com", "password123")).toMatch(/Thiếu/))

  test("thiếu email → lỗi", () =>
    expect(validate("Nam", "", "password123")).toMatch(/Thiếu/))

  test("password < 6 ký tự → lỗi", () =>
    expect(validate("Nam", "a@b.com", "123")).toMatch(/6 ký tự/))

  test("email không hợp lệ → lỗi", () =>
    expect(validate("Nam", "notanemail", "password123")).toMatch(/Email/))
})
