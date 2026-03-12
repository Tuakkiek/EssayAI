/**
 * classService.ts  (Phase 3)
 *
 * Classes are center-scoped. Every method receives centerId from
 * req.centerFilter and passes it explicitly — never trusts request body.
 */

import mongoose from "mongoose";
import { Class, User } from "../models/index";
import { IClass } from "../models/Class";
import { AppError } from "../middlewares/errorHandler";

// ── Types ─────────────────────────────────────────────────────────────

export interface CreateClassInput {
  name: string;
  teacherId: string;
  description?: string;
  centerId: string;
}

export interface UpdateClassInput {
  name?: string;
  teacherId?: string;
  description?: string;
}

export interface ClassListFilter {
  centerId: string;
  teacherId?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

// ── Create ────────────────────────────────────────────────────────────

export const createClass = async (input: CreateClassInput): Promise<IClass> => {
  const { name, teacherId, description, centerId } = input;

  // Verify teacher belongs to this center
  const teacher = await User.findOne({
    _id: new mongoose.Types.ObjectId(teacherId),
    centerId: new mongoose.Types.ObjectId(centerId),
    role: { $in: ["teacher", "center_admin", "admin"] },
    isActive: true,
  });
  if (!teacher) {
    throw new AppError("Teacher not found in this center", 404);
  }

  const cls = await Class.create({
    name: name.trim(),
    teacherId: new mongoose.Types.ObjectId(teacherId),
    centerId: new mongoose.Types.ObjectId(centerId),
    description: description?.trim() ?? null,
    studentIds: [],
    isActive: true,
  });

  return cls;
};

// ── List ──────────────────────────────────────────────────────────────

export const listClasses = async (filter: ClassListFilter) => {
  const {
    centerId,
    teacherId,
    isActive = true,
    search,
    page = 1,
    limit = 20,
  } = filter;

  const query: Record<string, unknown> = {
    centerId: new mongoose.Types.ObjectId(centerId),
    isActive,
  };

  if (teacherId) {
    query.teacherId = new mongoose.Types.ObjectId(teacherId);
  }

  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.name = { $regex: escaped, $options: "i" };
  }

  const skip = (page - 1) * limit;
  const [classes, total] = await Promise.all([
    Class.find(query)
      .populate("teacherId", "name email phone")
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 }),
    Class.countDocuments(query),
  ]);

  return {
    classes,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  };
};

// ── Get single ────────────────────────────────────────────────────────

export const getClass = async (
  classId: string,
  centerId: string,
): Promise<IClass> => {
  const cls = await Class.findOne({
    _id: new mongoose.Types.ObjectId(classId),
    centerId: new mongoose.Types.ObjectId(centerId),
  }).populate("teacherId", "name email phone");

  if (!cls) throw new AppError("Class not found", 404);
  return cls;
};

// ── Get class with full student roster ────────────────────────────────

export const getClassWithStudents = async (
  classId: string,
  centerId: string,
) => {
  const cls = await Class.findOne({
    _id: new mongoose.Types.ObjectId(classId),
    centerId: new mongoose.Types.ObjectId(centerId),
  }).populate("teacherId", "name email phone");

  if (!cls) throw new AppError("Class not found", 404);

  const students = await User.find({
    classIds: new mongoose.Types.ObjectId(classId),
    centerId: new mongoose.Types.ObjectId(centerId),
    role: "student",
  }).select("name phone isActive stats mustChangePassword");

  return { cls, students };
};

// ── Update ────────────────────────────────────────────────────────────

export const updateClass = async (
  classId: string,
  centerId: string,
  input: UpdateClassInput,
): Promise<IClass> => {
  const cls = await Class.findOne({
    _id: new mongoose.Types.ObjectId(classId),
    centerId: new mongoose.Types.ObjectId(centerId),
  });
  if (!cls) throw new AppError("Class not found", 404);

  if (input.teacherId) {
    const teacher = await User.findOne({
      _id: new mongoose.Types.ObjectId(input.teacherId),
      centerId: new mongoose.Types.ObjectId(centerId),
      role: { $in: ["teacher", "center_admin", "admin"] },
      isActive: true,
    });
    if (!teacher) throw new AppError("Teacher not found in this center", 404);
    cls.teacherId = new mongoose.Types.ObjectId(input.teacherId);
  }

  if (input.name !== undefined) cls.name = input.name.trim();
  if (input.description !== undefined)
    cls.description = input.description?.trim() ?? null;

  await cls.save();
  return cls;
};

// ── Archive (soft-delete) ─────────────────────────────────────────────

export const archiveClass = async (
  classId: string,
  centerId: string,
): Promise<IClass> => {
  const cls = await Class.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(classId),
      centerId: new mongoose.Types.ObjectId(centerId),
    },
    { isActive: false },
    { new: true },
  );
  if (!cls) throw new AppError("Class not found", 404);
  return cls;
};

// ── Roster: add student(s) ────────────────────────────────────────────
/**
 * Adds one or more students to a class.
 * Students must belong to the same center.
 * A student can only be in one class at a time — if already in another,
 * they are moved (old class is updated too).
 */
export const addStudentsToClass = async (
  classId: string,
  studentIds: string[],
  centerId: string,
) => {
  const cls = await Class.findOne({
    _id: new mongoose.Types.ObjectId(classId),
    centerId: new mongoose.Types.ObjectId(centerId),
    isActive: true,
  });
  if (!cls) throw new AppError("Class not found", 404);

  const objectIds = studentIds.map((id) => new mongoose.Types.ObjectId(id));

  // Verify all students belong to this center
  const validStudents = await User.find({
    _id: { $in: objectIds },
    centerId: new mongoose.Types.ObjectId(centerId),
    role: "student",
    isActive: true,
  }).select("_id classIds");

  if (validStudents.length !== studentIds.length) {
    const foundIds = new Set(
      validStudents.map((s) => (s._id as mongoose.Types.ObjectId).toString()),
    );
    const missing = studentIds.filter((id) => !foundIds.has(id));
    throw new AppError(
      `Students not found in this center: ${missing.join(", ")}`,
      404,
    );
  }

  // Remove from any previous class first
  const withOtherClass = validStudents.filter((s) => s.classIds.length > 0);
  if (withOtherClass.length > 0) {
    const previousClassIds = withOtherClass.flatMap((s) => s.classIds);
    await Class.updateMany(
      { _id: { $in: previousClassIds } },
      { $pull: { studentIds: { $in: objectIds } } },
    );
  }

  // Add to new class
  await Promise.all([
    Class.findByIdAndUpdate(classId, {
      $addToSet: { studentIds: { $each: objectIds } },
    }),
    User.updateMany(
      { _id: { $in: objectIds } },
      { $set: { classIds: [new mongoose.Types.ObjectId(classId)] } },
    ),
  ]);

  return { addedCount: validStudents.length };
};

// ── Roster: remove student(s) ─────────────────────────────────────────

export const removeStudentsFromClass = async (
  classId: string,
  studentIds: string[],
  centerId: string,
) => {
  const cls = await Class.findOne({
    _id: new mongoose.Types.ObjectId(classId),
    centerId: new mongoose.Types.ObjectId(centerId),
  });
  if (!cls) throw new AppError("Class not found", 404);

  const objectIds = studentIds.map((id) => new mongoose.Types.ObjectId(id));

  await Promise.all([
    Class.findByIdAndUpdate(classId, {
      $pull: { studentIds: { $in: objectIds } },
    }),
    User.updateMany(
      {
        _id: { $in: objectIds },
        centerId: new mongoose.Types.ObjectId(centerId),
      },
      { $pull: { classIds: new mongoose.Types.ObjectId(classId) } },
    ),
  ]);

  return { removedCount: studentIds.length };
};

// ── Stats summary for teacher dashboard ───────────────────────────────

export const getClassStats = async (classId: string, centerId: string) => {
  const cls = await Class.findOne({
    _id: new mongoose.Types.ObjectId(classId),
    centerId: new mongoose.Types.ObjectId(centerId),
  });
  if (!cls) throw new AppError("Class not found", 404);

  const [totalStudents, activeStudents, pendingPasswordChange] =
    await Promise.all([
      User.countDocuments({
        classIds: cls._id,
        centerId: new mongoose.Types.ObjectId(centerId),
        role: "student",
      }),
      User.countDocuments({
        classIds: cls._id,
        centerId: new mongoose.Types.ObjectId(centerId),
        role: "student",
        isActive: true,
      }),
      User.countDocuments({
        classIds: cls._id,
        centerId: new mongoose.Types.ObjectId(centerId),
        role: "student",
        mustChangePassword: true,
      }),
    ]);

  return {
    classId,
    className: cls.name,
    totalStudents,
    activeStudents,
    pendingPasswordChange,
  };
};
