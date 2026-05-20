import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { getAccess } from "@/lib/billing/access"
import { PLAN_CONFIG } from "@/lib/billing/plans"
import { BillingSettings } from "@/components/billing/billing-settings"
import type { PlanKey } from "@/lib/billing/plans"

export const metadata: Metadata = { title: "Billing" }
export const dynamic = "force-dynamic"

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  const access  = getAccess(sub)
  const planKey = (sub?.plan ?? "free") as PlanKey
  const config  = PLAN_CONFIG[planKey] ?? PLAN_CONFIG.free
  const name    = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "You"

  const portal = {
    plan:             planKey,
    planName:         config.name,
    price:            config.price,
    status:           (sub?.status ?? "active") as "active" | "canceled" | "past_due",
    isPremium:        access.isPremium,
    isAdvanced:       access.isAdvanced,
    isTrialing:       access.isTrialing,
    trialDaysLeft:    access.trialDaysLeft,
    trialExpired:     access.trialExpired,
    currentPeriodEnd: sub?.current_period_end ?? null,
    trialEndsAt:      sub?.trial_ends_at ?? null,
  }

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Billing & Plan</h1>
          <p className="text-[13px] text-slate-400 mt-1">Manage your subscription and payment details.</p>
        </div>
        <BillingSettings
          portal={portal}
          userEmail={user.email ?? ""}
          userName={name}
        />
      </div>
    </main>
  )
}
