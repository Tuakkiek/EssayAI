import { Request, Response, NextFunction } from "express"
import { sendBadRequest } from "../utils/response"

type ValidationRule = {
  field: string
  required?: boolean
  type?: "string" | "number" | "boolean"
  minLength?: number
  maxLength?: number
}

export const validate =
  (rules: ValidationRule[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const body = req.body as Record<string, unknown>

    for (const rule of rules) {
      const value = body[rule.field]

      if (rule.required && (value === undefined || value === null || value === "")) {
        sendBadRequest(res, `Field "${rule.field}" is required`)
        return
      }

      if (value !== undefined && rule.type && typeof value !== rule.type) {
        sendBadRequest(res, `Field "${rule.field}" must be of type ${rule.type}`)
        return
      }

      if (rule.type === "string" && typeof value === "string") {
        if (rule.minLength && value.length < rule.minLength) {
          sendBadRequest(res, `Field "${rule.field}" must be at least ${rule.minLength} characters`)
          return
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          sendBadRequest(res, `Field "${rule.field}" must be at most ${rule.maxLength} characters`)
          return
        }
      }
    }

    next()
  }
