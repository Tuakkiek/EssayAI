/**
 * subscription.routes.ts  (Phase 6)
 */

import { Router } from "express"
import { requireCenterAdmin, requireAuth } from "../middlewares/auth"
import {
  getSubscriptionHandler,
  listPlansHandler,
  checkoutHandler,
  sepayWebhookHandler,
  listPaymentsHandler,
} from "../controllers/subscription.controller"

const router = Router()

// ── Public ─────────────────────────────────────────────────────────────
// No auth — anyone can see available plans (used on landing/pricing page)
router.get("/plans", listPlansHandler)

// Sepay IPN — no Bearer token, secured by HMAC signature
router.post("/webhook/sepay", sepayWebhookHandler)

// ── Center admin only ──────────────────────────────────────────────────
router.get("/",          ...requireCenterAdmin, getSubscriptionHandler)
router.post("/checkout", ...requireCenterAdmin, checkoutHandler)
router.get("/payments",  ...requireCenterAdmin, listPaymentsHandler)

export default router
