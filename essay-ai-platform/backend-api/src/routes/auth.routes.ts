import { Router } from "express"
import { requireAuth } from "../middlewares/auth"
import { registerHandler, loginHandler, getMeHandler, changePasswordHandler } from "../controllers/auth.controller"

const router = Router()

router.post("/register", registerHandler)
router.post("/login", loginHandler)
router.get("/me", requireAuth, getMeHandler)
router.post("/change-password", requireAuth, changePasswordHandler)

export default router
