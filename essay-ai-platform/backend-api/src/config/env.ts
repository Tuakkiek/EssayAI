import dotenv from "dotenv"

dotenv.config()

const requiredVars = ["MONGODB_URI"] as const

export const validateEnv = (): void => {
  const missing = requiredVars.filter((key) => !process.env[key])
  if (missing.length > 0) {
    console.warn(`⚠️  Missing env vars: ${missing.join(", ")}`)
    console.warn("   Copy .env.example → .env and fill in values")
  }
}

export const env = {
  PORT: parseInt(process.env.PORT || "5000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",

  MONGODB_URI: process.env.MONGODB_URI || "",

  TOGETHER_API_KEY: process.env.TOGETHER_API_KEY || "",
  TOGETHER_MODEL: process.env.TOGETHER_MODEL || "mistralai/Mistral-7B-Instruct-v0.2",

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",

  SEPAY_API_TOKEN: process.env.SEPAY_API_TOKEN || "",
  SEPAY_PAYMENT_TTL_MINUTES: parseInt(process.env.SEPAY_PAYMENT_TTL_MINUTES || "1440", 10),
  SEPAY_BANK_ID: process.env.SEPAY_BANK_ID || "",
  SEPAY_BANK_ACCOUNT: process.env.SEPAY_BANK_ACCOUNT || "",
  SEPAY_ACCOUNT_NAME: process.env.SEPAY_ACCOUNT_NAME || "",
  SEPAY_QR_BASE_URL: process.env.SEPAY_QR_BASE_URL || "https://qr.sepay.vn/img",

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || "change_me_in_production",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  // App URLs
  APP_URL: process.env.APP_URL || "http://localhost:5000",
  WEBHOOK_URL: process.env.WEBHOOK_URL || "http://localhost:5000/api/payment/webhook",
} as const
