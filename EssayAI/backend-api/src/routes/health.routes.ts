import { Router } from "express"
import { sendSuccess } from "../utils/response"
import { getDBStatus } from "../config/db"
import { checkAIServiceHealth } from "../services/aiService"

const router = Router()

router.get("/", (req, res) => {
  const uptime = process.uptime()
  sendSuccess(res, { uptime, services: { database: getDBStatus(), googleAI: checkAIServiceHealth() } }, "ok")
})

export default router
