import { Router } from "express"
import {
  listPlans,
  getStatusHandler,
  getHistoryHandler,
  initiatePaymentHandler,
  webhookHandler,
  cancelSubscriptionHandler,
  adminGrantHandler
} from "../controllers/payment.controller"

const router = Router()

router.get("/plans", listPlans)
router.get("/status", getStatusHandler)
router.get("/history", getHistoryHandler)
router.post("/initiate", initiatePaymentHandler)
router.post("/webhook", webhookHandler)
router.post("/cancel", cancelSubscriptionHandler)
router.post("/admin/grant", adminGrantHandler)

export default router
