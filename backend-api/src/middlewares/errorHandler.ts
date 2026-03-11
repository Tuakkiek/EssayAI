import { Request, Response, NextFunction } from "express"
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

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = "statusCode" in err ? err.statusCode : 500
  const message = err.message || "Internal Server Error"

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
