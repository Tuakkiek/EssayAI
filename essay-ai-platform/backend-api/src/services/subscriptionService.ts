import { User, PaymentTransaction } from "../models/index"
import { SubscriptionPlan, IUser } from "../models/User"
import { IPaymentTransaction, PaymentStatus } from "../models/PaymentTransaction"
import { PLANS, getPlanConfig } from "../constants/plans"
import { generateReferenceCode, createTransferInstructions, SepayWebhookPayload, BankTransferInstructions } from "./sepayService"
import { logger } from "../utils/logger"
import { AppError } from "../middlewares/errorHandler"
import mongoose from "mongoose"

// ── Initiate a new payment ────────────────────────────────────────
export interface InitiatePaymentResult {
  transactionId:    string
  referenceCode:    string
  plan:             SubscriptionPlan
  amountVND:        number
  bankInstructions: BankTransferInstructions
}

export const initiatePayment = async (
  userId: string,
  plan:   SubscriptionPlan
): Promise<InitiatePaymentResult> => {
  const planConfig = getPlanConfig(plan)

  if (planConfig.priceVND === 0) {
    throw new AppError("This plan cannot be purchased — contact sales for Enterprise.", 400)
  }

  const user = await User.findById(userId)
  if (!user) throw new AppError("User not found", 404)

  // Cancel any existing pending transactions for same user+plan
  await PaymentTransaction.updateMany(
    { userId: new mongoose.Types.ObjectId(userId), status: "pending" },
    { $set: { status: "cancelled", failureReason: "Superseded by new payment request" } }
  )

  const referenceCode  = generateReferenceCode(plan, userId)
  const bankInstructions = createTransferInstructions(plan, userId, referenceCode)

  const tx = await PaymentTransaction.create({
    userId:        new mongoose.Types.ObjectId(userId),
    plan,
    amountVND:     planConfig.priceVND,
    status:        "pending",
    gateway:       "sepay",
    referenceCode,
  })

  logger.info("Payment initiated", { userId, plan, referenceCode, txId: tx._id })

  return {
    transactionId:    (tx._id as mongoose.Types.ObjectId).toString(),
    referenceCode,
    plan,
    amountVND:        planConfig.priceVND,
    bankInstructions,
  }
}

// ── Confirm payment from Sepay webhook ────────────────────────────
export interface WebhookResult {
  processed:   boolean
  action:      "subscription_activated" | "duplicate" | "amount_mismatch" | "not_found" | "already_processed"
  userId?:     string
  plan?:       SubscriptionPlan
  message:     string
}

export const processWebhook = async (
  payload: SepayWebhookPayload
): Promise<WebhookResult> => {
  const { content, transferAmount, referenceCode: webhookRef, transactionDate } = payload

  // Extract our reference code from description (may be anywhere in memo)
  const refCode = webhookRef || content

  if (!refCode) {
    return { processed: false, action: "not_found", message: "No reference code in transfer description" }
  }

  const tx = await PaymentTransaction.findOne({ referenceCode: refCode.toUpperCase() })
  if (!tx) {
    logger.warn("Webhook: no transaction found", { refCode })
    return { processed: false, action: "not_found", message: `Transaction not found for ref: ${refCode}` }
  }

  if (tx.status === "completed") {
    logger.info("Webhook: duplicate payment notification", { refCode })
    return { processed: true, action: "already_processed", message: "Transaction already completed" }
  }

  // Verify amount
  if (transferAmount < tx.amountVND) {
    logger.warn("Webhook: amount mismatch", { received: transferAmount, expected: tx.amountVND, refCode })
    await PaymentTransaction.findByIdAndUpdate(tx._id, {
      $set: { status: "failed", failureReason: `Amount mismatch: received ${transferAmount}, expected ${tx.amountVND}` },
    })
    return {
      processed: false,
      action:    "amount_mismatch",
      message:   `Insufficient amount. Received ${transferAmount.toLocaleString()} VND, expected ${tx.amountVND.toLocaleString()} VND`,
    }
  }

  // Activate subscription
  const planConfig = getPlanConfig(tx.plan)
  const now        = new Date()
  const endDate    = new Date(now.getTime() + planConfig.durationDays * 24 * 60 * 60 * 1000)

  // Store Sepay raw data for audit
  await PaymentTransaction.findByIdAndUpdate(tx._id, {
    $set: {
      status:            "completed",
      subscriptionStart: now,
      subscriptionEnd:   endDate,
      sepayData: {
        transactionId:  String(payload.id),
        bankCode:       payload.gateway,
        accountNumber:  payload.accountNumber,
        transferAmount: payload.transferAmount,
        description:    payload.content,
        transferAt:     payload.transactionDate,
        referenceCode:  refCode,
      },
    },
  })

  // Update user subscription
  await User.findByIdAndUpdate(tx.userId, {
    $set: {
      "subscription.plan":      tx.plan,
      "subscription.startDate": now,
      "subscription.endDate":   endDate,
      "subscription.isActive":  true,
    },
  })

  logger.info("Subscription activated", { userId: tx.userId, plan: tx.plan, endDate })

  return {
    processed: true,
    action:    "subscription_activated",
    userId:    tx.userId.toString(),
    plan:      tx.plan,
    message:   `${planConfig.name} subscription activated until ${endDate.toLocaleDateString()}`,
  }
}

// ── Check subscription status ─────────────────────────────────────
export interface SubscriptionStatus {
  plan:          SubscriptionPlan
  isActive:      boolean
  isExpired:     boolean
  daysRemaining: number | null
  endDate:       Date | null
  essaysPerMonth: number
  canScore:      boolean
}

export const getSubscriptionStatus = async (userId: string): Promise<SubscriptionStatus> => {
  const user = await User.findById(userId).select("subscription")
  if (!user) throw new AppError("User not found", 404)

  const { plan, endDate, isActive } = user.subscription
  const config = getPlanConfig(plan)
  const now    = new Date()

  const isExpired = plan !== "free" && !!endDate && endDate < now

  // Auto-downgrade if expired
  if (isExpired) {
    await User.findByIdAndUpdate(userId, {
      $set: {
        "subscription.plan":     "free",
        "subscription.isActive": false,
      },
    })
  }

  const effectivePlan = isExpired ? "free" : plan
  const effectiveConfig = getPlanConfig(effectivePlan)

  const daysRemaining = endDate && !isExpired
    ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : null

  return {
    plan:          effectivePlan,
    isActive:      isActive && !isExpired,
    isExpired,
    daysRemaining,
    endDate:       endDate ?? null,
    essaysPerMonth: effectiveConfig.essaysPerMonth,
    canScore:      true,   // Limit checking at usage time
  }
}

// ── Get payment history for a user ───────────────────────────────
export const getPaymentHistory = async (
  userId: string,
  page   = 1,
  limit  = 10
): Promise<{ transactions: IPaymentTransaction[]; total: number }> => {
  const skip  = (page - 1) * limit
  const query = { userId: new mongoose.Types.ObjectId(userId) }

  const [transactions, total] = await Promise.all([
    PaymentTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    PaymentTransaction.countDocuments(query),
  ])

  return { transactions: transactions as unknown as IPaymentTransaction[], total }
}

// ── Cancel subscription (downgrade to free immediately) ──────────
export const cancelSubscription = async (userId: string): Promise<void> => {
  const user = await User.findById(userId).select("subscription")
  if (!user) throw new AppError("User not found", 404)
  if (user.subscription.plan === "free") throw new AppError("No active subscription to cancel", 400)

  await User.findByIdAndUpdate(userId, {
    $set: {
      "subscription.plan":     "free",
      "subscription.isActive": false,
    },
  })

  logger.info("Subscription cancelled", { userId })
}

// ── Admin: manually grant subscription ───────────────────────────
export const grantSubscription = async (
  userId:      string,
  plan:        SubscriptionPlan,
  durationDays: number,
  note?:       string
): Promise<void> => {
  const planConfig = getPlanConfig(plan)
  const now        = new Date()
  const endDate    = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)

  await User.findByIdAndUpdate(userId, {
    $set: {
      "subscription.plan":      plan,
      "subscription.startDate": now,
      "subscription.endDate":   endDate,
      "subscription.isActive":  true,
    },
  })

  const refCode = `MANUAL${Date.now()}`
  await PaymentTransaction.create({
    userId: new mongoose.Types.ObjectId(userId),
    plan,
    amountVND:         0,
    status:            "completed",
    gateway:           "manual",
    referenceCode:     refCode,
    subscriptionStart: now,
    subscriptionEnd:   endDate,
    note:              note ?? `Manual grant by admin`,
  })

  logger.info("Subscription manually granted", { userId, plan, durationDays, endDate })
}
