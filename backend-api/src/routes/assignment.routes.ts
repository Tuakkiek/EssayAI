/**
 * assignment.routes.ts  (Phase 4)
 *
 * Teacher-level:  create, list, get, update, stats
 * Admin-level:    publish, close, delete
 * Student-level:  GET /my  (own published assignments)
 */

import { Router } from "express"
import {
  requireTeacher,
  requireCenterAdmin,
  requireStudent,
} from "../middlewares/auth"
import {
  createAssignmentHandler,
  listAssignmentsHandler,
  listMyAssignmentsHandler,
  getAssignmentHandler,
  getAssignmentStatsHandler,
  updateAssignmentHandler,
  publishAssignmentHandler,
  closeAssignmentHandler,
  deleteAssignmentHandler,
} from "../controllers/assignment.controller"

const router = Router()

// ── Student-facing ────────────────────────────────────────────────────
// Must be before /:id routes to prevent "my" being treated as an ObjectId
router.get("/my", ...requireStudent, listMyAssignmentsHandler)

// ── Teacher CRUD ──────────────────────────────────────────────────────
router.post(  "/",              ...requireTeacher, createAssignmentHandler)
router.get(   "/",              ...requireTeacher, listAssignmentsHandler)
router.get(   "/:id",           ...requireTeacher, getAssignmentHandler)
router.get(   "/:id/stats",     ...requireTeacher, getAssignmentStatsHandler)
router.patch( "/:id",           ...requireTeacher, updateAssignmentHandler)

// ── Lifecycle transitions (admin+) ────────────────────────────────────
router.post(  "/:id/publish",   ...requireTeacher,     publishAssignmentHandler)
router.post(  "/:id/close",     ...requireTeacher,     closeAssignmentHandler)
router.delete("/:id",           ...requireCenterAdmin,  deleteAssignmentHandler)

export default router
