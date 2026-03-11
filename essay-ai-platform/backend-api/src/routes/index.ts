import { Router } from "express"
import healthRoutes from "./health.routes"
import essayRoutes from "./essay.routes"
import userRoutes from "./user.routes"
import uploadRoutes from "./upload.routes"
import paymentRoutes from "./payment.routes"
import authRoutes from "./auth.routes"
import teacherRoutes from "./teacher.routes"

const router = Router()

router.use("/health", healthRoutes)
router.use("/auth", authRoutes)
router.use("/teacher", teacherRoutes)
router.use("/essay", essayRoutes)
router.use("/user", userRoutes)
router.use("/upload", uploadRoutes)
router.use("/payment", paymentRoutes)

export default router
