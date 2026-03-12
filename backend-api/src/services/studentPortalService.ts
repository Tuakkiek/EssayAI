import mongoose from "mongoose";
import { Class, Essay, User } from "../models/index";
import { AppError } from "../middlewares/errorHandler";
import { listAssignmentsForStudent, getAssignment } from "./assignmentService";

const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);

export const joinClassByCode = async (input: {
  classCode: string;
  studentId: string;
}) => {
  const { classCode, studentId } = input;
  const code = classCode.trim().toUpperCase();

  const cls = await Class.findOne({ code, isActive: true }).populate(
    "teacherId",
    "name email",
  );
  if (!cls) throw new AppError("Class not found", 404);

  const student = await User.findById(studentId);
  if (!student) throw new AppError("User not found", 404);

  if (!["free_student", "center_student"].includes(student.role)) {
    throw new AppError("Only students can join a class", 403);
  }

  if (student.centerId && student.centerId.toString() !== cls.centerId?.toString()) {
    throw new AppError("You already belong to another center", 400);
  }

  // Remove from previous class (if any)
  if (student.classIds?.length) {
    await Class.updateMany(
      { _id: { $in: student.classIds } },
      { $pull: { studentIds: student._id } },
    );
  }

  student.role = "center_student";
  student.centerId = cls.centerId;
  student.teacherId = cls.teacherId as any;
  student.classId = cls._id;
  student.classIds = [cls._id];
  student.registrationMode = "invited";

  await student.save();

  await Class.findByIdAndUpdate(cls._id, {
    $addToSet: { studentIds: student._id },
  });

  return { class: cls, teacher: cls.teacherId };
};

export const getMyClass = async (studentId: string) => {
  const student = await User.findById(studentId).select("classIds classId");
  if (!student) throw new AppError("User not found", 404);

  const classId = student.classId ?? student.classIds?.[0];
  if (!classId) throw new AppError("Student has no class", 404);

  const cls = await Class.findById(classId).populate("teacherId", "name email");
  if (!cls) throw new AppError("Class not found", 404);

  return { class: cls, teacher: cls.teacherId };
};

export const listStudentAssignments = async (input: {
  studentId: string;
  centerId: string;
  classIds: mongoose.Types.ObjectId[];
  page?: number;
  limit?: number;
}) => {
  const { studentId, centerId, classIds, page, limit } = input;
  const result = await listAssignmentsForStudent(classIds, centerId, page, limit);

  const assignmentIds = result.assignments.map((a) => a._id as mongoose.Types.ObjectId);
  const submissions = await Essay.find({
    assignmentId: { $in: assignmentIds },
    studentId: toObjectId(studentId),
  })
    .sort({ createdAt: -1 })
    .select("assignmentId overallScore status createdAt")
    .lean();

  const latestByAssignment = new Map<string, any>();
  for (const sub of submissions) {
    const key = (sub.assignmentId as mongoose.Types.ObjectId).toString();
    if (!latestByAssignment.has(key)) latestByAssignment.set(key, sub);
  }

  const assignments = result.assignments.map((a) => {
    const obj = (a as any).toObject ? (a as any).toObject() : a;
    const id = (a._id as mongoose.Types.ObjectId).toString();
    const className = obj.classId?.name;
    return {
      ...obj,
      className,
      submissionCount: obj.stats?.submissionCount ?? 0,
      mySubmission: latestByAssignment.get(id) ?? null,
    };
  });

  return { ...result, assignments };
};

export const getStudentAssignmentDetail = async (input: {
  studentId: string;
  centerId: string;
  assignmentId: string;
}) => {
  const { studentId, centerId, assignmentId } = input;

  const student = await User.findById(studentId).select("classIds");
  if (!student || (student.classIds?.length ?? 0) === 0) {
    throw new AppError("Student has no class", 404);
  }

  const assignment = await getAssignment(assignmentId, centerId);
  const classId = (assignment.classId as any)?._id ?? assignment.classId;
  if (!student.classIds.some((id) => id.toString() === classId.toString())) {
    throw new AppError("Assignment not in your class", 403);
  }

  const mySubmission = await Essay.findOne({
    assignmentId: toObjectId(assignmentId),
    studentId: toObjectId(studentId),
  })
    .sort({ createdAt: -1 })
    .select("overallScore status createdAt")
    .lean();

  const obj = (assignment as any).toObject ? (assignment as any).toObject() : assignment;
  return {
    ...obj,
    className: obj.classId?.name,
    submissionCount: obj.stats?.submissionCount ?? 0,
    mySubmission: mySubmission ?? null,
  };
};
