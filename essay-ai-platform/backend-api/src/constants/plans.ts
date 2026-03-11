import { SubscriptionPlan } from "../models/User"

export interface PlanConfig {
  id:             SubscriptionPlan
  name:           string
  priceVND:       number
  priceUSD:       number
  durationDays:   number
  essaysPerMonth: number   // -1 = unlimited
  features:       string[]
  popular:        boolean
}

export const PLANS: Record<SubscriptionPlan, PlanConfig> = {
  free: {
    id: "free", name: "Free",
    priceVND: 0, priceUSD: 0, durationDays: 0, essaysPerMonth: 3, popular: false,
    features: [
      "3 essay scorings/month",
      "Basic grammar check",
      "Band score 0–9",
      "Overall feedback",
    ],
  },
  starter: {
    id: "starter", name: "Starter",
    priceVND: 99_000, priceUSD: 4, durationDays: 30, essaysPerMonth: 20, popular: false,
    features: [
      "20 essay scorings/month",
      "Detailed grammar errors",
      "Score breakdown (4 criteria)",
      "Improvement suggestions",
      "Essay history",
    ],
  },
  pro: {
    id: "pro", name: "Pro",
    priceVND: 199_000, priceUSD: 8, durationDays: 30, essaysPerMonth: -1, popular: true,
    features: [
      "Unlimited scorings",
      "Detailed grammar errors",
      "Score breakdown (4 criteria)",
      "Improvement suggestions",
      "Essay history & analytics",
      "Progress tracking",
      "Priority AI processing",
    ],
  },
  enterprise: {
    id: "enterprise", name: "Enterprise",
    priceVND: 0, priceUSD: 0, durationDays: 0, essaysPerMonth: -1, popular: false,
    features: [
      "Everything in Pro",
      "Custom teacher dashboard",
      "Student progress reports",
      "Center branding",
      "Bulk student management",
      "Dedicated support",
    ],
  },
}

export const getPlanConfig = (plan: SubscriptionPlan): PlanConfig => PLANS[plan]

export const isPaidPlan = (plan: SubscriptionPlan): boolean =>
  plan !== "free" && plan !== "enterprise"

export const canScoreEssay = (
  plan: SubscriptionPlan,
  essaysThisMonth: number
): { allowed: boolean; reason?: string } => {
  const config = PLANS[plan]
  if (config.essaysPerMonth === -1) return { allowed: true }
  if (essaysThisMonth >= config.essaysPerMonth) {
    return {
      allowed: false,
      reason: `Monthly limit of ${config.essaysPerMonth} essays reached. Upgrade to score more.`,
    }
  }
  return { allowed: true }
}
