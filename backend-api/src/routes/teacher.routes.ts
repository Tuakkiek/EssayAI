import { Router } from "express"
import { requireTeacher } from "../middlewares/auth"
import {
  getStatsHandler,
  getStudentsHandler,
  addStudentHandler,
  removeStudentHandler,
  getStudentDetailHandler,
  getStudentEssaysHandler,
  getEssaysForTeacherHandler,
  getEssayForTeacherHandler,
  addCommentHandler,
  deleteCommentHandler
} from "../controllers/teacher.controller"

const router = Router()

// All routes require Teacher or Admin
router.use(requireTeacher)

// Stats
router.get("/center/analytics", getStatsHandler) // Mobile calls /api/teacher/center/analytics
router.get("/stats", getStatsHandler)

// Students
router.get("/students", getStudentsHandler)
router.post("/students", addStudentHandler)
router.delete("/students/:id", removeStudentHandler)
router.get("/students/:id", getStudentDetailHandler)
router.get("/students/:id/essays", getStudentEssaysHandler)

// Essays 
router.get("/essays", getEssaysForTeacherHandler)
router.get("/essays/:id", getEssayForTeacherHandler)
router.post("/essays/:id/comment", addCommentHandler)
router.delete("/essays/:id/comment", deleteCommentHandler)

export default router
