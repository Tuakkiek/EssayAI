/**
 * subscription.controller.ts  (Phase 6)
 */

import { Request, Response, NextFunction } from "express"
import { sendSuccess, sendCreated, sendBadRequest } from "../utils/response"
import { env } from "../config/env"
import {
  getSubscription,
  createPaymentIntent,
  handleSepayWebhook,
  listPayments,
} from "../services/subscriptionService"
import { SubscriptionPlan, PLAN_META } from "../models/PaymentTransaction"

// ── GET /api/subscription — center's current plan + usage ─────────────
export const getSubscriptionHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const data = await getSubscription(req.centerFilter!.centerId)
    sendSuccess(res, data)
  } catch (err) { next(err) }
}

// ── GET /api/subscription/plans — list all plans + pricing ────────────
export const listPlansHandler = (
  _req: Request, res: Response
): void => {
  const plans = Object.entries(PLAN_META).map(([key, meta]) => ({
    id: key,
    ...meta,
  }))
  sendSuccess(res, { plans })
}

// ── POST /api/subscription/checkout — create Sepay payment intent ──────
export const checkoutHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const { plan } = req.body
    const validPlans: SubscriptionPlan[] = ["starter", "pro", "enterprise"]

    if (!plan || !validPlans.includes(plan)) {
      sendBadRequest(res, `plan must be one of: ${validPlans.join(", ")}`)
      return
    }

    const tx = await createPaymentIntent({
      centerId: req.centerFilter!.centerId,
      plan,
    })

    // Return the order code so the frontend can construct the Sepay payment URL
    sendCreated(res, {
      transaction: {
        id:         tx._id,
        orderCode:  tx.sepayOrderCode,
        amountVnd:  tx.amountVnd,
        plan:       tx.plan,
        // Sepay deep-link: user scans QR or clicks to pay
        paymentUrl: `https://sepay.vn/thanhtoan?ma=${tx.sepayOrderCode}&so_tien=${tx.amountVnd}`,
      },
    }, "Payment intent created")
  } catch (err) { next(err) }
}

// ── POST /api/subscription/webhook/sepay — Sepay IPN ──────────────────
/**
 * Public endpoint — Sepay calls this after payment.
 * No auth middleware (Sepay doesn't send a Bearer token).
 * Security is via HMAC-SHA256 signature header.
 */
export const sepayWebhookHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const signature = (req.headers["x-sepay-signature"] ?? "") as string
    const result = await handleSepayWebhook(
      req.body,
      signature,
      env.SEPAY_WEBHOOK_SECRET
    )

    // Sepay expects 200 + { success: true } regardless of whether we processed it
    res.status(200).json({ success: true, ...result })
  } catch (err) { next(err) }
}

// ── GET /api/subscription/payments — payment history ─────────────────
export const listPaymentsHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const { page, limit } = req.query
    const result = await listPayments(
      req.centerFilter!.centerId,
      page  ? parseInt(page  as string, 10) : undefined,
      limit ? parseInt(limit as string, 10) : undefined,
    )
    sendSuccess(res, result)
  } catch (err) { next(err) }
}
