import mongoose from "mongoose";
import { Center, User } from "../models/index";
import { AppError } from "../middlewares/errorHandler";
import { logger } from "../utils/logger";
import type { IUser } from "../models/User";
import bcrypt from "bcryptjs";

// ── Types ──────────────────────────────────────────────────────────
export interface CreateTeacherInput {
  name: string;
  email: string;
  phone: string;
}

export interface UpdateCenterInput {
  name?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
}

// ── Get center details (for CENTER_ADMIN) ───────────────────────────
export const getCenter = async (centerId: string, requesterId: string) => {
  const center = await Center.findById(centerId).populate(
    "ownerId",
    "name email",
  );

  if (!center) throw new AppError("Center not found", 404);

  // Verify ownership
  if (
    !center.ownerId._id.equals(requesterId) &&
    !mongoose.isValidObjectId(requesterId)
  ) {
    throw new AppError("Not authorized", 403);
  }

  // Denormalized stats
  const [studentCount, teacherCount] = await Promise.all([
    User.countDocuments({
      centerId,
      role: "student",
      accountType: "CENTER_STUDENT",
      isActive: true,
    }),
    User.countDocuments({
      centerId,
      role: { $in: ["teacher", "center_admin"] },
      isActive: true,
    }),
  ]);

  return {
    ...center.toObject(),
    studentCount,
    teacherCount,
    subscriptionActive: center.subscription.isActive,
  };
};

// ── Update center profile ───────────────────────────────────────────
export const updateCenter = async (
  centerId: string,
  data: UpdateCenterInput,
) => {
  const center = await Center.findById(centerId);
  if (!center) throw new AppError("Center not found", 404);

  Object.assign(center, data);
  await center.save();

  return center;
};

// ── List/add/remove teachers (CENTER_ADMIN only) ────────────────────
export const listTeachers = async (centerId: string) => {
  return User.find({
    centerId,
    role: { $in: ["teacher", "center_admin"] },
    isActive: true,
  }).select("-passwordHash");
};

export const createTeacher = async (
  centerId: string,
  createdBy: string,
  input: CreateTeacherInput,
) => {
  const center = await Center.findById(centerId);
  if (!center) throw new AppError("Center not found", 404);

  // Check email uniqueness
  const existingEmail = await User.findOne({
    email: input.email.toLowerCase(),
  });
  if (existingEmail) throw new AppError("Email already registered", 409);

  // Generate temp password (force change)
  const tempPassword = Math.random().toString(36).slice(-8);
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const teacher = await User.create({
    ...input,
    email: input.email.toLowerCase(),
    passwordHash,
    role: "teacher",
    centerId,
    accountType: "CENTER_STAFF",
    mustChangePassword: true,
    isActive: true,
    createdBy: new mongoose.Types.ObjectId(createdBy),
  });

  // Add to center teachers array
  center.teachers.push(teacher._id);
  center.teacherCount += 1;
  await center.save();

  logger.info("Teacher created", { teacherId: teacher._id, centerId });

  return {
    ...teacher.toObject(),
    tempPassword, // Show once for admin to communicate
  };
};

export const removeTeacher = async (
  centerId: string,
  teacherId: string,
  requesterId: string,
) => {
  const center = await Center.findById(centerId);
  if (!center) throw new AppError("Center not found", 404);

  if (!center.ownerId.equals(requesterId)) {
    throw new AppError("Only owner can remove teachers", 403);
  }

  const teacher = await User.findOneAndUpdate(
    { _id: teacherId, centerId },
    { isActive: false },
    { new: true },
  );

  if (!teacher) throw new AppError("Teacher not found", 404);

  // Remove from center teachers array if present
  center.teachers = center.teachers.filter((id) => !id.equals(teacherId));
  center.teacherCount = Math.max(0, center.teacherCount - 1);
  await center.save();

  logger.info("Teacher deactivated", { teacherId, centerId });
};
