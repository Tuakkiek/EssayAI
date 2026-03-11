import { env } from "../config/env"

type LogLevel = "info" | "warn" | "error" | "debug"

const colors: Record<LogLevel, string> = {
  info: "\x1b[36m",   // cyan
  warn: "\x1b[33m",   // yellow
  error: "\x1b[31m",  // red
  debug: "\x1b[35m",  // magenta
}
const reset = "\x1b[0m"

const log = (level: LogLevel, message: string, meta?: unknown): void => {
  if (level === "debug" && env.isProduction) return

  const timestamp = new Date().toISOString()
  const color = colors[level]
  const prefix = `${color}[${level.toUpperCase()}]${reset}`
  const output = meta
    ? `${prefix} ${timestamp} — ${message} ${JSON.stringify(meta)}`
    : `${prefix} ${timestamp} — ${message}`

  if (level === "error") {
    console.error(output)
  } else {
    console.log(output)
  }
}

export const logger = {
  info: (msg: string, meta?: unknown) => log("info", msg, meta),
  warn: (msg: string, meta?: unknown) => log("warn", msg, meta),
  error: (msg: string, meta?: unknown) => log("error", msg, meta),
  debug: (msg: string, meta?: unknown) => log("debug", msg, meta),
}
