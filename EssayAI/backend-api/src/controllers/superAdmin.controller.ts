/**
 * superAdmin.controller.ts  (Phase 7)
 * All handlers require requireSuperAdmin — enforced in routes.
 */

import { Request, Response, NextFunction } from "express"
import { sendSuccess, sendBadRequest } from "../utils/response"
import {
  getPlatformStats,
  getGrowthTimeseries,
  listCenters,
  getCenterDetail,
  setCenterActive,
  impersonateCenter,
  listUsers,
  grantPlan,
  getEssayAnalytics,
} from "../services/superAdminService"
import { SubscriptionPlan, PLAN_META } from "../models/PaymentTransaction"

// ── GET /api/admin/stats ───────────────────────────────────────────────
export const platformStatsHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const stats = await getPlatformStats()
    sendSuccess(res, stats)
  } catch (err) { next(err) }
}

// ── GET /api/admin/stats/growth ────────────────────────────────────────
export const growthTimeseriesHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30
    const data = await getGrowthTimeseries(days)
    sendSuccess(res, data)
  } catch (err) { next(err) }
}

// ── GET /api/admin/stats/essays ────────────────────────────────────────
export const essayAnalyticsHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30
    const data = await getEssayAnalytics(days)
    sendSuccess(res, data)
  } catch (err) { next(err) }
}

// ── GET /api/admin/centers ─────────────────────────────────────────────
export const listCentersHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const { search, plan, isActive, page, limit } = req.query
    const result = await listCenters({
      search:   search   as string | undefined,
      plan:     plan     as SubscriptionPlan | undefined,
      isActive: isActive === "false" ? false : isActive === "true" ? true : undefined,
      page:     page  ? parseInt(page  as string, 10) : undefined,
      limit:    limit ? parseInt(limit as string, 10) : undefined,
    })
    sendSuccess(res, result)
  } catch (err) { next(err) }
}

// ── GET /api/admin/centers/:id ─────────────────────────────────────────
export const getCenterHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const data = await getCenterDetail(req.params.id as string)
    sendSuccess(res, data)
  } catch (err) { next(err) }
}

// ── PATCH /api/admin/centers/:id/activate ─────────────────────────────
export const activateCenterHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const center = await setCenterActive(req.params.id as string, true)
    sendSuccess(res, { center }, "Center activated")
  } catch (err) { next(err) }
}

// ── PATCH /api/admin/centers/:id/deactivate ───────────────────────────
export const deactivateCenterHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const center = await setCenterActive(req.params.id as string, false)
    sendSuccess(res, { center }, "Center deactivated")
  } catch (err) { next(err) }
}

// ── POST /api/admin/centers/:id/impersonate ───────────────────────────
export const impersonateHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const result = await impersonateCenter(req.params.id as string, req.user!.userId)
    sendSuccess(res, result, "Impersonation token issued (expires in 1h)")
  } catch (err) { next(err) }
}

// ── POST /api/admin/centers/:id/grant-plan ────────────────────────────
export const grantPlanHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const { plan, durationDays, note } = req.body

    if (!plan || !Object.keys(PLAN_META).includes(plan)) {
      sendBadRequest(res, `plan must be one of: ${Object.keys(PLAN_META).join(", ")}`)
      return
    }
    if (durationDays === undefined || typeof durationDays !== "number") {
      sendBadRequest(res, "durationDays (number) is required. Use 0 for permanent.")
      return
    }

    const tx = await grantPlan({
      centerId:     req.params.id as string,
      plan:         plan as SubscriptionPlan,
      durationDays: durationDays,
      note,
      grantedBy:    req.user!.userId,
    })

    sendSuccess(res, { transaction: tx }, `Plan "${plan}" granted to center`)
  } catch (err) { next(err) }
}

// ── GET /api/admin/users ───────────────────────────────────────────────
export const listUsersHandler = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const { centerId, role, search, isActive, page, limit } = req.query
    const result = await listUsers({
      centerId: centerId as string | undefined,
      role:     role     as string | undefined,
      search:   search   as string | undefined,
      isActive: isActive === "false" ? false : isActive === "true" ? true : undefined,
      page:     page  ? parseInt(page  as string, 10) : undefined,
      limit:    limit ? parseInt(limit as string, 10) : undefined,
    })
    sendSuccess(res, result)
  } catch (err) { next(err) }
}
