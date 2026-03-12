/**
 * class.routes.ts  (Phase 3)
 *
 * Teacher-level: read + roster management
 * Admin-level:   create / update / archive + assign teacher
 */

import { Router } from "express";
import { requireTeacher, requireCenterAdmin } from "../middlewares/auth";
import {
  createClassHandler,
  listClassesHandler,
  getClassHandler,
  getClassWithStudentsHandler,
  getClassStatsHandler,
  updateClassHandler,
  archiveClassHandler,
  addStudentsHandler,
  removeStudentsHandler,
} from "../controllers/class.controller";

const router = Router();

// ── Admin-only mutations ───────────────────────────────────────────────
router.post("/", ...requireCenterAdmin, createClassHandler);
router.patch("/:id", ...requireCenterAdmin, updateClassHandler);
router.delete("/:id", ...requireCenterAdmin, archiveClassHandler);

// ── Teacher-level reads ────────────────────────────────────────────────
router.get("/", ...requireTeacher, listClassesHandler);
router.get("/:id", ...requireTeacher, getClassHandler);
router.get("/:id/students", ...requireTeacher, getClassWithStudentsHandler);
router.get("/:id/stats", ...requireTeacher, getClassStatsHandler);

// ── Roster management (teacher+) ──────────────────────────────────────
router.post("/:id/students", ...requireTeacher, addStudentsHandler);
router.delete("/:id/students", ...requireTeacher, removeStudentsHandler);

export default router;
