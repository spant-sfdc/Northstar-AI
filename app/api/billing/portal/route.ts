import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAccess } from "@/lib/billing/access"
import { PLAN_CONFIG } from "@/lib/billing/plans"
import type { PlanKey } from "@/lib/billing/plans"

// GET /api/billing/portal
// Returns the current subscription state for the billing settings UI.

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  const access = getAccess(sub)
  const planKey = (sub?.plan ?? "free") as PlanKey
  const config  = PLAN_CONFIG[planKey] ?? PLAN_CONFIG.free

  return NextResponse.json({
    plan:             planKey,
    planName:         config.name,
    price:            config.price,
    status:           sub?.status ?? "active",
    isPremium:        access.isPremium,
    isAdvanced:       access.isAdvanced,
    isTrialing:       access.isTrialing,
    trialDaysLeft:    access.trialDaysLeft,
    trialExpired:     access.trialExpired,
    currentPeriodEnd: sub?.current_period_end ?? null,
    trialEndsAt:      sub?.trial_ends_at ?? null,
  })
}
