/**
 * subscriptionService.ts  (Phase 6)
 *
 * Responsibilities:
 *  1. Enforce plan limits (students, teachers, essays-per-month) before
 *     any write operation that consumes quota.
 *  2. Handle Sepay webhook — idempotent, signature-verified.
 *  3. Allow super-admin to manually grant/upgrade plans.
 *  4. Provide a checkLimit() helper consumed by essayService before AI grading.
 *
 * Subscription lives on Center — never on User.
 */

import mongoose from "mongoose"
import crypto   from "crypto"
import Center   from "../models/Center"
import PaymentTransaction from "../models/PaymentTransaction"
import { IPaymentTransaction, PLAN_META, SubscriptionPlan, withinLimit } from "../models/PaymentTransaction"
import { User, Essay } from "../models/index"
import { AppError } from "../middlewares/errorHandler"
import { logger } from "../utils/logger"

// ── Plan limit enforcement ────────────────────────────────────────────

export type LimitType = "students" | "teachers" | "essays_month"

export interface LimitCheckResult {
  allowed: boolean
  reason?: string
  used:    number
  limit:   number
}

/**
 * Check whether a center (or individual user) is within plan limits.
 *
 * @param centerId  - null nếu là student tự đăng ký
 * @param limitType - loại quota cần kiểm tra
 * @param userId    - bắt buộc nếu centerId = null (dùng để tra selfSubscription)
 */
export const checkLimit = async (
  centerId:  string | null,
  limitType: LimitType,
  userId?:   string
): Promise<LimitCheckResult> => {
  // ── Self-registered student (no center) ─────────────────────────────
  if (!centerId) {
    if (!userId) throw new AppError("userId required for individual quota check", 500)

    const user = await User.findById(userId).select("selfSubscription stats")
    if (!user) throw new AppError("User not found", 404)

    const plan = (user.selfSubscription?.plan ?? "individual_free") as SubscriptionPlan
    const meta = PLAN_META[plan]

    // Subscription expired?
    const effectiveMeta =
      plan !== "individual_free" &&
      user.selfSubscription?.endDate &&
      user.selfSubscription.endDate < new Date()
        ? PLAN_META["individual_free"]
        : meta

    if (limitType === "essays_month") {
      const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0)
      const used = await Essay.countDocuments({
        studentId: new (await import("mongoose")).default.Types.ObjectId(userId),
        centerId:  null,
        createdAt: { $gte: start },
        status:    { $ne: "error" },
      })
      const limit = effectiveMeta.maxEssaysPerMonth
      return {
        allowed: withinLimit(used, limit),
        used,
        limit,
        reason: withinLimit(used, limit)
          ? undefined
          : `Gói miễn phí cho phép ${limit} bài/tháng. Nâng cấp lên Pro để không giới hạn.`,
      }
    }

    // students/teachers: self-registered users are always within individual limits
    return { allowed: true, used: 1, limit: 1 }
  }

  // ── Center-based subscription ────────────────────────────────────────
  const center = await Center.findById(centerId).select("subscription studentCount teacherCount")
  if (!center) throw new AppError("Center not found", 404)

  const plan = center.subscription.plan as SubscriptionPlan
  const meta = PLAN_META[plan]

  // Subscription expired?
  if (plan !== "free" && center.subscription.endDate && center.subscription.endDate < new Date()) {
    return checkAgainstMeta(centerId, limitType, PLAN_META["free"], center)
  }

  return checkAgainstMeta(centerId, limitType, meta, center)
}

const checkAgainstMeta = async (
  centerId:  string,
  limitType: LimitType,
  meta:      typeof PLAN_META[SubscriptionPlan],
  center:    any
) => {
  if (limitType === "students") {
    const used  = center!.studentCount
    const limit = meta.maxStudents
    return {
      allowed: withinLimit(used, limit),
      used,
      limit,
      reason: withinLimit(used, limit)
        ? undefined
        : `Your plan allows ${limit} students. Upgrade to add more.`,
    }
  }

  if (limitType === "teachers") {
    const used  = center!.teacherCount
    const limit = meta.maxTeachers
    return {
      allowed: withinLimit(used, limit),
      used,
      limit,
      reason: withinLimit(used, limit)
        ? undefined
        : `Your plan allows ${limit} teachers. Upgrade to add more.`,
    }
  }

  // essays_month — count essays submitted this calendar month
  const start = new Date()
  start.setDate(1); start.setHours(0, 0, 0, 0)
  const used = await Essay.countDocuments({
    centerId: new mongoose.Types.ObjectId(centerId),
    createdAt: { $gte: start },
    status:    { $ne: "error" },
  })
  const limit = meta.maxEssaysPerMonth
  return {
    allowed: withinLimit(used, limit),
    used,
    limit,
    reason: withinLimit(used, limit)
      ? undefined
      : `Your plan allows ${limit} AI gradings per month. Upgrade for unlimited.`,
  }
}

// ── Get center subscription details ──────────────────────────────────

export const getSubscription = async (centerId: string) => {
  const center = await Center.findById(centerId)
    .select("name subscription studentCount teacherCount")
  if (!center) throw new AppError("Center not found", 404)

  const plan = center.subscription.plan as SubscriptionPlan
  const meta = PLAN_META[plan]

  const isExpired = plan !== "free"
    && center.subscription.endDate != null
    && center.subscription.endDate < new Date()

  return {
    center: {
      id:   center._id,
      name: center.name,
    },
    subscription: {
      ...(center.subscription as any),
      isExpired,
      effectivePlan: isExpired ? "free" : plan,
    },
    planMeta: isExpired ? PLAN_META["free"] : meta,
    usage: {
      students: center.studentCount,
      teachers: center.teacherCount,
    },
  }
}

// ── Create payment intent (initiate Sepay payment) ────────────────────

export interface CreatePaymentInput {
  centerId: string
  plan:     SubscriptionPlan
}

export const createPaymentIntent = async (
  input: CreatePaymentInput
): Promise<IPaymentTransaction> => {
  const { centerId, plan } = input

  if (plan === "free") {
    throw new AppError("Cannot create a payment for the free plan", 400)
  }

  const meta = PLAN_META[plan]
  const orderCode = `CTR-${centerId.slice(-6).toUpperCase()}-${Date.now()}`

  const tx = await PaymentTransaction.create({
    centerId:       new mongoose.Types.ObjectId(centerId),
    plan,
    amountVnd:      meta.priceVnd,
    gateway:        "sepay",
    status:         "pending",
    sepayOrderCode: orderCode,
  })

  logger.info("Payment intent created", { txId: tx._id, centerId, plan, amountVnd: meta.priceVnd })
  return tx
}

// ── Sepay webhook handler ─────────────────────────────────────────────

export interface SepayWebhookPayload {
  id:              number
  gateway:         string
  transactionDate: string
  accountNumber:   string
  subAccount:      string | null
  code:            string          // = sepayOrderCode
  content:         string
  transferType:    "in" | "out"
  description:     string
  transferAmount:  number
  referenceCode:   string
  accumulated:     number
  body?:           Record<string, unknown>
}

/**
 * Idempotent — safe to call multiple times for the same event.
 * Verifies the webhook signature using HMAC-SHA256.
 */
export const handleSepayWebhook = async (
  payload:   SepayWebhookPayload,
  signature: string,
  secret:    string
): Promise<{ processed: boolean; reason?: string }> => {
  // 1. Signature verification
  const expected = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex")

  if (expected !== signature) {
    logger.warn("Sepay webhook signature mismatch", { code: payload.code })
    throw new AppError("Invalid webhook signature", 401)
  }

  // 2. Only process "in" transfers
  if (payload.transferType !== "in") {
    return { processed: false, reason: "Not an inbound transfer" }
  }

  // 3. Find the pending transaction by order code
  const tx = await PaymentTransaction.findOne({
    sepayOrderCode: payload.code,
    status:         "pending",
  })
  if (!tx) {
    // Could be a duplicate delivery — check if already completed
    const completed = await PaymentTransaction.findOne({ sepayOrderCode: payload.code, status: "completed" })
    if (completed) return { processed: false, reason: "Already processed" }
    logger.warn("Sepay webhook: order code not found", { code: payload.code })
    return { processed: false, reason: "Order not found" }
  }

  // 4. Idempotency guard on Sepay transaction ID
  if (payload.id) {
    const duplicate = await PaymentTransaction.findOne({
      sepayTransactionId: String(payload.id),
    })
    if (duplicate) return { processed: false, reason: "Duplicate event" }
  }

  // 5. Amount check (allow within ±1000 VND rounding tolerance)
  const diff = Math.abs(payload.transferAmount - tx.amountVnd)
  if (diff > 1000) {
    logger.warn("Sepay webhook: amount mismatch", {
      expected: tx.amountVnd,
      received: payload.transferAmount,
      code:     payload.code,
    })
    await PaymentTransaction.findByIdAndUpdate(tx._id, {
      status:          "failed",
      note:            `Amount mismatch: expected ${tx.amountVnd}, got ${payload.transferAmount}`,
      sepayRawPayload: payload,
    })
    return { processed: false, reason: "Amount mismatch" }
  }

  // 6. Mark transaction complete
  const meta        = PLAN_META[tx.plan]
  const periodStart = new Date()
  const periodEnd   = meta.durationDays > 0
    ? new Date(Date.now() + meta.durationDays * 86_400_000)
    : null

  await PaymentTransaction.findByIdAndUpdate(tx._id, {
    status:             "completed",
    sepayTransactionId: String(payload.id),
    sepayRawPayload:    payload,
    paidAt:             new Date(),
    periodStart,
    periodEnd,
  })

  // 7. Activate subscription on Center
  await Center.findByIdAndUpdate(tx.centerId, {
    "subscription.plan":      tx.plan,
    "subscription.startDate": periodStart,
    "subscription.endDate":   periodEnd,
    "subscription.isActive":  true,
  })

  logger.info("Subscription activated", {
    centerId: tx.centerId,
    plan:     tx.plan,
    periodEnd,
  })

  return { processed: true }
}

// ── Super-admin: manual plan grant ────────────────────────────────────

export interface ManualGrantInput {
  centerId:     string
  plan:         SubscriptionPlan
  durationDays: number   // 0 = permanent (used for enterprise)
  note?:        string
  grantedBy:    string   // super_admin userId
}

export const manualGrantPlan = async (
  input: ManualGrantInput
): Promise<IPaymentTransaction> => {
  const { centerId, plan, durationDays, note, grantedBy } = input

  const center = await Center.findById(centerId)
  if (!center) throw new AppError("Center not found", 404)

  const periodStart = new Date()
  const periodEnd   = durationDays > 0
    ? new Date(Date.now() + durationDays * 86_400_000)
    : null

  // Record the manual transaction
  const tx = await PaymentTransaction.create({
    centerId:    new mongoose.Types.ObjectId(centerId),
    plan,
    amountVnd:   0,      // free grant
    gateway:     "manual",
    status:      "completed",
    paidAt:      periodStart,
    periodStart,
    periodEnd,
    processedBy: new mongoose.Types.ObjectId(grantedBy),
    note,
  })

  // Activate on Center
  await Center.findByIdAndUpdate(centerId, {
    "subscription.plan":      plan,
    "subscription.startDate": periodStart,
    "subscription.endDate":   periodEnd,
    "subscription.isActive":  true,
  })

  logger.info("Manual plan granted", { centerId, plan, grantedBy, periodEnd })
  return tx
}

// ── List payment history for a center ────────────────────────────────

export const listPayments = async (
  centerId: string,
  page  = 1,
  limit = 20
) => {
  const query = { centerId: new mongoose.Types.ObjectId(centerId) }
  const skip  = (page - 1) * limit

  const [transactions, total] = await Promise.all([
    PaymentTransaction.find(query)
      .select("-sepayRawPayload")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    PaymentTransaction.countDocuments(query),
  ])

  return {
    transactions,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  }
}

// ── Self-student quota enforcement ───────────────────────────────────
/**
 * Limits cho sinh viên tự đăng ký (không thuộc trung tâm).
 *
 * individual_free:  50 bài AI chấm/tháng
 * individual_pro:  không giới hạn (sau này tích hợp thanh toán cá nhân)
 */
const SELF_STUDENT_LIMITS = {
  individual_free: { essaysPerMonth: 50 },
  individual_pro:  { essaysPerMonth: -1 },   // -1 = unlimited
} as const

export const checkSelfStudentLimit = async (
  studentId: string
): Promise<{ allowed: boolean; reason?: string; used: number; limit: number }> => {
  const student = await User.findById(studentId)
    .select("selfSubscription stats")
  if (!student) throw new AppError("User not found", 404)

  const plan = (student.selfSubscription?.plan ?? "individual_free") as
    keyof typeof SELF_STUDENT_LIMITS

  // Subscription expired?
  const endDate = student.selfSubscription?.endDate
  const effectivePlan =
    endDate && endDate < new Date() ? "individual_free" : plan

  const limit = SELF_STUDENT_LIMITS[effectivePlan]?.essaysPerMonth ?? 50

  // Count essays this calendar month
  const monthStart = new Date()
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)

  const used = await Essay.countDocuments({
    studentId: new mongoose.Types.ObjectId(studentId),
    centerId:  null,   // self-student essays have no centerId
    createdAt: { $gte: monthStart },
    status:    { $ne: "error" },
  })

  const allowed = limit === -1 || used < limit

  return {
    allowed,
    used,
    limit,
    reason: allowed
      ? undefined
      : `Bạn đã sử dụng hết ${limit} lượt chấm điểm miễn phí tháng này. Nâng cấp để tiếp tục.`,
  }
}
