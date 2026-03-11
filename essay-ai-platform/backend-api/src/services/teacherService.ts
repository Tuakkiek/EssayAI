import mongoose from "mongoose"
import { Essay, User } from "../models/index"
import { IEssay } from "../models/Essay"
import { AppError } from "../middlewares/errorHandler"
import { logger } from "../utils/logger"

// ── Student essay list (for teacher review) ───────────────────────
export interface TeacherEssayQuery {
  centerId:             string
  studentId?:           string
  status?:              string
  isReviewedByTeacher?: boolean
  page?:                number
  limit?:               number
}

export interface EssayListResult {
  essays: unknown[]
  pagination: {
    total:       number
    page:        number
    limit:       number
    totalPages:  number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export const getEssaysForTeacher = async (query: TeacherEssayQuery): Promise<EssayListResult> => {
  const { centerId, studentId, status, isReviewedByTeacher, page = 1, limit = 15 } = query
  const skip = (page - 1) * limit

  const filter: Record<string, unknown> = {
    centerId: new mongoose.Types.ObjectId(centerId),
  }
  if (studentId)           filter["userId"]              = new mongoose.Types.ObjectId(studentId)
  if (status)              filter["status"]              = status
  if (isReviewedByTeacher !== undefined)
                           filter["isReviewedByTeacher"] = isReviewedByTeacher

  const [essays, total] = await Promise.all([
    Essay.find(filter)
      .populate("userId", "name email avatarUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-essayText")   // omit full text in list view
      .lean(),
    Essay.countDocuments(filter),
  ])

  return {
    essays,
    pagination: {
      total,
      page,
      limit,
      totalPages:  Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  }
}

// ── Get full essay for teacher review ────────────────────────────
export const getEssayForTeacher = async (
  essayId:  string,
  centerId: string
): Promise<IEssay> => {
  const essay = await Essay.findOne({
    _id:      new mongoose.Types.ObjectId(essayId),
    centerId: new mongoose.Types.ObjectId(centerId),
  }).populate("userId", "name email avatarUrl stats")

  if (!essay) throw new AppError("Essay not found in your center", 404)
  return essay
}

// ── Add or update teacher comment ─────────────────────────────────
export interface AddCommentInput {
  essayId:     string
  centerId:    string
  teacherId:   string
  teacherName: string
  comment:     string
}

export const addTeacherComment = async (input: AddCommentInput): Promise<IEssay> => {
  const { essayId, centerId, teacherId, teacherName, comment } = input

  const essay = await Essay.findOne({
    _id:      new mongoose.Types.ObjectId(essayId),
    centerId: new mongoose.Types.ObjectId(centerId),
  })
  if (!essay) throw new AppError("Essay not found in your center", 404)

  essay.teacherComment = {
    teacherId:   new mongoose.Types.ObjectId(teacherId),
    teacherName,
    comment:     comment.trim(),
    createdAt:   new Date(),
    updatedAt:   new Date(),
  }
  essay.isReviewedByTeacher = true
  await essay.save()

  logger.info("Teacher comment added", { essayId, teacherId })
  return essay
}

// ── Delete teacher comment ────────────────────────────────────────
export const deleteTeacherComment = async (
  essayId:   string,
  centerId:  string,
  teacherId: string
): Promise<void> => {
  const essay = await Essay.findOne({
    _id:      new mongoose.Types.ObjectId(essayId),
    centerId: new mongoose.Types.ObjectId(centerId),
  })
  if (!essay) throw new AppError("Essay not found in your center", 404)

  if (!essay.teacherComment) throw new AppError("No comment to delete", 404)

  if (essay.teacherComment.teacherId.toString() !== teacherId) {
    throw new AppError("You can only delete your own comments", 403)
  }

  essay.teacherComment      = undefined
  essay.isReviewedByTeacher = false
  await essay.save()
  logger.info("Teacher comment deleted", { essayId, teacherId })
}

// ── Student detail for teacher ────────────────────────────────────
export interface StudentDetail {
  student: {
    _id:         string
    name:        string
    email:       string
    avatarUrl:   string | null
    stats:       { essaysSubmitted: number; averageScore: number; lastActiveAt?: Date }
    subscription:{ plan: string; isActive: boolean }
  }
  recentEssays:  unknown[]
  scoreTimeline: { date: string; score: number }[]
  totalReviewed: number
  pendingReviews:number
}

export const getStudentDetail = async (
  studentId: string,
  centerId:  string
): Promise<StudentDetail> => {
  const student = await User.findOne({
    _id:      new mongoose.Types.ObjectId(studentId),
    centerId: new mongoose.Types.ObjectId(centerId),
  }).select("name email avatarUrl stats subscription")

  if (!student) throw new AppError("Student not found in your center", 404)

  const cid = new mongoose.Types.ObjectId(centerId)
  const uid = new mongoose.Types.ObjectId(studentId)

  const [recentEssays, scoreTimeline, totalReviewed, pendingReviews] = await Promise.all([
    Essay.find({ userId: uid, centerId: cid })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("prompt score taskType wordCount status isReviewedByTeacher createdAt")
      .lean(),

    Essay.find({ userId: uid, centerId: cid, status: "scored", score: { $ne: null } })
      .sort({ createdAt: 1 })
      .select("score createdAt")
      .lean()
      .then((docs) => docs.map((d) => ({
        date:  (d.createdAt as Date).toISOString().slice(0, 10),
        score: d.score as number,
      }))),

    Essay.countDocuments({ userId: uid, centerId: cid, isReviewedByTeacher: true }),
    Essay.countDocuments({ userId: uid, centerId: cid, status: "scored", isReviewedByTeacher: false }),
  ])

  return {
    student: {
      _id:         (student._id as mongoose.Types.ObjectId).toString(),
      name:        student.name,
      email:       student.email,
      avatarUrl:   student.avatarUrl ?? null,
      stats:       student.stats,
      subscription:{ plan: student.subscription.plan, isActive: student.subscription.isActive },
    },
    recentEssays,
    scoreTimeline,
    totalReviewed,
    pendingReviews,
  }
}

// ── Teacher Stats & Students (Appended) ───────────────────────────
export interface CenterStats {
  center: { name: string; logoUrl?: string; studentCount: number }
  totalStudents: number
  totalEssays: number
  averageScore: number
  pendingReviews: number
  recentActivity: { date: string; count: number }[]
  scoreDistribution: { band: string; count: number }[]
  topStudents: { name: string; averageScore: number; essaysSubmitted: number }[]
}

export const getCenterStats = async (centerId: string, teacherId: string): Promise<CenterStats> => {
  const cid = new mongoose.Types.ObjectId(centerId)
  const [
    center,
    totalStudents,
    totalEssays,
    pendingReviews,
    avgResult,
    recentActivityRes,
    scoreDistRes,
    topStudentsRes
  ] = await Promise.all([
    mongoose.model("Center").findById(centerId).select("name logoUrl studentCount"),
    User.countDocuments({ centerId: cid, role: "student" }),
    Essay.countDocuments({ centerId: cid }),
    Essay.countDocuments({ centerId: cid, status: "scored", isReviewedByTeacher: false }),
    Essay.aggregate([
      { $match: { centerId: cid, status: "scored", "score": { $ne: null } } },
      { $group: { _id: null, avgScore: { $avg: "$score" } } }
    ]),
    // recent 7 days activity
    Essay.aggregate([
      { $match: { centerId: cid, createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
      } },
      { $sort: { _id: 1 } }
    ]),
    Essay.aggregate([
      { $match: { centerId: cid, status: "scored", "score": { $ne: null } } },
      { $group: {
          _id: "$score",
          count: { $sum: 1 }
      } },
      { $sort: { _id: -1 } }
    ]),
    User.find({ centerId: cid, role: "student" })
      .sort({ "stats.averageScore": -1 })
      .limit(5)
      .select("name stats")
      .lean()
  ])

  if (!center) throw new AppError("Center not found", 404)

  const avgScore = avgResult.length > 0 ? avgResult[0].avgScore : 0
  const recentActivity = recentActivityRes.map(x => ({ date: x._id as string, count: x.count as number }))
  const scoreDistribution = scoreDistRes.map(x => ({ band: String(x._id), count: x.count as number }))
  const topStudents = topStudentsRes.map(u => ({
    name: u.name,
    averageScore: u.stats?.averageScore || 0,
    essaysSubmitted: u.stats?.essaysSubmitted || 0
  }))

  return {
    center: { name: center.name, logoUrl: center.logoUrl, studentCount: center.studentCount },
    totalStudents,
    totalEssays,
    averageScore: avgScore,
    pendingReviews,
    recentActivity,
    scoreDistribution,
    topStudents
  }
}

export const getCenterStudents = async (centerId: string, search?: string, page = 1, limit = 15) => {
  const skip = (page - 1) * limit
  const query: any = { centerId: new mongoose.Types.ObjectId(centerId), role: "student" }
  if (search) {
    query.$or = [
      { name: new RegExp(search, "i") },
      { email: new RegExp(search, "i") }
    ]
  }

  const [students, total] = await Promise.all([
    User.find(query)
      .select("name email avatarUrl stats createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query)
  ])

  return {
    students,
    pagination: {
      total, page, limit, totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total, hasPrevPage: page > 1
    }
  }
}

export const addStudentToCenter = async (centerId: string, email: string) => {
  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) throw new AppError("User not found", 404)
  if (user.role !== "student") throw new AppError("Only students can be added to center", 400)
  if (user.centerId?.toString() === centerId) return user // already added
  
  user.centerId = new mongoose.Types.ObjectId(centerId)
  await user.save()
  logger.info("Student added to center", { studentId: user._id, centerId })
  return user
}

export const removeStudentFromCenter = async (centerId: string, studentId: string) => {
  const user = await User.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(studentId), centerId: new mongoose.Types.ObjectId(centerId) },
    { $set: { centerId: null } }
  )
  if (!user) throw new AppError("Student not found in this center", 404)
  logger.info("Student removed from center", { studentId, centerId })
}
