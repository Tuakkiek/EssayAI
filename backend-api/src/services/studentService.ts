/**
 * studentService.ts  (Phase 1)
 *
 * All mutations are scoped to centerId — callers must never pass centerId
 * from req.body. Always use req.centerFilter injected by requireCenter middleware.
 */

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User, Class } from "../models/index";
import { AppError } from "../middlewares/errorHandler";
import {
  generateStudentCredentials,
  normalizePhone,
  validatePhone,
} from "../utils/textUtils";

const SALT_ROUNDS = 12;

// ── Input / output types ──────────────────────────────────────────────

export interface CreateStudentInput {
  name: string;
  phone: string;
  classId?: string; // optional — can enrol at creation time
  createdBy: string; // teacher/admin userId
  centerId: string;
}

export interface CreateStudentResult {
  student: {
    id: string;
    name: string;
    phone: string;
    role: "student";
    classId: string | null;
  };
  /** Raw password — returned ONCE, never stored in plaintext */
  plainPassword: string;
}

export interface UpdateStudentInput {
  name?: string;
  phone?: string;
  classId?: string | null; // null = remove from all classes
}

export interface StudentListFilter {
  centerId: string;
  classId?: string;
  isActive?: boolean;
  search?: string; // partial match on name or phone
  page?: number;
  limit?: number;
}

// ── Create single student ─────────────────────────────────────────────

export const createStudent = async (
  input: CreateStudentInput,
): Promise<CreateStudentResult> => {
  const { name, phone: rawPhone, classId, createdBy, centerId } = input;

  const phone = normalizePhone(rawPhone);
  if (!validatePhone(phone)) {
    throw new AppError(`Invalid phone number: ${rawPhone}`, 400);
  }

  // Unique within this center
  const existing = await User.findOne({
    phone,
    centerId: new mongoose.Types.ObjectId(centerId),
  });
  if (existing) {
    throw new AppError(
      `Phone ${phone} is already registered in this center`,
      409,
    );
  }

  // Validate classId belongs to this center
  if (classId) {
    const cls = await Class.findOne({
      _id: new mongoose.Types.ObjectId(classId),
      centerId: new mongoose.Types.ObjectId(centerId),
    });
    if (!cls) throw new AppError("Class not found in this center", 404);
  }

  // Generate credentials
  const { password: plainPassword } = generateStudentCredentials(name, phone);
  const passwordHash = await bcrypt.hash(plainPassword, SALT_ROUNDS);

  // Create user
  const student = await User.create({
    name: name.trim(),
    phone,
    passwordHash,
    role: "student",
    centerId: new mongoose.Types.ObjectId(centerId),
    classIds: classId ? [new mongoose.Types.ObjectId(classId)] : [],
    isActive: true,
    mustChangePassword: true,
    createdBy: new mongoose.Types.ObjectId(createdBy),
  });

  // Add student to Class.studentIds
  if (classId) {
    await Class.findByIdAndUpdate(classId, {
      $addToSet: { studentIds: student._id },
    });
  }

  return {
    student: {
      id: (student._id as mongoose.Types.ObjectId).toString(),
      name: student.name,
      phone: student.phone ?? "",
      role: "student",
      classId: classId ?? null,
    },
    plainPassword,
  };
};

// ── List students ─────────────────────────────────────────────────────

export const listStudents = async (filter: StudentListFilter) => {
  const {
    centerId,
    classId,
    isActive = true,
    search,
    page = 1,
    limit = 20,
  } = filter;

  const query: Record<string, unknown> = {
    centerId: new mongoose.Types.ObjectId(centerId),
    role: "student",
    isActive,
  };

  if (classId) {
    query.classIds = new mongoose.Types.ObjectId(classId);
  }

  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { phone: { $regex: escaped, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;
  const [students, total] = await Promise.all([
    User.find(query)
      .select("-passwordHash")
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 }),
    User.countDocuments(query),
  ]);

  return {
    students,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  };
};

// ── Get single student ────────────────────────────────────────────────

export const getStudent = async (studentId: string, centerId: string) => {
  const student = await User.findOne({
    _id: new mongoose.Types.ObjectId(studentId),
    centerId: new mongoose.Types.ObjectId(centerId),
    role: "student",
  }).select("-passwordHash");

  if (!student) throw new AppError("Student not found", 404);
  return student;
};

// ── Update student ────────────────────────────────────────────────────

export const updateStudent = async (
  studentId: string,
  centerId: string,
  input: UpdateStudentInput,
) => {
  const student = await User.findOne({
    _id: new mongoose.Types.ObjectId(studentId),
    centerId: new mongoose.Types.ObjectId(centerId),
    role: "student",
  });
  if (!student) throw new AppError("Student not found", 404);

  // Phone uniqueness check if phone is changing
  if (input.phone) {
    const normalized = normalizePhone(input.phone);
    if (!validatePhone(normalized)) {
      throw new AppError(`Invalid phone number: ${input.phone}`, 400);
    }
    const conflict = await User.findOne({
      phone: normalized,
      centerId: new mongoose.Types.ObjectId(centerId),
      _id: { $ne: new mongoose.Types.ObjectId(studentId) },
    });
    if (conflict)
      throw new AppError(`Phone ${normalized} is already in use`, 409);
    input.phone = normalized;
  }

  // Handle classId change
  if (input.classId !== undefined) {
    // Remove from old classes
    if (student.classIds.length > 0) {
      await Class.updateMany(
        { _id: { $in: student.classIds } },
        { $pull: { studentIds: student._id } },
      );
    }

    if (input.classId) {
      const cls = await Class.findOne({
        _id: new mongoose.Types.ObjectId(input.classId),
        centerId: new mongoose.Types.ObjectId(centerId),
      });
      if (!cls) throw new AppError("Class not found in this center", 404);
      await Class.findByIdAndUpdate(input.classId, {
        $addToSet: { studentIds: student._id },
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (student as any).classIds = input.classId
      ? [new mongoose.Types.ObjectId(input.classId)]
      : [];
  }

  if (input.name) student.name = input.name.trim();
  if (input.phone) student.phone = input.phone;

  await student.save();
  return student;
};

// ── Deactivate (soft-delete) ──────────────────────────────────────────

export const deactivateStudent = async (
  studentId: string,
  centerId: string,
) => {
  const student = await User.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(studentId),
      centerId: new mongoose.Types.ObjectId(centerId),
      role: "student",
    },
    { isActive: false },
    { new: true },
  ).select("-passwordHash");

  if (!student) throw new AppError("Student not found", 404);
  return student;
};

// ── Reactivate ────────────────────────────────────────────────────────

export const reactivateStudent = async (
  studentId: string,
  centerId: string,
) => {
  const student = await User.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(studentId),
      centerId: new mongoose.Types.ObjectId(centerId),
      role: "student",
    },
    { isActive: true },
    { new: true },
  ).select("-passwordHash");

  if (!student) throw new AppError("Student not found", 404);
  return student;
};

// ── Reset password (teacher action) ──────────────────────────────────
/**
 * Resets back to the default generated password.
 * Returns the new plaintext password once — teacher must share with student.
 */
export const resetStudentPassword = async (
  studentId: string,
  centerId: string,
): Promise<{ plainPassword: string }> => {
  const student = await User.findOne({
    _id: new mongoose.Types.ObjectId(studentId),
    centerId: new mongoose.Types.ObjectId(centerId),
    role: "student",
  });
  if (!student) throw new AppError("Student not found", 404);

  const { password: plainPassword } = generateStudentCredentials(
    student.name,
    student.phone ?? "",
  );
  const passwordHash = await bcrypt.hash(plainPassword, SALT_ROUNDS);

  await User.findByIdAndUpdate(studentId, {
    passwordHash,
    mustChangePassword: true,
  });

  return { plainPassword };
};
