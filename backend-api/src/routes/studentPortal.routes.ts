import { Router } from "express";
import { requireStudent } from "../middlewares/auth";
import {
  joinClassHandler,
  myClassHandler,
  listStudentAssignmentsHandler,
  getStudentAssignmentHandler,
  submitAssignmentHandler,
} from "../controllers/studentPortal.controller";

const router = Router();

router.use(requireStudent);

router.post("/join-class", joinClassHandler);
router.get("/my-class", myClassHandler);
router.get("/assignments", listStudentAssignmentsHandler);
router.get("/assignments/:id", getStudentAssignmentHandler);
router.post("/assignments/:id/submit", submitAssignmentHandler);

export default router;
