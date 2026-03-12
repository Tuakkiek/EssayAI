import { Request, Response, NextFunction } from "express"
import { sendSuccess, sendBadRequest } from "../utils/response"
import * as improvementService from "../services/improvementService"

export const rewriteEssayHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { essayId } = req.body
    if (!essayId) { sendBadRequest(res, "essayId is required"); return }

    const result = await improvementService.rewriteEssay(essayId, req.user!.userId)
    sendSuccess(res, result, "Essay rewritten successfully")
  } catch (error) {
    next(error)
  }
}

export const enhanceVocabularyHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { essayId } = req.body
    if (!essayId) { sendBadRequest(res, "essayId is required"); return }

    const result = await improvementService.enhanceVocabulary(essayId, req.user!.userId)
    sendSuccess(res, result, "Vocabulary assessment completed")
  } catch (error) {
    next(error)
  }
}

export const explainGrammarHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { essayId } = req.body
    if (!essayId) { sendBadRequest(res, "essayId is required"); return }

    const result = await improvementService.explainGrammar(essayId, req.user!.userId)
    sendSuccess(res, result, "Grammar explanation completed")
  } catch (error) {
    next(error)
  }
}

export const getProgressHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await improvementService.getProgressData(req.user!.userId)
    sendSuccess(res, result, "Progress data retrieved")
  } catch (error) {
    next(error)
  }
}
