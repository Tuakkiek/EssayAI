import mongoose from "mongoose"
import { env } from "./env"
import { logger } from "../utils/logger"

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error"

let status: ConnectionStatus = "disconnected"

export const getDBStatus = (): ConnectionStatus => status

const connectDB = async (): Promise<void> => {
  if (!env.MONGODB_URI) {
    logger.warn("MONGODB_URI not set — skipping DB connection")
    status = "error"
    return
  }

  status = "connecting"
  logger.info("Connecting to MongoDB...")

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    })
    status = "connected"
    logger.info("✅ MongoDB connected")
  } catch (error) {
    status = "error"
    logger.error("❌ MongoDB connection failed", error)
    // Don't crash — let the app run, health check will report it
  }

  mongoose.connection.on("disconnected", () => {
    status = "disconnected"
    logger.warn("MongoDB disconnected")
  })

  mongoose.connection.on("reconnected", () => {
    status = "connected"
    logger.info("MongoDB reconnected")
  })
}

export default connectDB
