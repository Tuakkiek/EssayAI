import { Router } from "express"
import { requireAuth } from "../middlewares/auth"
import {
  registerHandler,
  loginHandler,
  studentLoginHandler,
  registerSelfStudentHandler,
  getMeHandler,
  changePasswordHandler,
} from "../controllers/auth.controller"

const router = Router()

// ── Public ─────────────────────────────────────────────────────────────
// Register a new training center (creates center_admin user + center)
router.post("/register", registerHandler)

// Login for center_admin and teacher (email + password)
router.post("/login", loginHandler)

// Login for center-based students (phone + password + centerId)
router.post("/student/login", studentLoginHandler)

// Self-registration for independent students (email + password, no center needed)
// Self-registered students also log in via POST /login (same email+password flow)
router.post("/register/student", registerSelfStudentHandler)

// ── Protected ──────────────────────────────────────────────────────────
router.get( "/me",              requireAuth, getMeHandler)
router.post("/change-password", requireAuth, changePasswordHandler)

export default router
