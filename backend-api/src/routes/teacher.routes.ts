import { Router } from "express";
import { requireTeacher } from "../middlewares/auth";
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
  deleteCommentHandler,
} from "../controllers/teacher.controller";
import {
  createTeacherClassHandler,
  listTeacherClassesHandler,
  getTeacherClassDetailHandler,
  deleteTeacherClassHandler,
  inviteStudentHandler,
  removeStudentFromClassHandler,
  classAnalyticsHandler,
  createTeacherAssignmentHandler,
  listTeacherAssignmentsHandler,
  getTeacherAssignmentHandler,
  updateTeacherAssignmentHandler,
  publishTeacherAssignmentHandler,
  closeTeacherAssignmentHandler,
  deleteTeacherAssignmentHandler,
  listTeacherAssignmentSubmissionsHandler,
  getSubmissionDetailHandler,
  reviewSubmissionHandler,
  teacherDashboardHandler,
} from "../controllers/teacherPortal.controller";

const router = Router();

// All routes require Teacher
router.use(requireTeacher);

// Dashboard
router.get("/dashboard", teacherDashboardHandler);

// Class management
router.post("/classes", createTeacherClassHandler);
router.get("/classes", listTeacherClassesHandler);
router.get("/classes/:classId", getTeacherClassDetailHandler);
router.delete("/classes/:classId", deleteTeacherClassHandler);
router.post("/classes/:classId/invite", inviteStudentHandler);
router.delete(
  "/classes/:classId/students/:studentId",
  removeStudentFromClassHandler,
);
router.get("/classes/:classId/analytics", classAnalyticsHandler);

// Assignment management
router.post("/assignments", createTeacherAssignmentHandler);
router.get("/assignments", listTeacherAssignmentsHandler);
router.get("/assignments/:id", getTeacherAssignmentHandler);
router.put("/assignments/:id", updateTeacherAssignmentHandler);
router.patch("/assignments/:id/publish", publishTeacherAssignmentHandler);
router.patch("/assignments/:id/close", closeTeacherAssignmentHandler);
router.delete("/assignments/:id", deleteTeacherAssignmentHandler);
router.get(
  "/assignments/:id/submissions",
  listTeacherAssignmentSubmissionsHandler,
);

// Submissions
router.get("/submissions/:submissionId", getSubmissionDetailHandler);
router.patch("/submissions/:submissionId/review", reviewSubmissionHandler);

// Legacy teacher endpoints (kept for backward compatibility)
router.get("/center/analytics", getStatsHandler); // Mobile calls /api/teacher/center/analytics
router.get("/stats", getStatsHandler);
router.get("/students", getStudentsHandler);
router.post("/students", addStudentHandler);
router.delete("/students/:id", removeStudentHandler);
router.get("/students/:id", getStudentDetailHandler);
router.get("/students/:id/essays", getStudentEssaysHandler);
router.get("/essays", getEssaysForTeacherHandler);
router.get("/essays/:id", getEssayForTeacherHandler);
router.post("/essays/:id/comment", addCommentHandler);
router.delete("/essays/:id/comment", deleteCommentHandler);

export default router;
