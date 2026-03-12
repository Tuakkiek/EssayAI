/**
 * class.controller.ts  (Phase 3)
 */

import { Request, Response, NextFunction } from "express";
import { sendSuccess, sendCreated, sendBadRequest } from "../utils/response";
import {
  createClass,
  listClasses,
  getClass,
  getClassWithStudents,
  updateClass,
  archiveClass,
  addStudentsToClass,
  removeStudentsFromClass,
  getClassStats,
} from "../services/classService";

// ── POST /api/classes ──────────────────────────────────────────────────
export const createClassHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, teacherId, description } = req.body;
    if (!name || !teacherId) {
      sendBadRequest(res, "Missing required fields: name, teacherId");
      return;
    }

    const cls = await createClass({
      name,
      teacherId,
      description,
      centerId: req.centerFilter!.centerId,
    });
    sendCreated(res, { class: cls }, "Class created successfully");
  } catch (err) {
    next(err);
  }
};

// ── GET /api/classes ───────────────────────────────────────────────────
export const listClassesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { teacherId, search, page, limit, isActive } = req.query;

    // Teachers can only see their own classes unless they are admin
    const isAdminRole = ["center_admin", "admin", "super_admin"].includes(
      req.user!.role,
    );
    const resolvedTeacherId = !isAdminRole
      ? req.user!.userId // teacher sees own classes only
      : (teacherId as string | undefined); // admin can filter by any teacher

    const result = await listClasses({
      centerId: req.centerFilter!.centerId,
      teacherId: resolvedTeacherId,
      isActive: isActive === "false" ? false : true,
      search: search as string | undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/classes/:id ───────────────────────────────────────────────
export const getClassHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const cls = await getClass(
      req.params.id as string,
      req.centerFilter!.centerId,
    );
    sendSuccess(res, { class: cls });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/classes/:id/students ──────────────────────────────────────
export const getClassWithStudentsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { cls, students } = await getClassWithStudents(
      req.params.id as string,
      req.centerFilter!.centerId,
    );
    sendSuccess(res, { class: cls, students });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/classes/:id/stats ─────────────────────────────────────────
export const getClassStatsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const stats = await getClassStats(
      req.params.id as string,
      req.centerFilter!.centerId,
    );
    sendSuccess(res, { stats });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/classes/:id ─────────────────────────────────────────────
export const updateClassHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, teacherId, description } = req.body;
    const cls = await updateClass(
      req.params.id as string,
      req.centerFilter!.centerId,
      { name, teacherId, description },
    );
    sendSuccess(res, { class: cls }, "Class updated");
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/classes/:id ────────────────────────────────────────────
export const archiveClassHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const cls = await archiveClass(
      req.params.id as string,
      req.centerFilter!.centerId,
    );
    sendSuccess(res, { class: cls }, "Class archived");
  } catch (err) {
    next(err);
  }
};

// ── POST /api/classes/:id/students ─────────────────────────────────────
export const addStudentsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { studentIds } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      sendBadRequest(res, "studentIds must be a non-empty array");
      return;
    }
    const result = await addStudentsToClass(
      req.params.id as string,
      studentIds,
      req.centerFilter!.centerId,
    );
    sendSuccess(res, result, `Added ${result.addedCount} students to class`);
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/classes/:id/students ───────────────────────────────────
export const removeStudentsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { studentIds } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      sendBadRequest(res, "studentIds must be a non-empty array");
      return;
    }
    const result = await removeStudentsFromClass(
      req.params.id as string,
      studentIds,
      req.centerFilter!.centerId,
    );
    sendSuccess(
      res,
      result,
      `Removed ${result.removedCount} students from class`,
    );
  } catch (err) {
    next(err);
  }
};
