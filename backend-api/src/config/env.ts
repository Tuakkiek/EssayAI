import dotenv from "dotenv";

dotenv.config();

const requiredVars = ["MONGODB_URI"] as const;

export const validateEnv = (): void => {
  const missing = requiredVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.warn(`⚠️  Missing env vars: ${missing.join(", ")}`);
    console.warn("   Copy .env.example → .env and fill in values");
  }
};

export const env = {
  PORT: parseInt(process.env.PORT || "5000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",

  MONGODB_URI: process.env.MONGODB_URI || "",

  // Google AI Studio (Gemini)
  GOOGLE_AI_API_KEY:
    process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "",
  GOOGLE_AI_MODEL: process.env.GOOGLE_AI_MODEL || "gemini-1.5-flash",

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
  CLOUDINARY_REVIEW_IMAGE_PRESET:
    process.env.CLOUDINARY_REVIEW_IMAGE_PRESET || "",
  CLOUDINARY_VIDEO_PRESET: process.env.CLOUDINARY_VIDEO_PRESET || "",
  CLOUDINARY_THUMBNAIL_PRESET: process.env.CLOUDINARY_THUMBNAIL_PRESET || "",
  REVIEW_BASE64_GRACE_UNTIL: process.env.REVIEW_BASE64_GRACE_UNTIL || "",

  // Sepay — matching your actual .env keys
  SEPAY_API_TOKEN: process.env.SEPAY_API_TOKEN || "", // Bearer token for Sepay API
  SEPAY_BANK_ACCOUNT: process.env.SEPAY_BANK_ACCOUNT || "", // e.g. 70740011223344
  SEPAY_BANK_ID: process.env.SEPAY_BANK_ID || "", // e.g. MBBank
  SEPAY_ACCOUNT_NAME: process.env.SEPAY_ACCOUNT_NAME || "", // e.g. NGUYEN TUAN KIET
  SEPAY_QR_BASE_URL: process.env.SEPAY_QR_BASE_URL || "https://qr.sepay.vn/img",
  SEPAY_PAYMENT_TTL_MINUTES: parseInt(
    process.env.SEPAY_PAYMENT_TTL_MINUTES || "15",
    10,
  ),
  SEPAY_WEBHOOK_SECRET: process.env.SEPAY_WEBHOOK_SECRET || "change_me",

  // JWT (for auth — Phase 8)
  JWT_SECRET: process.env.JWT_SECRET || "change_me_in_production",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  // App URLs
  APP_URL: process.env.APP_URL || "http://localhost:5000",
  WEBHOOK_URL:
    process.env.WEBHOOK_URL || "http://localhost:5000/api/payment/webhook",
} as const;
