import { Router } from "express"
import { sendSuccess } from "../utils/response"

const router = Router()

router.get("/profile", (req, res) => {
  sendSuccess(res, { user: "stub" }, "Profile endpoint stub")
})

export default router
