import { Request, Response, NextFunction } from "express"
import { sendSuccess, sendCreated, sendError, sendBadRequest } from "../utils/response"
import { logger } from "../utils/logger"
import { SubscriptionPlan } from "../models/User"
import { PLANS } from "../constants/plans"
import { verifyWebhookSignature, extractReferenceCode, SepayWebhookPayload } from "../services/sepayService"
import {
  initiatePayment,
  processWebhook,
  getSubscriptionStatus,
  getPaymentHistory,
  cancelSubscription,
  grantSubscription,
} from "../services/subscriptionService"

// ── GET /api/payment/plans ────────────────────────────────────────
export const listPlans = (_req: Request, res: Response): void => {
  const plans = Object.values(PLANS).map(({ id, name, priceVND, priceUSD, durationDays, essaysPerMonth, features, popular }) => ({
    id, name, priceVND, priceUSD, durationDays, essaysPerMonth, features, popular,
  }))
  sendSuccess(res, { plans }, "Plans retrieved")
}

// ── POST /api/payment/initiate ────────────────────────────────────
// Body: { userId, plan }
export const initiatePaymentHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const { userId, plan } = req.body as { userId?: string; plan?: string }

    if (!userId) { sendBadRequest(res, "userId is required"); return }
    if (!plan)   { sendBadRequest(res, "plan is required");   return }
    if (!["starter", "pro"].includes(plan)) {
      sendBadRequest(res, "plan must be 'starter' or 'pro'"); return
    }

    const result = await initiatePayment(userId, plan as SubscriptionPlan)
    sendCreated(res, result, "Payment initiated — complete bank transfer to activate subscription")
  } catch (err) {
    next(err)
  }
}

// ── POST /api/payment/webhook ─────────────────────────────────────
// Called by Sepay when a bank transfer is detected
// Must receive raw body for HMAC — see server.ts for raw body middleware
export const webhookHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    // Verify signature
    const signature = req.headers["x-sepay-signature"] as string | undefined
    const rawBody   = (req as Request & { rawBody?: string }).rawBody ?? JSON.stringify(req.body)

    if (signature) {
      const valid = verifyWebhookSignature(rawBody, signature)
      if (!valid) {
        logger.warn("Webhook signature verification failed")
        sendError(res, "Invalid signature", 401)
        return
      }
    }

    const payload = req.body as SepayWebhookPayload

    // Only process incoming transfers
    if (payload.transferType === "out") {
      res.json({ success: true, message: "Outgoing transfer — ignored" })
      return
    }

    logger.info("Webhook received", {
      id:     payload.id,
      amount: payload.transferAmount,
      ref:    payload.referenceCode || payload.content,
    })

    const result = await processWebhook(payload)

    logger.info("Webhook processed", result)
    res.json({ success: true, ...result })
  } catch (err) {
    next(err)
  }
}

// ── GET /api/payment/status?userId= ──────────────────────────────
export const getStatusHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const userId = req.query["userId"] as string
    if (!userId) { sendBadRequest(res, "userId is required"); return }

    const status = await getSubscriptionStatus(userId)
    sendSuccess(res, status, "Subscription status retrieved")
  } catch (err) {
    next(err)
  }
}

// ── GET /api/payment/history?userId=&page=&limit= ─────────────────
export const getHistoryHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const userId = req.query["userId"] as string
    const page   = Math.max(1, parseInt(req.query["page"]  as string || "1",  10))
    const limit  = Math.min(50, parseInt(req.query["limit"] as string || "10", 10))

    if (!userId) { sendBadRequest(res, "userId is required"); return }

    const { transactions, total } = await getPaymentHistory(userId, page, limit)

    sendSuccess(res, {
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages:  Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    }, "Payment history retrieved")
  } catch (err) {
    next(err)
  }
}

// ── POST /api/payment/cancel ──────────────────────────────────────
// Body: { userId }
export const cancelSubscriptionHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.body as { userId?: string }
    if (!userId) { sendBadRequest(res, "userId is required"); return }

    await cancelSubscription(userId)
    sendSuccess(res, { cancelled: true }, "Subscription cancelled. Downgraded to Free plan.")
  } catch (err) {
    next(err)
  }
}

// ── POST /api/payment/admin/grant ─────────────────────────────────
// Body: { userId, plan, durationDays, note? }
export const adminGrantHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const { userId, plan, durationDays, note } =
      req.body as { userId?: string; plan?: string; durationDays?: number; note?: string }

    if (!userId)      { sendBadRequest(res, "userId is required");      return }
    if (!plan)        { sendBadRequest(res, "plan is required");        return }
    if (!durationDays){ sendBadRequest(res, "durationDays is required"); return }

    await grantSubscription(userId, plan as SubscriptionPlan, durationDays, note)
    sendSuccess(res, { granted: true }, `${plan} subscription granted for ${durationDays} days`)
  } catch (err) {
    next(err)
  }
}
