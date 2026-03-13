import { Request, Response, NextFunction } from "express"
import mongoose from "mongoose"
import { logger } from "../utils/logger"
import { env } from "../config/env"

export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode = 500) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

const formatDuplicateKey = (rawKey?: string): string | null => {
  if (!rawKey) return null
  const cleaned = rawKey
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
  if (!cleaned) return null
  return `${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}`
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = "statusCode" in err ? err.statusCode : 500
  let message = err.message || "Internal Server Error"

  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400
    const messages = Object.values(err.errors).map((e) => e.message)
    if (messages.length > 0) message = messages.join(", ")
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400
    message = `Invalid ${err.path}`
  } else if ((err as any)?.name === "MongoServerError" && (err as any)?.code === 11000) {
    statusCode = 409
    const key = Object.keys((err as any)?.keyValue ?? {})[0]
    const label = formatDuplicateKey(key)
    message = label ? `${label} already exists` : "Duplicate key"
  }

  logger.error(`${req.method} ${req.originalUrl} — ${message}`, {
    statusCode,
    stack: env.isProduction ? undefined : err.stack,
  })

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.isProduction ? {} : { stack: err.stack }),
  })
}

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  })
}
