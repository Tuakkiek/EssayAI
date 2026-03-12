/**
 * essay.routes.ts  (Phase 5)
 *
 * Students:  submit, list own, get own, delete own (pending only)
 * Teachers:  list all in center, get any, mark reviewed
 */

import { Router } from "express"
import { requireAnyStudent, requireTeacher } from "../middlewares/auth"
import {
  submitEssayHandler,
  listEssaysHandler,
  getEssayHandler,
  reviewEssayHandler,
  deleteEssayHandler,
} from "../controllers/essay.controller"

const router = Router()

// ── Student actions ────────────────────────────────────────────────────
router.post(  "/",          ...requireAnyStudent, submitEssayHandler)
router.delete("/:id",       ...requireAnyStudent, deleteEssayHandler)

// ── Shared (students see own, teachers see all — enforced in service) ──
router.get(   "/",          ...requireAnyStudent, listEssaysHandler)
router.get(   "/:id",       ...requireAnyStudent, getEssayHandler)

// ── Teacher-only actions ───────────────────────────────────────────────
router.post(  "/:id/review",...requireTeacher, reviewEssayHandler)

export default router
