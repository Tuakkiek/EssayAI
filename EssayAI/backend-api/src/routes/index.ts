import { Router } from "express";
import healthRoutes from "./health.routes";
import essayRoutes from "./essay.routes";
import userRoutes from "./user.routes";
import updateRoutes from "./upload.routes";
import authRoutes from "./auth.routes";
import teacherRoutes from "./teacher.routes";
import improvementRoutes from "./improvement.routes";
import studentRoutes from "./student.routes";
import classRoutes from "./class.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
// Support both singular and plural base paths for essays.
router.use("/essay", essayRoutes);
router.use("/essays", essayRoutes);
router.use("/user", userRoutes);
router.use("/teacher", teacherRoutes);
router.use("/upload", updateRoutes);
router.use("/improvement", improvementRoutes);
router.use("/students", studentRoutes);
router.use("/classes", classRoutes);

export default router;
