import { Router } from "express"
import { sendSuccess } from "../utils/response"
import { getDBStatus } from "../config/db"

const router = Router()

router.get("/", (req, res) => {
  const uptime = process.uptime()
  sendSuccess(res, { uptime, services: { database: getDBStatus() } }, "ok")
})

export default router
