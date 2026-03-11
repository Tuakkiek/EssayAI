import mongoose, { Document, Schema, Model } from "mongoose"
import { SubscriptionPlan } from "./User"

export type PaymentStatus  = "pending" | "completed" | "failed" | "refunded" | "cancelled"
export type PaymentGateway = "sepay" | "manual"

export interface IPaymentTransaction extends Document {
  userId:          mongoose.Types.ObjectId
  plan:            SubscriptionPlan
  amountVND:       number
  status:          PaymentStatus
  gateway:         PaymentGateway

  // Reference code sent in bank transfer description
  referenceCode:   string

  // Sepay webhook payload (stored for audit)
  sepayData?: {
    transactionId:   string
    bankCode:        string
    accountNumber:   string
    transferAmount:  number
    description:     string
    transferAt:      string
    referenceCode:   string
  }

  // Subscription period this payment covers
  subscriptionStart?: Date
  subscriptionEnd?:   Date

  // Metadata
  note?:           string
  failureReason?:  string

  createdAt: Date
  updatedAt: Date
}

const PaymentTransactionSchema = new Schema<IPaymentTransaction>(
  {
    userId:        { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    plan:          { type: String, enum: ["free", "starter", "pro", "enterprise"], required: true },
    amountVND:     { type: Number, required: true, min: 0 },
    status:        { type: String, enum: ["pending", "completed", "failed", "refunded", "cancelled"], default: "pending", index: true },
    gateway:       { type: String, enum: ["sepay", "manual"], default: "sepay" },
    referenceCode: { type: String, required: true, unique: true, index: true },

    sepayData: {
      transactionId:  String,
      bankCode:       String,
      accountNumber:  String,
      transferAmount: Number,
      description:    String,
      transferAt:     String,
      referenceCode:  String,
    },

    subscriptionStart: Date,
    subscriptionEnd:   Date,
    note:              String,
    failureReason:     String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_d, ret) => { delete (ret as {__v?: unknown}).__v; return ret } },
  }
)

PaymentTransactionSchema.index({ userId: 1, createdAt: -1 })
PaymentTransactionSchema.index({ status: 1, createdAt: -1 })

const PaymentTransaction: Model<IPaymentTransaction> =
  mongoose.model<IPaymentTransaction>("PaymentTransaction", PaymentTransactionSchema)

export default PaymentTransaction
