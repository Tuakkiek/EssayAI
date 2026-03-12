/**
 * superAdminService.ts  (Phase 7)
 *
 * Super-admin has no centerId — they operate across the entire platform.
 * Every function here is gated behind requireSuperAdmin in the routes.
 *
 * Capabilities:
 *  - Platform-level KPI dashboard
 *  - List / search / get / activate / deactivate any center
 *  - Grant / revoke plans (calls subscriptionService.manualGrantPlan)
 *  - Impersonate any center (returns a scoped token for debugging)
 *  - List / search / deactivate any user across all centers
 *  - Platform-wide essay analytics
 */

import mongoose from "mongoose"
import jwt      from "jsonwebtoken"
import { Center, User, Essay, Assignment } from "../models/index"
import PaymentTransaction from "../models/PaymentTransaction"
import { SubscriptionPlan, PLAN_META } from "../models/PaymentTransaction"
import { manualGrantPlan } from "./subscriptionService"
import { AppError } from "../middlewares/errorHandler"
import { env } from "../config/env"
import { logger } from "../utils/logger"

// ── Platform KPI dashboard ────────────────────────────────────────────

export const getPlatformStats = async () => {
  const now      = new Date()
  const monthAgo = new Date(now.getTime() - 30 * 86_400_000)

  const [
    totalCenters,
    activeCenters,
    totalUsers,
    totalStudents,
    totalEssays,
    essaysThisMonth,
    revenueAgg,
    planBreakdown,
  ] = await Promise.all([
    Center.countDocuments(),
    Center.countDocuments({ isActive: true }),
    User.countDocuments(),
    User.countDocuments({ role: "student", isActive: true }),
    Essay.countDocuments(),
    Essay.countDocuments({ createdAt: { $gte: monthAgo } }),

    // Total completed revenue in VND
    PaymentTransaction.aggregate([
      { $match: { status: "completed", gateway: "sepay" } },
      { $group: { _id: null, total: { $sum: "$amountVnd" } } },
    ]),

    // Centers per plan
    Center.aggregate([
      { $group: { _id: "$subscription.plan", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ])

  return {
    centers: { total: totalCenters, active: activeCenters },
    users:   { total: totalUsers,   students: totalStudents },
    essays:  { total: totalEssays,  thisMonth: essaysThisMonth },
    revenue: { totalVnd: revenueAgg[0]?.total ?? 0 },
    planBreakdown: planBreakdown.map((p: { _id: string; count: number }) => ({
      plan:  p._id,
      count: p.count,
    })),
  }
}

// ── Growth timeseries (last N days, grouped by day) ───────────────────

export const getGrowthTimeseries = async (days = 30) => {
  const since = new Date(Date.now() - days * 86_400_000)

  const [newCenters, newEssays] = await Promise.all([
    Center.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id:   { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Essay.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id:   { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ])

  return { newCenters, newEssays, days }
}

// ── List / search centers ─────────────────────────────────────────────

export interface CenterListFilter {
  search?:  string
  plan?:    SubscriptionPlan
  isActive?: boolean
  page?:    number
  limit?:   number
}

export const listCenters = async (filter: CenterListFilter = {}) => {
  const { search, plan, isActive, page = 1, limit = 20 } = filter

  const query: Record<string, unknown> = {}
  if (isActive !== undefined) query.isActive = isActive
  if (plan)   query["subscription.plan"] = plan
  if (search) {
    const esc = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    query.$or = [
      { name:         { $regex: esc, $options: "i" } },
      { slug:         { $regex: esc, $options: "i" } },
      { contactEmail: { $regex: esc, $options: "i" } },
    ]
  }

  const skip = (page - 1) * limit
  const [centers, total] = await Promise.all([
    Center.find(query)
      .populate("ownerId", "name email phone")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Center.countDocuments(query),
  ])

  return { centers, pagination: { total, page, limit, pages: Math.ceil(total / limit) } }
}

// ── Get single center with full details ───────────────────────────────

export const getCenterDetail = async (centerId: string) => {
  const center = await Center.findById(centerId).populate("ownerId", "name email phone")
  if (!center) throw new AppError("Center not found", 404)

  const [userStats, essayStats, recentPayments] = await Promise.all([
    User.aggregate([
      { $match: { centerId: new mongoose.Types.ObjectId(centerId) } },
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]),
    Essay.aggregate([
      { $match: { centerId: new mongoose.Types.ObjectId(centerId) } },
      {
        $group: {
          _id:         null,
          total:       { $sum: 1 },
          graded:      { $sum: { $cond: [{ $eq: ["$status", "graded"] }, 1, 0] } },
          avgScore:    { $avg: "$overallScore" },
        },
      },
    ]),
    PaymentTransaction.find({ centerId: new mongoose.Types.ObjectId(centerId) })
      .select("-sepayRawPayload")
      .limit(5)
      .sort({ createdAt: -1 }),
  ])

  return {
    center,
    userStats:    userStats.reduce((acc: Record<string, number>, r: { _id: string; count: number }) => {
      acc[r._id] = r.count; return acc
    }, {}),
    essayStats:   essayStats[0] ?? { total: 0, graded: 0, avgScore: null },
    recentPayments,
  }
}

// ── Activate / deactivate center ──────────────────────────────────────

export const setCenterActive = async (centerId: string, isActive: boolean) => {
  const center = await Center.findByIdAndUpdate(
    centerId,
    { isActive },
    { new: true }
  )
  if (!center) throw new AppError("Center not found", 404)

  logger.info(`Center ${isActive ? "activated" : "deactivated"}`, { centerId })
  return center
}

// ── Impersonate center (debug token) ─────────────────────────────────
/**
 * Returns a short-lived token scoped to the target center.
 * Used by super-admins to debug production issues without sharing credentials.
 * Always logs who impersonated what.
 */
export const impersonateCenter = async (
  centerId:       string,
  superAdminId:   string
): Promise<{ token: string; expiresIn: string }> => {
  const center = await Center.findById(centerId)
  if (!center) throw new AppError("Center not found", 404)
  if (!center.isActive) throw new AppError("Cannot impersonate an inactive center", 400)

  const token = jwt.sign(
    {
      userId:        superAdminId,
      email:         "super@admin",
      role:          "super_admin",
      centerId:      centerId,
      _impersonate:  true,           // flag so audit middleware can log it
    },
    env.JWT_SECRET,
    { expiresIn: "1h" }
  )

  logger.warn("CENTER IMPERSONATED", { superAdminId, centerId, centerName: center.name })
  return { token, expiresIn: "1h" }
}

// ── List / search users across all centers ────────────────────────────

export interface UserListFilter {
  centerId?: string
  role?:     string
  search?:   string
  isActive?: boolean
  page?:     number
  limit?:    number
}

export const listUsers = async (filter: UserListFilter = {}) => {
  const { centerId, role, search, isActive, page = 1, limit = 20 } = filter

  const query: Record<string, unknown> = {}
  if (centerId) query.centerId = new mongoose.Types.ObjectId(centerId)
  if (role)     query.role     = role
  if (isActive !== undefined) query.isActive = isActive
  if (search) {
    const esc = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    query.$or = [
      { name:  { $regex: esc, $options: "i" } },
      { email: { $regex: esc, $options: "i" } },
      { phone: { $regex: esc, $options: "i" } },
    ]
  }

  const skip = (page - 1) * limit
  const [users, total] = await Promise.all([
    User.find(query)
      .select("-passwordHash")
      .populate("centerId", "name slug")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    User.countDocuments(query),
  ])

  return { users, pagination: { total, page, limit, pages: Math.ceil(total / limit) } }
}

// ── Grant plan to center ──────────────────────────────────────────────

export interface GrantPlanInput {
  centerId:     string
  plan:         SubscriptionPlan
  durationDays: number
  note?:        string
  grantedBy:    string
}

export const grantPlan = async (input: GrantPlanInput) => {
  const { centerId, plan, durationDays, note, grantedBy } = input

  if (!Object.keys(PLAN_META).includes(plan)) {
    throw new AppError(`Invalid plan: ${plan}`, 400)
  }

  const tx = await manualGrantPlan({ centerId, plan, durationDays, note, grantedBy })
  logger.info("Plan granted by super admin", { centerId, plan, durationDays, grantedBy })
  return tx
}

// ── Platform-wide essay analytics ────────────────────────────────────

export const getEssayAnalytics = async (days = 30) => {
  const since = new Date(Date.now() - days * 86_400_000)

  const [scoreDistribution, taskTypeBreakdown, statusBreakdown, topCenters] =
    await Promise.all([
      // Score distribution in 0.5-band buckets
      Essay.aggregate([
        { $match: { status: "graded", createdAt: { $gte: since } } },
        {
          $bucket: {
            groupBy:    "$overallScore",
            boundaries: [0, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.1],
            default:    "other",
            output:     { count: { $sum: 1 } },
          },
        },
      ]),

      // Task1 vs Task2
      Essay.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: "$taskType", count: { $sum: 1 } } },
      ]),

      // Status breakdown
      Essay.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      // Top 10 centers by essay volume
      Essay.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: "$centerId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from:         "centers",
            localField:   "_id",
            foreignField: "_id",
            as:           "center",
          },
        },
        { $unwind: "$center" },
        { $project: { centerName: "$center.name", count: 1 } },
      ]),
    ])

  return { scoreDistribution, taskTypeBreakdown, statusBreakdown, topCenters, days }
}
