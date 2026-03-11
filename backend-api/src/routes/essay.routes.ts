import { Router } from "express"
import { validate } from "../middlewares/validate"
import {
  scoreEssay,
  createEssayHandler,
  getEssayHistory,
  getEssayStats,
  getEssayByIdHandler,
  deleteEssayHandler,
} from "../controllers/essay.controller"

const router = Router()

// POST /api/essay/score  — AI scoring (must be before /:id)
router.post(
  "/score",
  validate([
    { field: "essayText", required: true, type: "string", minLength: 50, maxLength: 5000 },
    { field: "prompt", required: false, type: "string" },
  ]),
  scoreEssay
)

// GET /api/essay/history?userId=&page=&limit=&status=&taskType=&sortBy=&sortOrder=&fromDate=&toDate=
router.get("/history", getEssayHistory)

// GET /api/essay/stats?userId=
router.get("/stats", getEssayStats)

// POST /api/essay  — save essay without scoring
router.post(
  "/",
  validate([
    { field: "prompt",    required: true,  type: "string", minLength: 5 },
    { field: "essayText", required: true,  type: "string", minLength: 50, maxLength: 10000 },
    { field: "userId",    required: true,  type: "string" },
  ]),
  createEssayHandler
)

// GET  /api/essay/:id?userId=   (userId scopes result to the owner)
router.get("/:id", getEssayByIdHandler)

// DELETE /api/essay/:id?userId=
router.delete("/:id", deleteEssayHandler)

export default router
