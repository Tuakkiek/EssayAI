import express from "express";
import cors from "cors";
import { env, validateEnv } from "./config/env";
import { requestLogger } from "./middlewares/requestLogger";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { logger } from "./utils/logger";
import routes from "./routes/index";
import { initCloudinary } from "./config/cloudinary";
import connectDB from "./config/db";

// Validate environment variables on startup
validateEnv();

// Connect to MongoDB
connectDB();

initCloudinary();

const app = express();

// ── Core middlewares ────────────────────────────────────────────────
app.use(cors());
app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf.toString();
    },
  }),
);
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// ── API routes ──────────────────────────────────────────────────────
app.use("/api", routes);

// Legacy root health check (backwards compat)
app.get("/health", (_req, res) => {
  res.redirect("/api/health");
});

// ── Error handling ──────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start server ────────────────────────────────────────────────────
app.listen(env.PORT, () => {
  logger.info(`🚀 Server running on port ${env.PORT}`);
  logger.info(`   Environment : ${env.NODE_ENV}`);
  logger.info(`   Health check: http://localhost:${env.PORT}/api/health`);
});

export default app;
