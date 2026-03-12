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
  userAnalyticsHandler,
  listCentersHandler,
  getCenterHandler,
  activateCenterHandler,
  deactivateCenterHandler,
  impersonateHandler,
  grantPlanHandler,
  listUsersHandler,
  getUserDetailHandler,
  updateUserRoleHandler,
  toggleUserActiveHandler,
  deleteUserHandler,
} from "../controllers/superAdmin.controller"

const router = Router()

// All routes gated behind super_admin
router.use(...requireSuperAdmin)

// ── Platform analytics ─────────────────────────────────────────────────
router.get("/stats",          platformStatsHandler)
router.get("/stats/growth",   growthTimeseriesHandler)
router.get("/stats/essays",   essayAnalyticsHandler)

// New analytics aliases
router.get("/analytics/overview", platformStatsHandler)
router.get("/analytics/essays", essayAnalyticsHandler)
router.get("/analytics/users", userAnalyticsHandler)

// ── Center management ──────────────────────────────────────────────────
router.get(  "/centers",                   listCentersHandler)
router.get(  "/centers/:id",               getCenterHandler)
router.patch("/centers/:id/activate",      activateCenterHandler)
router.patch("/centers/:id/deactivate",    deactivateCenterHandler)
router.post( "/centers/:id/impersonate",   impersonateHandler)
router.post( "/centers/:id/grant-plan",    grantPlanHandler)

// ── User management ────────────────────────────────────────────────────
router.get("/users", listUsersHandler)
router.get("/users/:id", getUserDetailHandler)
router.patch("/users/:id/role", updateUserRoleHandler)
router.patch("/users/:id/active", toggleUserActiveHandler)
router.delete("/users/:id", deleteUserHandler)

export default router
