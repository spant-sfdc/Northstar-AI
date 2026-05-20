// ─── Plan definitions ─────────────────────────────────────────────────────────

export type PlanKey = "free" | "premium" | "advanced"

export interface PlanConfig {
  key:             PlanKey
  name:            string
  price:           number        // INR per month, 0 for free
  currency:        "INR"
  razorpayPlanId:  string | null // null for free tier
  features:        string[]
  limits: {
    weeklyReviews:     number | null  // null = unlimited
    roadmapWeeks:      number | null
    aiAdjustments:     boolean
    progressHistory:   boolean
    roadmapRegen:      boolean
    advancedInsights:  boolean
  }
}

export const PLAN_CONFIG: Record<PlanKey, PlanConfig> = {
  free: {
    key:            "free",
    name:           "Free",
    price:          0,
    currency:       "INR",
    razorpayPlanId: null,
    features: [
      "7-day full trial",
      "Basic roadmap (weeks 1–4)",
      "2 weekly reviews",
      "Current readiness score",
    ],
    limits: {
      weeklyReviews:    2,
      roadmapWeeks:     4,
      aiAdjustments:    false,
      progressHistory:  false,
      roadmapRegen:     false,
      advancedInsights: false,
    },
  },
  premium: {
    key:            "premium",
    name:           "Premium",
    price:          399,
    currency:       "INR",
    razorpayPlanId: process.env.RAZORPAY_PLAN_PREMIUM ?? null,
    features: [
      "Full roadmap — all weeks",
      "Unlimited weekly reviews",
      "AI feedback after every check-in",
      "Full progress history chart",
      "Confidence tracking over time",
    ],
    limits: {
      weeklyReviews:    null,
      roadmapWeeks:     null,
      aiAdjustments:    true,
      progressHistory:  true,
      roadmapRegen:     false,
      advancedInsights: false,
    },
  },
  advanced: {
    key:            "advanced",
    name:           "Advanced",
    price:          799,
    currency:       "INR",
    razorpayPlanId: process.env.RAZORPAY_PLAN_ADVANCED ?? null,
    features: [
      "Everything in Premium",
      "Unlimited roadmap regenerations",
      "Advanced AI gap analysis",
      "Priority recalculation",
      "Early access to new features",
    ],
    limits: {
      weeklyReviews:    null,
      roadmapWeeks:     null,
      aiAdjustments:    true,
      progressHistory:  true,
      roadmapRegen:     true,
      advancedInsights: true,
    },
  },
}

export const PAID_PLANS: PlanKey[] = ["premium", "advanced"]

// Map a Razorpay plan_id back to our PlanKey
export function planKeyFromRazorpayId(razorpayPlanId: string): PlanKey | null {
  for (const [key, config] of Object.entries(PLAN_CONFIG)) {
    if (config.razorpayPlanId === razorpayPlanId) return key as PlanKey
  }
  return null
}
