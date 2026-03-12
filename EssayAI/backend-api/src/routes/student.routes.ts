/**
 * student.routes.ts  (Phase 1 + Phase 2)
 *
 * Requires teacher-level access (center_admin, admin, teacher).
 * All routes automatically scoped to req.centerFilter.centerId
 * via the requireTeacher middleware chain.
 */

import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { requireTeacher } from "../middlewares/auth";
import {
  createStudentHandler,
  listStudentsHandler,
  getStudentHandler,
  updateStudentHandler,
  deactivateStudentHandler,
  reactivateStudentHandler,
  resetPasswordHandler,
} from "../controllers/student.controller";
import {
  bulkImportStudents,
  generateImportTemplate,
} from "../services/bulkImportService";
import { sendSuccess, sendCreated, sendBadRequest } from "../utils/response";

const router = Router();

// Multer: accept CSV and XLSX in memory (max 5 MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/octet-stream",
    ];
    if (
      allowed.includes(file.mimetype) ||
      file.originalname.match(/\.(csv|xlsx)$/i)
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV and XLSX files are supported"));
    }
  },
});

// ── Phase 1: Single student CRUD ───────────────────────────────────────
router.post("/", ...requireTeacher, createStudentHandler);
router.get("/", ...requireTeacher, listStudentsHandler);
router.get("/:id", ...requireTeacher, getStudentHandler);
router.patch("/:id", ...requireTeacher, updateStudentHandler);
router.delete("/:id", ...requireTeacher, deactivateStudentHandler);
router.patch("/:id/reactivate", ...requireTeacher, reactivateStudentHandler);
router.post("/:id/reset-password", ...requireTeacher, resetPasswordHandler);

// ── Phase 2: Bulk import ───────────────────────────────────────────────

// GET /api/students/import/template — returns a downloadable CSV template
router.get(
  "/import/template",
  ...requireTeacher,
  (_req: Request, res: Response) => {
    const csv = generateImportTemplate();
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="student_import_template.csv"',
    );
    res.send("\uFEFF" + csv); // BOM prefix so Excel opens UTF-8 correctly
  },
);

// POST /api/students/import — bulk create from CSV or XLSX
router.post(
  "/import",
  ...requireTeacher,
  upload.single("file"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        sendBadRequest(
          res,
          "No file uploaded. Use multipart/form-data with field name 'file'",
        );
        return;
      }

      const result = await bulkImportStudents(
        req.file.buffer,
        req.file.mimetype,
        req.centerFilter!.centerId,
        req.user!.userId,
      );

      const status = result.errorCount === 0 ? 201 : 207; // 207 = Multi-Status
      res.status(status).json({
        success: true,
        message: `Imported ${result.successCount} of ${result.totalRows} students`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
