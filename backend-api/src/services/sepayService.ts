import crypto from "crypto"
import { env } from "../config/env"
import { logger } from "../utils/logger"
import { SubscriptionPlan } from "../models/User"
import { PLANS } from "../constants/plans"

// ── Reference code generator ──────────────────────────────────────
// Format: ESSAY<PLAN><8-DIGIT-TIMESTAMP><4-CHAR-USER-SUFFIX>
// e.g. "ESSAYPRO12345678AB12" — embedded in bank transfer description
export const generateReferenceCode = (plan: SubscriptionPlan, userId: string): string => {
  const planCode   = plan.toUpperCase().slice(0, 3)
  const timestamp  = Date.now().toString().slice(-8)
  const userSuffix = userId.replace(/[^A-Z0-9]/gi, "").slice(-4).toUpperCase().padEnd(4, "0")
  return `ESSAY${planCode}${timestamp}${userSuffix}`
}

// ── Bank transfer instructions ────────────────────────────────────
export interface BankTransferInstructions {
  bankId:        string
  bankAccount:   string
  accountName:   string
  amountVND:     number
  description:   string      // Exact text user must put in transfer memo
  referenceCode: string
  qrCodeUrl:     string      // Sepay QR image URL
  expiresAt:     string      // ISO — payment window
}

export const createTransferInstructions = (
  plan:          SubscriptionPlan,
  userId:        string,
  referenceCode: string
): BankTransferInstructions => {
  const planConfig = PLANS[plan]
  const ttlMs      = env.SEPAY_PAYMENT_TTL_MINUTES * 60 * 1000
  const expiresAt  = new Date(Date.now() + ttlMs).toISOString()

  // Sepay QR URL — renders a scannable VietQR image
  // https://sepay.vn/huong-dan-tao-ma-qr-code-chuyen-khoan.html
  const qrCodeUrl = buildSepayQRUrl({
    bankId:        env.SEPAY_BANK_ID      || "MBBank",
    bankAccount:   env.SEPAY_BANK_ACCOUNT || "",
    amount:        planConfig.priceVND,
    description:   referenceCode,
    accountName:   env.SEPAY_ACCOUNT_NAME || "ESSAY AI",
  })

  return {
    bankId:        env.SEPAY_BANK_ID      || "MBBank",
    bankAccount:   env.SEPAY_BANK_ACCOUNT || "",
    accountName:   env.SEPAY_ACCOUNT_NAME || "ESSAY AI",
    amountVND:     planConfig.priceVND,
    description:   referenceCode,
    referenceCode,
    qrCodeUrl,
    expiresAt,
  }
}

// ── Sepay QR URL builder ──────────────────────────────────────────
// Pattern: https://qr.sepay.vn/img?acc=<account>&bank=<bankId>&amount=<amt>&des=<desc>
const buildSepayQRUrl = ({
  bankId,
  bankAccount,
  amount,
  description,
  accountName,
}: {
  bankId:      string
  bankAccount: string
  amount:      number
  description: string
  accountName: string
}): string => {
  const base   = env.SEPAY_QR_BASE_URL || "https://qr.sepay.vn/img"
  const params = new URLSearchParams({
    acc:  bankAccount,
    bank: bankId,
    amount: String(amount),
    des:  description,
    template: "compact",
  })
  return `${base}?${params.toString()}`
}

// ── Webhook payload from Sepay ────────────────────────────────────
export interface SepayWebhookPayload {
  id:             number
  gateway:        string       // Bank ID e.g. "MBBank"
  transactionDate: string
  accountNumber:  string
  code:           string | null
  content:        string       // Transfer description — contains our reference code
  transferType:   "in" | "out"
  description:    string
  transferAmount: number
  referenceCode:  string
  accumulated:    number
  subAccount:     string | null
}

// ── Webhook signature verification ───────────────────────────────
// Sepay uses HMAC-SHA256 of the raw request body
// Header: X-Sepay-Signature
export const verifyWebhookSignature = (
  rawBody:   string,
  signature: string
): boolean => {
  // If no token configured, allow in dev mode
  if (!env.SEPAY_API_TOKEN) {
    logger.warn("SEPAY_API_TOKEN not set — skipping webhook signature check (dev mode)")
    return true
  }

  try {
    const expected = crypto
      .createHmac("sha256", env.SEPAY_API_TOKEN)
      .update(rawBody)
      .digest("hex")

    // Pad both to same length before timingSafeEqual
    const a = Buffer.from(signature.padEnd(64, "0").slice(0, 64), "hex")
    const b = Buffer.from(expected.padEnd(64, "0").slice(0, 64),  "hex")
    return crypto.timingSafeEqual(a, b)
  } catch {
    logger.warn("Webhook signature check threw", { signature })
    return false
  }
}

// ── Extract reference code from transfer description ──────────────
export const extractReferenceCode = (description: string): string | null => {
  if (!description) return null
  // Matches ESSAY + 3 alpha + 8 digits + 4 alphanum (e.g. ESSAYPRO12345678AB12)
  const match = description.match(/ESSAY[A-Z]{3}\d{8}[A-Z0-9]{4}/i)
  return match ? match[0].toUpperCase() : null
}

// ── Validate transfer amount ──────────────────────────────────────
export const validateTransferAmount = (
  received:  number,
  expected:  number,
  tolerance  = 0
): boolean => received >= expected - tolerance
