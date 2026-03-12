/**
 * student.controller.ts  (Phase 1)
 *
 * All handlers inject centerId from req.centerFilter (never from req.body)
 * to enforce tenant isolation automatically.
 */

import { Request, Response, NextFunction } from "express";
import { sendSuccess, sendCreated, sendBadRequest } from "../utils/response";
import {
  createStudent,
  listStudents,
  getStudent,
  updateStudent,
  deactivateStudent,
  reactivateStudent,
  resetStudentPassword,
} from "../services/studentService";

// ── POST /api/students ─────────────────────────────────────────────────
export const createStudentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, phone, classId } = req.body;
    if (!name || !phone) {
      sendBadRequest(res, "Missing required fields: name, phone");
      return;
    }

    const result = await createStudent({
      name,
      phone,
      classId,
      createdBy: req.user!.userId,
      centerId: req.centerFilter!.centerId,
    });

    // plainPassword is returned ONCE here — client must show/download it
    sendCreated(res, result, "Student created successfully");
  } catch (err) {
    next(err);
  }
};

// ── GET /api/students ──────────────────────────────────────────────────
export const listStudentsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { classId, search, page, limit, isActive } = req.query;

    const result = await listStudents({
      centerId: req.centerFilter!.centerId,
      classId: classId as string | undefined,
      search: search as string | undefined,
      isActive: isActive === "false" ? false : true,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/students/:id ──────────────────────────────────────────────
export const getStudentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const student = await getStudent(
      req.params.id as string,
      req.centerFilter!.centerId,
    );
    sendSuccess(res, { student });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/students/:id ────────────────────────────────────────────
export const updateStudentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, phone, classId } = req.body;
    const student = await updateStudent(
      req.params.id as string,
      req.centerFilter!.centerId,
      { name, phone, classId },
    );
    sendSuccess(res, { student }, "Student updated");
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/students/:id ───────────────────────────────────────────
// Soft-delete only — sets isActive = false
export const deactivateStudentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const student = await deactivateStudent(
      req.params.id as string,
      req.centerFilter!.centerId,
    );
    sendSuccess(res, { student }, "Student deactivated");
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/students/:id/reactivate ────────────────────────────────
export const reactivateStudentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const student = await reactivateStudent(
      req.params.id as string,
      req.centerFilter!.centerId,
    );
    sendSuccess(res, { student }, "Student reactivated");
  } catch (err) {
    next(err);
  }
};

// ── POST /api/students/:id/reset-password ──────────────────────────────
export const resetPasswordHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await resetStudentPassword(
      req.params.id as string,
      req.centerFilter!.centerId,
    );
    // plainPassword returned ONCE — teacher must deliver to student
    sendSuccess(res, result, "Password reset successfully");
  } catch (err) {
    next(err);
  }
};
