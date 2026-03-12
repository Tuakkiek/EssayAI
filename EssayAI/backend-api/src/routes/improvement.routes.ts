import { Router } from "express"
import * as improvementController from "../controllers/improvement.controller"
import { requireAuth } from "../middlewares/auth"

const router = Router()

router.use(requireAuth)

router.post("/rewrite", improvementController.rewriteEssayHandler)
router.post("/vocabulary", improvementController.enhanceVocabularyHandler)
router.post("/grammar", improvementController.explainGrammarHandler)
router.get("/progress", improvementController.getProgressHandler)

export default router
