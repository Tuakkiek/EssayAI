import { Router } from "express"
import { requireAuth } from "../middlewares/auth"
import {
  registerHandler,
  loginHandler,
  registerSelfStudentHandler,
  getMeHandler,
  changePasswordHandler,
} from "../controllers/auth.controller"

const router = Router()

// ── Public ─────────────────────────────────────────────────────────────
// Register a new user (teacher or free_student)
router.post("/register", registerHandler)

// Login for all roles (email + password)
router.post("/login", loginHandler)

// Deprecated: self-registration legacy endpoint
router.post("/register/student", registerSelfStudentHandler)

// ── Protected ──────────────────────────────────────────────────────────
router.get( "/me",              requireAuth, getMeHandler)
router.post("/change-password", requireAuth, changePasswordHandler)

export default router
