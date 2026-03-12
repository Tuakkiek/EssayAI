/**
 * assignmentService.ts
 *
 * Business rules:
 *  - Only teachers/admins can create/edit assignments.
 *  - An assignment can only target a class that belongs to the same center (if centerId is provided).
 *  - draft → published → closed (one-way transitions; can't unpublish once students have submitted).
 *  - Deleting a published assignment with submissions is blocked — use close instead.
 */

import mongoose from "mongoose";
import { Assignment, Class, User } from "../models/index";
import {
  IAssignment,
  AssignmentStatus,
  AssignmentTaskType,
  IGradingCriteria,
} from "../models/Assignment";
import { AppError } from "../middlewares/errorHandler";

// ── Input types ───────────────────────────────────────────────────────

export interface CreateAssignmentInput {
  centerId?: string;
  teacherId: string;
  classId: string;
  title: string;
  taskType: AssignmentTaskType;
  prompt: string;
  description?: string;
  startDate?: string | Date;
  dueDate: string | Date;
  maxAttempts?: number;
  gradingCriteria?: IGradingCriteria;
  status?: AssignmentStatus;
}

export interface UpdateAssignmentInput {
  title?: string;
  description?: string;
  prompt?: string;
  startDate?: string | Date | null;
  dueDate?: string | Date | null;
  maxAttempts?: number;
  gradingCriteria?: IGradingCriteria | null;
}

export interface AssignmentListFilter {
  centerId?: string;
  classId?: string;
  teacherId?: string;
  status?: AssignmentStatus;
  taskType?: AssignmentTaskType;
  page?: number;
  limit?: number;
}

// ── Helpers ───────────────────────────────────────────────────────

const assertClassBelongsToCenter = async (classId: string, centerId?: string) => {
  const query: Record<string, unknown> = {
    _id: new mongoose.Types.ObjectId(classId),
    isActive: true,
  };
  if (centerId) query.centerId = new mongoose.Types.ObjectId(centerId);
  const cls = await Class.findOne(query);
  if (!cls) throw new AppError("Class not found", 404);
  return cls;
};

const assertAssignmentEditable = (assignment: IAssignment) => {
  if (assignment.status === "closed") {
    throw new AppError("Cannot modify a closed assignment", 400);
  }
};

const normalizeCriteria = (
  criteria?: IGradingCriteria | null,
): IGradingCriteria | undefined => {
  if (!criteria) return undefined;

  const requiredVocabulary = (criteria.requiredVocabulary ?? [])
    .map((v) => ({
      word: v.word?.trim() ?? "",
      synonyms: (v.synonyms ?? [])
        .map((s) => s.trim())
        .filter(Boolean),
      importance: v.importance ?? "required",
    }))
    .filter((v) => v.word.length > 0);

  const bandDescriptors = (criteria.bandDescriptors ?? [])
    .map((d) => ({
      band: d.band,
      descriptor: d.descriptor?.trim() ?? "",
    }))
    .filter((d) => d.band !== undefined && d.descriptor.length > 0);

  return {
    overview: criteria.overview?.trim() || undefined,
    requiredVocabulary,
    bandDescriptors,
    structureRequirements: criteria.structureRequirements?.trim() || undefined,
    penaltyNotes: criteria.penaltyNotes?.trim() || undefined,
    additionalNotes: criteria.additionalNotes?.trim() || undefined,
  };
};

// ── Create ───────────────────────────────────────────────────────

export const createAssignment = async (
  input: CreateAssignmentInput,
): Promise<IAssignment> => {
  const {
    centerId,
    teacherId,
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
  } = input;

  const cls = await assertClassBelongsToCenter(classId, centerId);

  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) {
    throw new AppError("Invalid dueDate", 400);
  }
  if (due <= new Date()) {
    throw new AppError("dueDate must be in the future", 400);
  }

  const assignment = await Assignment.create({
    centerId: centerId
      ? new mongoose.Types.ObjectId(centerId)
      : cls.centerId ?? null,
    classId: new mongoose.Types.ObjectId(classId),
    teacherId: new mongoose.Types.ObjectId(teacherId),
    title: title.trim(),
    taskType,
    prompt: prompt.trim(),
    description: description?.trim() ?? null,
    startDate: startDate ? new Date(startDate) : null,
    dueDate: due,
    maxAttempts: maxAttempts ?? 1,
    status: status ?? "draft",
    gradingCriteria: normalizeCriteria(gradingCriteria),
  });

  return assignment;
};

// ── List ───────────────────────────────────────────────────────

export const listAssignments = async (filter: AssignmentListFilter) => {
  const {
    centerId,
    classId,
    teacherId,
    status,
    taskType,
    page = 1,
    limit = 20,
  } = filter;

  const query: Record<string, unknown> = {};
  if (centerId) query.centerId = new mongoose.Types.ObjectId(centerId);
  if (classId) query.classId = new mongoose.Types.ObjectId(classId);
  if (teacherId) query.teacherId = new mongoose.Types.ObjectId(teacherId);
  if (status) query.status = status;
  if (taskType) query.taskType = taskType;

  const skip = (page - 1) * limit;
  const [assignments, total] = await Promise.all([
    Assignment.find(query)
      .populate("classId", "name code")
      .populate("teacherId", "name")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Assignment.countDocuments(query),
  ]);

  return {
    assignments,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  };
};

// ── List for students — only published, non-expired ───────────────────
export const listAssignmentsForStudent = async (
  classIds: mongoose.Types.ObjectId[],
  centerId?: string,
  page = 1,
  limit = 20,
) => {
  const now = new Date();
  const query: Record<string, unknown> = {
    classId: { $in: classIds },
    status: "published",
    dueDate: { $gte: now },
    $or: [{ startDate: null }, { startDate: { $lte: now } }],
  };
  if (centerId) query.centerId = new mongoose.Types.ObjectId(centerId);

  const skip = (page - 1) * limit;
  const [assignments, total] = await Promise.all([
    Assignment.find(query)
      .populate("classId", "name code")
      .populate("teacherId", "name")
      .skip(skip)
      .limit(limit)
      .sort({ dueDate: 1, createdAt: -1 }),
    Assignment.countDocuments(query),
  ]);

  return {
    assignments,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  };
};

// ── Get single ───────────────────────────────────────────────────────

export const getAssignment = async (
  assignmentId: string,
  centerId?: string,
): Promise<IAssignment> => {
  const query: Record<string, unknown> = {
    _id: new mongoose.Types.ObjectId(assignmentId),
  };
  if (centerId) query.centerId = new mongoose.Types.ObjectId(centerId);

  const assignment = await Assignment.findOne(query)
    .populate("classId", "name code")
    .populate("teacherId", "name email");

  if (!assignment) throw new AppError("Assignment not found", 404);
  return assignment;
};

// ── Update ───────────────────────────────────────────────────────

export const updateAssignment = async (
  assignmentId: string,
  centerId: string | undefined,
  input: UpdateAssignmentInput,
): Promise<IAssignment> => {
  const query: Record<string, unknown> = {
    _id: new mongoose.Types.ObjectId(assignmentId),
  };
  if (centerId) query.centerId = new mongoose.Types.ObjectId(centerId);

  const assignment = await Assignment.findOne(query);
  if (!assignment) throw new AppError("Assignment not found", 404);
  assertAssignmentEditable(assignment);

  // Can't change prompt once published (students may already be mid-essay)
  if (assignment.status === "published" && input.prompt) {
    throw new AppError(
      "Cannot change prompt on a published assignment. Close it and create a new one.",
      400,
    );
  }

  if (input.title !== undefined) assignment.title = input.title.trim();
  if (input.description !== undefined)
    assignment.description = input.description?.trim() ?? undefined;
  if (input.prompt !== undefined) assignment.prompt = input.prompt.trim();
  if (input.maxAttempts !== undefined) assignment.maxAttempts = input.maxAttempts;

  if (input.startDate !== undefined) {
    assignment.startDate = input.startDate
      ? new Date(input.startDate)
      : null;
  }

  if (input.dueDate !== undefined) {
    if (input.dueDate === null) {
      assignment.dueDate = null as unknown as Date;
    } else {
      const due = new Date(input.dueDate);
      if (due <= new Date()) throw new AppError("dueDate must be in the future", 400);
      assignment.dueDate = due;
    }
  }

  if (input.gradingCriteria !== undefined) {
    assignment.gradingCriteria = normalizeCriteria(input.gradingCriteria) ?? undefined;
  }

  await assignment.save();
  return assignment;
};

// ── Publish ───────────────────────────────────────────────────────

export const publishAssignment = async (
  assignmentId: string,
  centerId?: string,
): Promise<IAssignment> => {
  const query: Record<string, unknown> = {
    _id: new mongoose.Types.ObjectId(assignmentId),
  };
  if (centerId) query.centerId = new mongoose.Types.ObjectId(centerId);

  const assignment = await Assignment.findOne(query);
  if (!assignment) throw new AppError("Assignment not found", 404);

  if (assignment.status === "published") {
    throw new AppError("Assignment is already published", 400);
  }
  if (assignment.status === "closed") {
    throw new AppError("Cannot re-publish a closed assignment", 400);
  }

  assignment.status = "published";
  await assignment.save();
  return assignment;
};

// ── Close ───────────────────────────────────────────────────────

export const closeAssignment = async (
  assignmentId: string,
  centerId?: string,
): Promise<IAssignment> => {
  const query: Record<string, unknown> = {
    _id: new mongoose.Types.ObjectId(assignmentId),
  };
  if (centerId) query.centerId = new mongoose.Types.ObjectId(centerId);

  const assignment = await Assignment.findOne(query);
  if (!assignment) throw new AppError("Assignment not found", 404);

  if (assignment.status === "closed") {
    throw new AppError("Assignment is already closed", 400);
  }

  assignment.status = "closed";
  await assignment.save();
  return assignment;
};

// ── Delete (drafts only) ─────────────────────────────────────────────

export const deleteAssignment = async (
  assignmentId: string,
  centerId?: string,
): Promise<void> => {
  const query: Record<string, unknown> = {
    _id: new mongoose.Types.ObjectId(assignmentId),
  };
  if (centerId) query.centerId = new mongoose.Types.ObjectId(centerId);

  const assignment = await Assignment.findOne(query);
  if (!assignment) throw new AppError("Assignment not found", 404);

  if (assignment.status !== "draft") {
    throw new AppError(
      "Only draft assignments can be deleted. Use close to retire a published assignment.",
      400,
    );
  }

  await Assignment.findByIdAndDelete(assignmentId);
};

// ── Stats (for teacher dashboard) ────────────────────────────────────

export const getAssignmentStats = async (
  assignmentId: string,
  centerId?: string,
) => {
  const query: Record<string, unknown> = {
    _id: new mongoose.Types.ObjectId(assignmentId),
  };
  if (centerId) query.centerId = new mongoose.Types.ObjectId(centerId);

  const assignment = await Assignment.findOne(query).select(
    "title taskType status stats classId dueDate",
  );

  if (!assignment) throw new AppError("Assignment not found", 404);

  const enrolledCount = await User.countDocuments({
    classIds: assignment.classId,
    role: "center_student",
    isActive: true,
  });

  return {
    assignment,
    enrolledCount,
    submissionRate:
      enrolledCount > 0
        ? Math.round((assignment.stats.submissionCount / enrolledCount) * 100)
        : 0,
  };
};
