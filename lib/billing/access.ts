// ─── Minimal subscription shape needed for access checks ─────────────────────
// Accepts a partial DB row so callers can do .select("plan, status, trial_ends_at")
// without requiring all columns.

export interface SubscriptionAccess {
  plan?:          string | null
  status?:        string | null
  trial_ends_at?: string | null
}

// ─── Access flags returned by getAccess() ────────────────────────────────────

export interface Access {
  isPremium:      boolean   // premium or advanced plan, active
  isAdvanced:     boolean   // advanced plan only, active
  isTrialing:     boolean   // free tier, trial period still active
  trialDaysLeft:  number    // 0 when not trialing
  trialExpired:   boolean   // was on free trial, trial has ended, no paid plan
  plan:           string    // current plan string
}

// ─── Central access gate — single source of truth ────────────────────────────
//
// Called in every server component and API route that needs premium checks.
// Pass the raw Subscription row from Supabase (or null/undefined for no row).

export function getAccess(sub: SubscriptionAccess | null | undefined): Access {
  const now = new Date()

  // Active paid subscription
  const isPaid   = (sub?.plan === "premium" || sub?.plan === "advanced" || sub?.plan === "pro")
  const isActive = sub?.status === "active"

  if (isPaid && isActive) {
    return {
      isPremium:     true,
      isAdvanced:    sub!.plan === "advanced",
      isTrialing:    false,
      trialDaysLeft: 0,
      trialExpired:  false,
      plan:          sub!.plan ?? "premium",
    }
  }

  // Free tier — check trial
  const trialEnd     = sub?.trial_ends_at ? new Date(sub.trial_ends_at) : null
  const isTrialing   = trialEnd ? trialEnd > now : false
  const trialDaysLeft = trialEnd
    ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / 86_400_000))
    : 0

  return {
    isPremium:     false,
    isAdvanced:    false,
    isTrialing,
    trialDaysLeft,
    trialExpired:  !isTrialing,
    plan:          sub?.plan ?? "free" as string,
  }
}

// ─── Quick helper for server components that already have the sub row ─────────

export function isPremiumAccess(sub: SubscriptionAccess | null | undefined): boolean {
  return getAccess(sub).isPremium
}
