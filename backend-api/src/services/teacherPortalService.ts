import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { Assignment, Class, Essay, User } from "../models/index";
import { AppError } from "../middlewares/errorHandler";
import { generateTempPassword, generateStudentCredentials, normalizePhone } from "../utils/textUtils";
import { addStudentsToClass } from "./classService";

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

export interface BulkCreateStudentRow {
  name: string;
  phone: string;
}

export interface BulkCreateStudentResultRow {
  rowNumber: number;
  name: string;
  phone: string;
  status: "created" | "linked" | "error";
  userId?: string;
  tempPassword?: string;
  reason?: string;
}

export interface BulkCreateStudentsResult {
  total: number;
  createdCount: number;
  linkedCount: number;
  errorCount: number;
  results: BulkCreateStudentResultRow[];
}

export const bulkCreateStudentsToClass = async (input: {
  centerId: string;
  teacherId: string;
  classId: string;
  students: BulkCreateStudentRow[];
}): Promise<BulkCreateStudentsResult> => {
  const { centerId, teacherId, classId, students } = input;

  await assertClassOwnedByTeacher(classId, centerId, teacherId);

  const results: BulkCreateStudentResultRow[] = [];
  const seen = new Map<string, number>();
  const toAddIds: mongoose.Types.ObjectId[] = [];

  const centerObjectId = toObjectId(centerId);
  const classObjectId = toObjectId(classId);
  const teacherObjectId = toObjectId(teacherId);

  for (let i = 0; i < students.length; i += 1) {
    const row = students[i];
    const rowNumber = i + 1;
    const name = (row?.name ?? "").trim();
    const phone = normalizePhone(row?.phone ?? "");

    if (!name) {
      results.push({
        rowNumber,
        name: row?.name ?? "",
        phone: row?.phone ?? "",
        status: "error",
        reason: "Name is required",
      });
      continue;
    }

    if (!phone) {
      results.push({
        rowNumber,
        name,
        phone: row?.phone ?? "",
        status: "error",
        reason: "Phone is required",
      });
      continue;
    }

    if (seen.has(phone)) {
      results.push({
        rowNumber,
        name,
        phone,
        status: "error",
        reason: `Duplicate phone (first at row ${seen.get(phone)})`,
      });
      continue;
    }
    seen.set(phone, rowNumber);

    const existing = await User.findOne({ phone });
    if (existing) {
      if (!existing.isActive) {
        results.push({
          rowNumber,
          name,
          phone,
          status: "error",
          reason: "Account is disabled",
        });
        continue;
      }
      if (existing.role === "teacher" || existing.role === "admin") {
        results.push({
          rowNumber,
          name,
          phone,
          status: "error",
          reason: "Phone belongs to a staff account",
        });
        continue;
      }

      if (
        existing.role === "center_student" &&
        existing.centerId &&
        existing.centerId.toString() !== centerId
      ) {
        results.push({
          rowNumber,
          name,
          phone,
          status: "error",
          reason: "Phone already registered in another center",
        });
        continue;
      }

      let shouldSave = false;
      if (existing.role === "free_student") {
        existing.role = "center_student";
        shouldSave = true;
      }
      if (!existing.centerId || existing.centerId.toString() !== centerId) {
        existing.centerId = centerObjectId;
        shouldSave = true;
      }
      if (existing.registrationMode !== "invited") {
        existing.registrationMode = "invited";
        shouldSave = true;
      }
      if (shouldSave) await existing.save();

      toAddIds.push(existing._id as mongoose.Types.ObjectId);
      results.push({
        rowNumber,
        name: existing.name ?? name,
        phone,
        status: "linked",
        userId: (existing._id as mongoose.Types.ObjectId).toString(),
      });
      continue;
    }

    const { password: plainPassword } = generateStudentCredentials(name, phone);
    const passwordHash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
    const student = await User.create({
      name,
      phone,
      email: null,
      passwordHash,
      role: "center_student",
      centerId: centerObjectId,
      classIds: [],
      classId: null,
      teacherId: teacherObjectId,
      registrationMode: "invited",
      mustChangePassword: true,
      isActive: true,
      createdBy: teacherObjectId,
      stats: { essaysSubmitted: 0, averageScore: 0 },
    });

    toAddIds.push(student._id as mongoose.Types.ObjectId);
    results.push({
      rowNumber,
      name,
      phone,
      status: "created",
      userId: (student._id as mongoose.Types.ObjectId).toString(),
      tempPassword: plainPassword,
    });
  }

  if (toAddIds.length > 0) {
    const idStrings = toAddIds.map((id) => id.toString());
    await addStudentsToClass(classId, idStrings, centerId);
    await User.updateMany(
      { _id: { $in: toAddIds } },
      { $set: { classId: classObjectId, teacherId: teacherObjectId } },
    );
  }

  const createdCount = results.filter((r) => r.status === "created").length;
  const linkedCount = results.filter((r) => r.status === "linked").length;
  const errorCount = results.filter((r) => r.status === "error").length;

  return {
    total: results.length,
    createdCount,
    linkedCount,
    errorCount,
    results,
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
