import { Router } from "express";
import healthRoutes from "./health.routes";
import essayRoutes from "./essay.routes";
import userRoutes from "./user.routes";
import updateRoutes from "./upload.routes";
import paymentRoutes from "./payment.routes";
import authRoutes from "./auth.routes";
import teacherRoutes from "./teacher.routes";
import improvementRoutes from "./improvement.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/essay", essayRoutes);
router.use("/user", userRoutes);
router.use("/teacher", teacherRoutes);
router.use("/upload", updateRoutes);
router.use("/payment", paymentRoutes);
router.use("/improvement", improvementRoutes);

export default router;
