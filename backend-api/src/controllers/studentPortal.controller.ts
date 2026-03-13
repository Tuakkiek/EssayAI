import { Request, Response, NextFunction } from "express";
import { sendSuccess, sendCreated, sendBadRequest } from "../utils/response";
import {
  joinClassByCode,
  getMyClass,
  listStudentAssignments,
  getStudentAssignmentDetail,
} from "../services/studentPortalService";
import { submitEssay } from "../services/essayService";
import User from "../models/User";

// â”€â”€ POST /api/student/join-class
export const joinClassHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { classCode } = req.body;
    if (!classCode) {
      sendBadRequest(res, "classCode is required");
      return;
    }
    const data = await joinClassByCode({
      classCode,
      studentId: req.user!.userId,
    });
    sendSuccess(res, data, "Joined class");
  } catch (err) {
    next(err);
  }
};

// â”€â”€ GET /api/student/my-class
export const myClassHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await getMyClass(req.user!.userId);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

// â”€â”€ GET /api/student/assignments
export const listStudentAssignmentsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page, limit } = req.query;
    const student = await User.findById(req.user!.userId).select(
      "classIds centerId",
    );
    if (
      !student ||
      !student.centerId ||
      (student.classIds?.length ?? 0) === 0
    ) {
      sendSuccess(res, { assignments: [], pagination: { total: 0, page: 1, limit: 20, pages: 0 } });
      return;
    }

    const result = await listStudentAssignments({
      studentId: req.user!.userId,
      centerId: student.centerId.toString(),
      classIds: student.classIds,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

// â”€â”€ GET /api/student/assignments/:id
export const getStudentAssignmentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const student = await User.findById(req.user!.userId).select("centerId");
    if (!student?.centerId) {
      sendBadRequest(res, "Student has no center");
      return;
    }
    const assignment = await getStudentAssignmentDetail({
      studentId: req.user!.userId,
      centerId: student.centerId.toString(),
      assignmentId: req.params.id as string,
    });
    sendSuccess(res, { assignment });
  } catch (err) {
    next(err);
  }
};

// â”€â”€ POST /api/student/assignments/:id/submit
export const submitAssignmentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { text, taskType } = req.body;
    if (!text) {
      sendBadRequest(res, "Missing required fields: text");
      return;
    }

    const student = await User.findById(req.user!.userId).select("centerId");
    if (!student?.centerId) {
      sendBadRequest(res, "Student has no center");
      return;
    }

    const essay = await submitEssay({
      studentId: req.user!.userId,
      centerId: student.centerId.toString(),
      text,
      taskType,
      assignmentId: req.params.id as string,
    });

    sendCreated(res, { submission: essay }, "Assignment submitted");
  } catch (err) {
    next(err);
  }
};
