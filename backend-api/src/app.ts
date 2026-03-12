/**
 * app.ts
 * Express application factory — wires all routes from Phases 0-7.
 * Exported as a factory so tests can create isolated instances.
 */

import express, { Application, Request, Response, NextFunction } from "express"
import helmet      from "helmet"
import cors        from "cors"
import rateLimit   from "express-rate-limit"

import authRoutes         from "./routes/auth.routes"
import studentRoutes      from "./routes/student.routes"
import classRoutes        from "./routes/class.routes"
import assignmentRoutes   from "./routes/assignment.routes"
import essayRoutes        from "./routes/essay.routes"
import subscriptionRoutes from "./routes/subscription.routes"
import adminRoutes        from "./routes/admin.routes"

import { errorHandler } from "./middlewares/errorHandler"

export const createApp = (): Application => {
  const app = express()

  // ── Security headers ──────────────────────────────────────────────
  app.use(helmet())
  app.use(cors({
    origin:      process.env.CORS_ORIGINS?.split(",") ?? "*",
    credentials: true,
  }))

  // ── Rate limiting ─────────────────────────────────────────────────
  app.use("/api/auth", rateLimit({
    windowMs: 15 * 60_000,   // 15 min
    max:      20,
    message:  { success: false, message: "Too many auth requests. Try again in 15 minutes." },
  }))

  // Sepay webhook gets its own limit (Sepay retries on failure)
  app.use("/api/subscription/webhook", rateLimit({
    windowMs: 60_000,
    max:      60,
  }))

  // General API limit
  app.use("/api", rateLimit({
    windowMs: 60_000,   // 1 min
    max:      200,
  }))

  // ── Body parsing ──────────────────────────────────────────────────
  // NOTE: webhook route must receive raw body for signature verification
  app.use("/api/subscription/webhook/sepay",
    express.json({ verify: (req: any, _res, buf) => { req.rawBody = buf } })
  )
  app.use(express.json({ limit: "2mb" }))
  app.use(express.urlencoded({ extended: true }))

  // ── Health check ──────────────────────────────────────────────────
  app.get("/health", (_req, res) => res.json({ status: "ok", ts: Date.now() }))

  // ── API routes (all prefixed /api) ────────────────────────────────
  app.use("/api/auth",         authRoutes)
  app.use("/api/students",     studentRoutes)
  app.use("/api/classes",      classRoutes)
  app.use("/api/assignments",  assignmentRoutes)
  app.use("/api/essays",       essayRoutes)
  app.use("/api/subscription", subscriptionRoutes)
  app.use("/api/admin",        adminRoutes)

  // ── 404 handler ───────────────────────────────────────────────────
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ success: false, message: "Route not found" })
  })

  // ── Global error handler ──────────────────────────────────────────
  app.use(errorHandler)

  return app
}
