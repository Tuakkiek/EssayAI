import { Request, Response, NextFunction } from "express"
import { sendSuccess, sendBadRequest } from "../utils/response"
import * as teacherService from "../services/teacherService"
import { getProfile } from "../services/authService"

// Helper to get centerId
const getCenterId = async (req: Request): Promise<string> => {
  // If the user is a teacher, fetch their centerId
  const profile = await getProfile(req.user!.userId)
  if (!profile.centerId) {
    throw new Error("Teacher does not belong to any center")
  }
  return profile.centerId.toString()
}

export const getStatsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const centerId = await getCenterId(req)
    const stats = await teacherService.getCenterStats(centerId, req.user!.userId)
    sendSuccess(res, stats, "Teacher analytics retrieved")
  } catch (err) {
    next(err)
  }
}

export const getStudentsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const centerId = await getCenterId(req)
    const search = (req.query.search as string) || undefined
    const page = parseInt((req.query.page as string) || "1", 10)
    const limit = parseInt((req.query.limit as string) || "15", 10)

    const result = await teacherService.getCenterStudents(centerId, search, page, limit)
    sendSuccess(res, result, "Students retrieved")
  } catch (err) {
    next(err)
  }
}

export const addStudentHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const centerId = await getCenterId(req)
    const { email } = req.body
    if (!email) { sendBadRequest(res, "Email is required"); return }

    const user = await teacherService.addStudentToCenter(centerId, email)
    sendSuccess(res, { user }, "Student added to center")
  } catch (err) {
    next(err)
  }
}

export const removeStudentHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const centerId = await getCenterId(req)
    const studentId = req.params.id as string
    if (!studentId) { sendBadRequest(res, "Student ID is required"); return }

    await teacherService.removeStudentFromCenter(centerId, studentId)
    sendSuccess(res, null, "Student removed from center")
  } catch (err) {
    next(err)
  }
}

export const getStudentDetailHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const centerId = await getCenterId(req)
    const studentId = req.params.id as string
    if (!studentId) { sendBadRequest(res, "Student ID is required"); return }

    const result = await teacherService.getStudentDetail(studentId, centerId)
    sendSuccess(res, result, "Student details retrieved")
  } catch (err) {
    next(err)
  }
}

export const getStudentEssaysHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const centerId = await getCenterId(req)
    const studentId = req.params.id as string
    if (!studentId) { sendBadRequest(res, "Student ID is required"); return }

    const page = parseInt((req.query.page as string) || "1", 10)
    const limit = parseInt((req.query.limit as string) || "15", 10)

    const result = await teacherService.getEssaysForTeacher({ centerId, studentId, page, limit })
    sendSuccess(res, result, "Student essays retrieved")
  } catch (err) {
    next(err)
  }
}

export const getEssaysForTeacherHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const centerId = await getCenterId(req)
    const page = parseInt((req.query.page as string) || "1", 10)
    const limit = parseInt((req.query.limit as string) || "15", 10)
    const status = (req.query.status as string) || undefined
    const reviewed = (req.query.reviewed as string) || undefined
    const isReviewedByTeacher = reviewed === "true" ? true : reviewed === "false" ? false : undefined

    const result = await teacherService.getEssaysForTeacher({ centerId, status, isReviewedByTeacher, page, limit })
    sendSuccess(res, result, "Center essays retrieved")
  } catch (err) {
    next(err)
  }
}

export const getEssayForTeacherHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const centerId = await getCenterId(req)
    const essayId = req.params.id as string
    if (!essayId) { sendBadRequest(res, "Essay ID is required"); return }

    const result = await teacherService.getEssayForTeacher(essayId, centerId)
    sendSuccess(res, { essay: result }, "Essay retrieved")
  } catch (err) {
    next(err)
  }
}

export const addCommentHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const centerId = await getCenterId(req)
    const essayId = req.params.id as string
    const { comment } = req.body
    
    if (!essayId) { sendBadRequest(res, "Essay ID is required"); return }
    if (!comment) { sendBadRequest(res, "Comment text is required"); return }

    const result = await teacherService.addTeacherComment({
      essayId, centerId, teacherId: req.user!.userId, teacherName: req.user!.email, comment
    })
    sendSuccess(res, { essay: result }, "Comment added")
  } catch (err) {
    next(err)
  }
}

export const deleteCommentHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const centerId = await getCenterId(req)
    const essayId = req.params.id as string
    if (!essayId) { sendBadRequest(res, "Essay ID is required"); return }

    await teacherService.deleteTeacherComment(essayId, centerId, req.user!.userId)
    sendSuccess(res, null, "Comment deleted")
  } catch (err) {
    next(err)
  }
}
