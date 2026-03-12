import { Router } from "express";
import { requireCenterAdmin, requireSuperAdmin } from "../middlewares/auth";
import * as centerAdminController from "../controllers/centerAdmin.controller";

const router = Router({ mergeParams: true });

// ── CENTER_ADMIN routes ─────────────────────────────────────────────
router.use(requireCenterAdmin);

router.get("/profile", centerAdminController.getCenterProfile);
router.put("/profile", centerAdminController.updateCenterProfile);

router.get("/teachers", centerAdminController.listTeachers);
router.post("/teachers", centerAdminController.createTeacher);
router.delete("/teachers/:id", centerAdminController.removeTeacher);

// ── SUPER_ADMIN routes (separate mounting) ──────────────────────────
router.get(
  "/admin/centers",
  requireSuperAdmin,
  centerAdminController.adminListCenters,
);

export default router;
