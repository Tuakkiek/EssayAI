import mongoose, { Document, Schema, Model } from "mongoose"

// ── Types ─────────────────────────────────────────────────────────────
export type PaymentStatus  = "pending" | "completed" | "failed" | "refunded"
export type PaymentGateway = "sepay" | "manual"   // manual = super-admin gift
export type SubscriptionPlan = "free" | "starter" | "pro" | "enterprise" | "individual_free" | "individual_pro"

// ── Plan metadata (single source of truth) ────────────────────────────
export interface IPlanMeta {
  name:              string
  priceVnd:          number   // 0 for free
  maxStudents:       number   // -1 = unlimited
  maxTeachers:       number   // -1 = unlimited
  maxEssaysPerMonth: number   // -1 = unlimited
  aiGradingEnabled:  boolean
  durationDays:      number   // 30 for monthly, 365 for annual
}

export const PLAN_META: Record<SubscriptionPlan, IPlanMeta> = {
  free: {
    name:              "Free",
    priceVnd:          0,
    maxStudents:       30,
    maxTeachers:       1,
    maxEssaysPerMonth: 50,
    aiGradingEnabled:  true,
    durationDays:      0,      // never expires
  },
  starter: {
    name:              "Starter",
    priceVnd:          299_000,
    maxStudents:       100,
    maxTeachers:       3,
    maxEssaysPerMonth: 300,
    aiGradingEnabled:  true,
    durationDays:      30,
  },
  pro: {
    name:              "Pro",
    priceVnd:          699_000,
    maxStudents:       500,
    maxTeachers:       10,
    maxEssaysPerMonth: -1,     // unlimited
    aiGradingEnabled:  true,
    durationDays:      30,
  },
  enterprise: {
    name:              "Enterprise",
    priceVnd:          0,      // negotiated
    maxStudents:       -1,
    maxTeachers:       -1,
    maxEssaysPerMonth: -1,
    aiGradingEnabled:  true,
    durationDays:      365,
  },

  // ── Individual plans (self-registered students, no training center) ──
  individual_free: {
    name:              "Ca nhan - Mien phi",
    priceVnd:          0,
    maxStudents:       1,
    maxTeachers:       0,
    maxEssaysPerMonth: 10,
    aiGradingEnabled:  true,
    durationDays:      0,
  },
  individual_pro: {
    name:              "Ca nhan - Pro",
    priceVnd:          99_000,
    maxStudents:       1,
    maxTeachers:       0,
    maxEssaysPerMonth: -1,
    aiGradingEnabled:  true,
    durationDays:      30,
  },
}

/** Returns true if the given usage is within plan limits. -1 = unlimited. */
export const withinLimit = (used: number, limit: number): boolean =>
  limit === -1 || used < limit

// ── Interface ─────────────────────────────────────────────────────────
export interface IPaymentTransaction extends Document {
  centerId:         mongoose.Types.ObjectId
  plan:             SubscriptionPlan
  amountVnd:        number
  gateway:          PaymentGateway
  status:           PaymentStatus

  // Sepay-specific
  sepayTransactionId?: string   // from Sepay webhook
  sepayOrderCode?:     string   // reference sent to Sepay on creation
  sepayRawPayload?:    Record<string, unknown>  // full webhook body (audit)

  // Timing
  paidAt?:          Date
  periodStart?:     Date
  periodEnd?:       Date

  // Who processed manual transactions
  processedBy?:     mongoose.Types.ObjectId   // super_admin userId

  note?:            string

  createdAt: Date
  updatedAt: Date
}

// ── Schema ────────────────────────────────────────────────────────────
const PaymentTransactionSchema = new Schema<IPaymentTransaction>(
  {
    centerId: {
      type:     Schema.Types.ObjectId,
      ref:      "Center",
      required: [true, "centerId is required"],
    },
    plan: {
      type:     String,
      enum:     ["free", "starter", "pro", "enterprise", "individual_free", "individual_pro"],
      required: [true, "plan is required"],
    },
    amountVnd: {
      type:     Number,
      required: [true, "amountVnd is required"],
      min:      0,
    },
    gateway: {
      type:    String,
      enum:    ["sepay", "manual"],
      default: "sepay",
    },
    status: {
      type:    String,
      enum:    ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    sepayTransactionId: { type: String, default: null },
    sepayOrderCode:     { type: String, default: null },
    sepayRawPayload:    { type: Schema.Types.Mixed, default: null },

    paidAt:      { type: Date, default: null },
    periodStart: { type: Date, default: null },
    periodEnd:   { type: Date, default: null },

    processedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    note:        { type: String, default: null, maxlength: 500 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        const { __v: _v, sepayRawPayload: _r, ...clean } = ret
        return clean   // never expose raw webhook payload in API responses
      },
    },
  }
)

// ── Indexes ───────────────────────────────────────────────────────────
PaymentTransactionSchema.index({ centerId: 1, createdAt: -1 })
PaymentTransactionSchema.index({ status: 1, gateway: 1 })
// Prevent duplicate Sepay webhook processing
PaymentTransactionSchema.index(
  { sepayTransactionId: 1 },
  { unique: true, sparse: true }
)

// ── Model ─────────────────────────────────────────────────────────────
const PaymentTransaction: Model<IPaymentTransaction> =
  mongoose.model<IPaymentTransaction>("PaymentTransaction", PaymentTransactionSchema)

export default PaymentTransaction
