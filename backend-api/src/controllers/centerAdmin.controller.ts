import { Request, Response } from "express";
import { sendSuccess } from "../utils/response";
import * as centerService from "../services/centerService";
import { AppError } from "../middlewares/errorHandler";

// ── Get center profile ──────────────────────────────────────────────
export const getCenterProfile = async (req: Request, res: Response) => {
  const centerId = req.centerFilter!.centerId!;
  const result = await centerService.getCenter(centerId, req.user!.userId);
  sendSuccess(res, result);
};

// ── Update center profile ───────────────────────────────────────────
export const updateCenterProfile = async (req: Request, res: Response) => {
  const centerId = req.centerFilter!.centerId!;
  const result = await centerService.updateCenter(centerId, req.body);
  sendSuccess(res, result, "Center profile updated");
};

// ── List teachers ───────────────────────────────────────────────────
export const listTeachers = async (req: Request, res: Response) => {
  const centerId = req.centerFilter!.centerId!;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const teachers = await centerService.listTeachers(centerId);
  sendSuccess(res, { teachers, page, limit });
};

// ── Create teacher ──────────────────────────────────────────────────
export const createTeacher = async (req: Request, res: Response) => {
  const centerId = req.centerFilter!.centerId!;
  const result = await centerService.createTeacher(
    centerId,
    req.user!.userId,
    req.body,
  );
  sendSuccess(
    res,
    result,
    "Teacher created successfully. Temp password shown once.",
  );
};

// ── Remove teacher ──────────────────────────────────────────────────
export const removeTeacher = async (req: Request, res: Response) => {
  const centerId = req.centerFilter!.centerId!;
  const teacherId = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;

  await centerService.removeTeacher(centerId, teacherId, req.user!.userId);
  sendSuccess(res, null, "Teacher deactivated");
};

// ── SUPER_ADMIN: List all centers ───────────────────────────────────
export const adminListCenters = async (req: Request, res: Response) => {
  // Implement pagination, search via service
  sendSuccess(res, [], "SUPER_ADMIN centers list");
};
