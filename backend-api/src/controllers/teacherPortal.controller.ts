import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { sendSuccess, sendCreated, sendBadRequest } from "../utils/response";
import {
  createClass,
  listClasses,
  getClassWithStudents,
  archiveClass,
} from "../services/classService";
import {
  createAssignment,
  listAssignments,
  getAssignment,
  updateAssignment,
  publishAssignment,
  closeAssignment,
  deleteAssignment,
} from "../services/assignmentService";
import { getEssay, reviewEssay } from "../services/essayService";
import {
  inviteStudentToClass,
  getClassAnalytics,
  listAssignmentSubmissions,
  getTeacherDashboard,
} from "../services/teacherPortalService";
import { Class, User } from "../models/index";
import { AppError } from "../middlewares/errorHandler";

const ensureTeacherOwnsAssignment = (assignment: any, teacherId: string) => {
  const ownerId =
    (assignment.teacherId as any)?._id?.toString?.() ??
    assignment.teacherId?.toString?.();
  if (ownerId && ownerId !== teacherId) {
    throw new AppError("Assignment not found", 404);
  }
};

// â”€â”€ Classes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const createTeacherClassHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, description } = req.body;
    if (!name) {
      sendBadRequest(res, "Missing required field: name");
      return;
    }
    const cls = await createClass({
      name,
      description,
      teacherId: req.user!.userId,
      centerId: req.centerFilter!.centerId,
    });
    sendCreated(res, { class: cls }, "Class created");
  } catch (err) {
    next(err);
  }
};

export const listTeacherClassesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { search, page, limit, isActive } = req.query;
    const result = await listClasses({
      centerId: req.centerFilter!.centerId,
      teacherId: req.user!.userId,
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

export const getTeacherClassDetailHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { cls, students } = await getClassWithStudents(
      req.params.classId as string,
      req.centerFilter!.centerId,
    );
    const ownerId =
      (cls.teacherId as any)?._id?.toString?.() ?? cls.teacherId?.toString?.();
    if (ownerId !== req.user!.userId) {
      sendBadRequest(res, "Class not found");
      return;
    }
    sendSuccess(res, { class: cls, students });
  } catch (err) {
    next(err);
  }
};

export const deleteTeacherClassHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { cls } = await getClassWithStudents(
      req.params.classId as string,
      req.centerFilter!.centerId,
    );
    const ownerId =
      (cls.teacherId as any)?._id?.toString?.() ?? cls.teacherId?.toString?.();
    if (ownerId !== req.user!.userId) {
      sendBadRequest(res, "Class not found");
      return;
    }
    const archived = await archiveClass(
      req.params.classId as string,
      req.centerFilter!.centerId,
    );
    sendSuccess(res, { class: archived }, "Class archived");
  } catch (err) {
    next(err);
  }
};

export const inviteStudentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      sendBadRequest(res, "Email is required");
      return;
    }
    const result = await inviteStudentToClass({
      email,
      classId: req.params.classId as string,
      centerId: req.centerFilter!.centerId,
      teacherId: req.user!.userId,
    });
    sendCreated(res, result, "Student invited");
  } catch (err) {
    next(err);
  }
};

export const removeStudentFromClassHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const rawClassId = req.params.classId;
    const rawStudentId = req.params.studentId;
    const classId = Array.isArray(rawClassId) ? rawClassId[0] : rawClassId;
    const studentId = Array.isArray(rawStudentId) ? rawStudentId[0] : rawStudentId;
    if (!classId || !studentId) {
      sendBadRequest(res, "classId and studentId are required");
      return;
    }
    const cls = await Class.findOne({
      _id: new mongoose.Types.ObjectId(classId),
      centerId: new mongoose.Types.ObjectId(req.centerFilter!.centerId),
      teacherId: new mongoose.Types.ObjectId(req.user!.userId),
    });
    if (!cls) {
      sendBadRequest(res, "Class not found");
      return;
    }
    await Promise.all([
      Class.findByIdAndUpdate(classId, {
        $pull: { studentIds: new mongoose.Types.ObjectId(studentId) },
      }),
      User.findByIdAndUpdate(studentId, {
        $set: { classId: null, teacherId: null },
        $pull: { classIds: new mongoose.Types.ObjectId(classId) },
      }),
    ]);
    sendSuccess(res, null, "Student removed");
  } catch (err) {
    next(err);
  }
};

export const classAnalyticsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const stats = await getClassAnalytics({
      classId: req.params.classId as string,
      centerId: req.centerFilter!.centerId,
      teacherId: req.user!.userId,
    });
    sendSuccess(res, { stats });
  } catch (err) {
    next(err);
  }
};

// â”€â”€ Assignments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const createTeacherAssignmentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { classId, title, taskType, prompt, description, startDate, dueDate, maxAttempts, gradingCriteria, status } =
      req.body;

    if (!classId || !title || !taskType || !prompt || !dueDate) {
      sendBadRequest(res, "Missing required fields: classId, title, taskType, prompt, dueDate");
      return;
    }

    const cls = await Class.findOne({
      _id: new mongoose.Types.ObjectId(classId),
      centerId: new mongoose.Types.ObjectId(req.centerFilter!.centerId),
      teacherId: new mongoose.Types.ObjectId(req.user!.userId),
      isActive: true,
    });
    if (!cls) {
      sendBadRequest(res, "Class not found");
      return;
    }

    const assignment = await createAssignment({
      centerId: req.centerFilter!.centerId,
      teacherId: req.user!.userId,
      classId,
      title,
      taskType,
      prompt,
      description,
      startDate,
      dueDate,
      maxAttempts,
      gradingCriteria,
      status,
    });

    sendCreated(res, { assignment }, "Assignment created");
  } catch (err) {
    next(err);
  }
};

export const listTeacherAssignmentsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { classId, status, taskType, page, limit } = req.query;
    const result = await listAssignments({
      centerId: req.centerFilter!.centerId,
      teacherId: req.user!.userId,
      classId: classId as string | undefined,
      status: status as any,
      taskType: taskType as any,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export const getTeacherAssignmentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const assignment = await getAssignment(
      req.params.id as string,
      req.centerFilter!.centerId,
    );
    ensureTeacherOwnsAssignment(assignment, req.user!.userId);
    sendSuccess(res, { assignment });
  } catch (err) {
    next(err);
  }
};

export const updateTeacherAssignmentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const assignment = await getAssignment(
      req.params.id as string,
      req.centerFilter!.centerId,
    );
    ensureTeacherOwnsAssignment(assignment, req.user!.userId);
    const updated = await updateAssignment(
      req.params.id as string,
      req.centerFilter!.centerId,
      req.body,
    );
    sendSuccess(res, { assignment: updated }, "Assignment updated");
  } catch (err) {
    next(err);
  }
};

export const publishTeacherAssignmentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const assignment = await getAssignment(
      req.params.id as string,
      req.centerFilter!.centerId,
    );
    ensureTeacherOwnsAssignment(assignment, req.user!.userId);
    const updated = await publishAssignment(
      req.params.id as string,
      req.centerFilter!.centerId,
    );
    sendSuccess(res, { assignment: updated }, "Assignment published");
  } catch (err) {
    next(err);
  }
};

export const closeTeacherAssignmentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const assignment = await getAssignment(
      req.params.id as string,
      req.centerFilter!.centerId,
    );
    ensureTeacherOwnsAssignment(assignment, req.user!.userId);
    const updated = await closeAssignment(
      req.params.id as string,
      req.centerFilter!.centerId,
    );
    sendSuccess(res, { assignment: updated }, "Assignment closed");
  } catch (err) {
    next(err);
  }
};

export const deleteTeacherAssignmentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const assignment = await getAssignment(
      req.params.id as string,
      req.centerFilter!.centerId,
    );
    ensureTeacherOwnsAssignment(assignment, req.user!.userId);
    await deleteAssignment(req.params.id as string, req.centerFilter!.centerId);
    sendSuccess(res, null, "Assignment deleted");
  } catch (err) {
    next(err);
  }
};

export const listTeacherAssignmentSubmissionsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page, limit } = req.query;
    const result = await listAssignmentSubmissions({
      assignmentId: req.params.id as string,
      centerId: req.centerFilter!.centerId,
      teacherId: req.user!.userId,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

// â”€â”€ Submissions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getSubmissionDetailHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const essay = await getEssay(
      req.params.submissionId as string,
      req.user!.userId,
      req.user!.role,
      req.centerFilter!.centerId,
    );
    sendSuccess(res, { submission: essay });
  } catch (err) {
    next(err);
  }
};

export const reviewSubmissionHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { comment } = req.body;
    const essay = await reviewEssay(
      req.params.submissionId as string,
      req.centerFilter!.centerId,
      req.user!.userId,
      comment,
    );
    sendSuccess(res, { submission: essay }, "Submission reviewed");
  } catch (err) {
    next(err);
  }
};

// â”€â”€ Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const teacherDashboardHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await getTeacherDashboard({
      centerId: req.centerFilter!.centerId,
      teacherId: req.user!.userId,
    });
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};
