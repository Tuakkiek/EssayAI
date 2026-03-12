/**
 * admin.routes.ts  (Phase 7)
 *
 * All routes require super_admin role — enforced by requireSuperAdmin middleware.
 * Mounted at /api/admin
 */

import { Router } from "express"
import { requireSuperAdmin } from "../middlewares/auth"
import {
  platformStatsHandler,
  growthTimeseriesHandler,
  essayAnalyticsHandler,
  listCentersHandler,
  getCenterHandler,
  activateCenterHandler,
  deactivateCenterHandler,
  impersonateHandler,
  grantPlanHandler,
  listUsersHandler,
} from "../controllers/superAdmin.controller"

const router = Router()

// All routes gated behind super_admin
router.use(...requireSuperAdmin)

// ── Platform analytics ─────────────────────────────────────────────────
router.get("/stats",          platformStatsHandler)
router.get("/stats/growth",   growthTimeseriesHandler)
router.get("/stats/essays",   essayAnalyticsHandler)

// ── Center management ──────────────────────────────────────────────────
router.get(  "/centers",                   listCentersHandler)
router.get(  "/centers/:id",               getCenterHandler)
router.patch("/centers/:id/activate",      activateCenterHandler)
router.patch("/centers/:id/deactivate",    deactivateCenterHandler)
router.post( "/centers/:id/impersonate",   impersonateHandler)
router.post( "/centers/:id/grant-plan",    grantPlanHandler)

// ── User management ────────────────────────────────────────────────────
router.get("/users", listUsersHandler)

export default router
