import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { Assignment, Class, Essay, User } from "../models/index";
import { AppError } from "../middlewares/errorHandler";
import { generateTempPassword } from "../utils/textUtils";

const SALT_ROUNDS = 12;

const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);

const assertClassOwnedByTeacher = async (
  classId: string,
  centerId: string,
  teacherId: string,
) => {
  const cls = await Class.findOne({
    _id: toObjectId(classId),
    centerId: toObjectId(centerId),
    teacherId: toObjectId(teacherId),
    isActive: true,
  });
  if (!cls) throw new AppError("Class not found", 404);
  return cls;
};

const nameFromEmail = (email: string): string => {
  const local = email.split("@")[0] ?? "Student";
  const cleaned = local.replace(/[._-]+/g, " ").trim();
  return cleaned.length > 0 ? cleaned.replace(/\b\w/g, (m) => m.toUpperCase()) : "Student";
};

export const inviteStudentToClass = async (input: {
  centerId: string;
  teacherId: string;
  classId: string;
  email: string;
}) => {
  const { centerId, teacherId, classId, email } = input;
  const normalizedEmail = email.trim().toLowerCase();

  await assertClassOwnedByTeacher(classId, centerId, teacherId);

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new AppError(
      "Email already registered. Ask the student to join with class code.",
      409,
    );
  }

  const plainPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
  const name = nameFromEmail(normalizedEmail);

  const student = await User.create({
    name,
    email: normalizedEmail,
    passwordHash,
    role: "center_student",
    centerId: toObjectId(centerId),
    classId: toObjectId(classId),
    classIds: [toObjectId(classId)],
    teacherId: toObjectId(teacherId),
    registrationMode: "invited",
    mustChangePassword: true,
    isActive: true,
    createdBy: toObjectId(teacherId),
  });

  await Class.findByIdAndUpdate(classId, {
    $addToSet: { studentIds: student._id },
  });

  return {
    student,
    plainPassword,
  };
};

export const getClassAnalytics = async (input: {
  classId: string;
  centerId: string;
  teacherId: string;
}) => {
  const { classId, centerId, teacherId } = input;
  const cls = await assertClassOwnedByTeacher(classId, centerId, teacherId);

  const cid = toObjectId(centerId);
  const clsId = toObjectId(classId);

  const [
    totalStudents,
    totalSubmissions,
    avgScoreAgg,
    submissionStudentsAgg,
    scoreDistAgg,
    topStudents,
    recentSubmissions,
  ] = await Promise.all([
    User.countDocuments({
      classIds: clsId,
      centerId: cid,
      role: "center_student",
    }),
    Essay.countDocuments({ classId: clsId, centerId: cid }),
    Essay.aggregate([
      {
        $match: {
          classId: clsId,
          centerId: cid,
          status: { $in: ["scored", "graded"] },
          overallScore: { $ne: null },
        },
      },
      { $group: { _id: null, avg: { $avg: "$overallScore" } } },
    ]),
    Essay.aggregate([
      {
        $match: {
          classId: clsId,
          centerId: cid,
        },
      },
      { $group: { _id: "$studentId" } },
      { $count: "count" },
    ]),
    Essay.aggregate([
      {
        $match: {
          classId: clsId,
          centerId: cid,
          status: { $in: ["scored", "graded"] },
          overallScore: { $ne: null },
        },
      },
      { $group: { _id: "$overallScore", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    User.find({
      classIds: clsId,
      centerId: cid,
      role: "center_student",
    })
      .sort({ "stats.averageScore": -1 })
      .limit(3)
      .select("name stats")
      .lean(),
    Essay.find({ classId: clsId, centerId: cid })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("studentId", "name")
      .select("overallScore createdAt studentId")
      .lean(),
  ]);

  const averageScore = avgScoreAgg[0]?.avg ?? 0;
  const submittedStudents = submissionStudentsAgg[0]?.count ?? 0;
  const submissionRate =
    totalStudents > 0 ? Math.round((submittedStudents / totalStudents) * 100) : 0;

  return {
    classId: clsId.toString(),
    className: cls.name,
    totalStudents,
    totalSubmissions,
    averageScore,
    submissionRate,
    scoreDistribution: scoreDistAgg.map((d: any) => ({
      band: String(d._id),
      count: d.count as number,
    })),
    topStudents: topStudents.map((s) => ({
      name: s.name,
      averageScore: s.stats?.averageScore ?? 0,
    })),
    recentSubmissions: recentSubmissions.map((s: any) => ({
      studentName: s.studentId?.name ?? "Unknown",
      score: s.overallScore ?? 0,
      createdAt: s.createdAt,
    })),
  };
};

export const listAssignmentSubmissions = async (input: {
  assignmentId: string;
  centerId: string;
  teacherId: string;
  page?: number;
  limit?: number;
}) => {
  const { assignmentId, centerId, teacherId, page = 1, limit = 20 } = input;

  const assignment = await Assignment.findOne({
    _id: toObjectId(assignmentId),
    centerId: toObjectId(centerId),
    teacherId: toObjectId(teacherId),
  });
  if (!assignment) throw new AppError("Assignment not found", 404);

  const skip = (page - 1) * limit;
  const [essays, total] = await Promise.all([
    Essay.find({
      assignmentId: toObjectId(assignmentId),
      centerId: toObjectId(centerId),
    })
      .populate("studentId", "name email")
      .select("status overallScore createdAt studentId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Essay.countDocuments({
      assignmentId: toObjectId(assignmentId),
      centerId: toObjectId(centerId),
    }),
  ]);

  return {
    submissions: essays,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};

export const getTeacherDashboard = async (input: {
  centerId: string;
  teacherId: string;
}) => {
  const { centerId, teacherId } = input;
  const cid = toObjectId(centerId);
  const tid = toObjectId(teacherId);

  const classes = await Class.find({
    centerId: cid,
    teacherId: tid,
    isActive: true,
  }).select("_id");
  const classIds = classes.map((c) => c._id);

  const [classCount, assignmentCount, submissionsCount, pendingReviews] =
    await Promise.all([
      Class.countDocuments({ centerId: cid, teacherId: tid, isActive: true }),
      Assignment.countDocuments({ centerId: cid, teacherId: tid }),
      Essay.countDocuments({ centerId: cid, classId: { $in: classIds } }),
      Essay.countDocuments({
        centerId: cid,
        classId: { $in: classIds },
        status: { $in: ["scored", "graded"] },
        isReviewedByTeacher: false,
      }),
    ]);

  return {
    classes: classCount,
    assignments: assignmentCount,
    submissions: submissionsCount,
    pendingReviews,
  };
};
