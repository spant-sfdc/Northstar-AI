"use client"

import { useState } from "react"
import { AnimatePresence } from "framer-motion"
import { Sparkles, Clock, CheckCircle2, AlertTriangle, CreditCard, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { PLAN_CONFIG } from "@/lib/billing/plans"
import { UpgradeModal } from "@/components/billing/upgrade-modal"
import type { PlanKey } from "@/lib/billing/plans"

// ─── Types ────────────────────────────────────────────────────────────────────

interface PortalData {
  plan:             PlanKey
  planName:         string
  price:            number
  status:           "active" | "canceled" | "past_due"
  isPremium:        boolean
  isAdvanced:       boolean
  isTrialing:       boolean
  trialDaysLeft:    number
  trialExpired:     boolean
  currentPeriodEnd: string | null
  trialEndsAt:      string | null
}

interface Props {
  portal:    PortalData
  userEmail: string
  userName:  string
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, isTrialing, trialDaysLeft }: Pick<PortalData, "status" | "isTrialing" | "trialDaysLeft">) {
  if (isTrialing)
    return (
      <span className="flex items-center gap-1.5 text-[11px] font-semibold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">
        <Clock className="w-3 h-3" /> {trialDaysLeft}d trial left
      </span>
    )
  if (status === "active")
    return (
      <span className="flex items-center gap-1.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
        <CheckCircle2 className="w-3 h-3" /> Active
      </span>
    )
  if (status === "past_due")
    return (
      <span className="flex items-center gap-1.5 text-[11px] font-semibold bg-red-50 text-red-700 px-2.5 py-1 rounded-full">
        <AlertTriangle className="w-3 h-3" /> Payment due
      </span>
    )
  return (
    <span className="flex items-center gap-1.5 text-[11px] font-semibold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">
      Cancelled
    </span>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BillingSettings({ portal, userEmail, userName }: Props) {
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [cancelling, setCancelling]   = useState(false)
  const [cancelled, setCancelled]     = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const config      = PLAN_CONFIG[portal.plan] ?? PLAN_CONFIG.free
  const nextBilling = portal.currentPeriodEnd
    ? new Date(portal.currentPeriodEnd).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : null
  const trialDate = portal.trialEndsAt
    ? new Date(portal.trialEndsAt).toLocaleDateString("en-IN", { day: "numeric", month: "long" })
    : null

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel? You'll keep access until the end of your billing period.")) return
    setCancelling(true)
    setCancelError(null)

    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Cancellation failed")
      setCancelled(true)
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setCancelling(false)
    }
  }

  return (
    <>
      <div className="space-y-5">

        {/* Current plan card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-slate-100">
            <h2 className="text-[14px] font-semibold text-slate-800">Current plan</h2>
          </div>

          <div className="px-6 py-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[18px] font-bold text-slate-900">{config.name}</span>
                  {portal.isPremium && (
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                  )}
                </div>
                <p className="text-[13px] text-slate-500">
                  {portal.isPremium
                    ? `₹${config.price}/month`
                    : portal.isTrialing
                    ? "Free trial"
                    : "Free tier"}
                </p>
              </div>
              <StatusBadge status={portal.status} isTrialing={portal.isTrialing} trialDaysLeft={portal.trialDaysLeft} />
            </div>

            {/* Trial / billing info */}
            {portal.isTrialing && trialDate && (
              <div className="mt-4 flex items-center gap-2 bg-amber-50 rounded-xl px-4 py-3">
                <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <p className="text-[13px] text-amber-800">
                  Trial ends <strong>{trialDate}</strong> — upgrade to keep full access.
                </p>
              </div>
            )}

            {portal.trialExpired && !portal.isPremium && (
              <div className="mt-4 flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <p className="text-[13px] text-slate-600">
                  Your trial has ended. Upgrade to unlock premium features.
                </p>
              </div>
            )}

            {portal.isPremium && nextBilling && !cancelled && (
              <div className="mt-4 flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-3">
                <CreditCard className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <p className="text-[13px] text-slate-600">
                  Next billing on <strong>{nextBilling}</strong>
                </p>
              </div>
            )}

            {cancelled && (
              <div className="mt-4 bg-slate-50 rounded-xl px-4 py-3">
                <p className="text-[13px] text-slate-600">
                  Subscription cancelled — you&apos;ll keep access until {nextBilling ?? "end of period"}.
                </p>
              </div>
            )}

            {cancelError && (
              <p className="mt-3 text-[12px] text-red-600">{cancelError}</p>
            )}
          </div>
        </div>

        {/* Features in current plan */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-6 pt-6 pb-4 border-b border-slate-100">
            <h2 className="text-[14px] font-semibold text-slate-800">What&apos;s included</h2>
          </div>
          <div className="px-6 py-5">
            <ul className="space-y-2.5">
              {config.features.map(f => (
                <li key={f} className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-[13px] text-slate-700">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-6 pt-6 pb-4 border-b border-slate-100">
            <h2 className="text-[14px] font-semibold text-slate-800">Manage subscription</h2>
          </div>
          <div className="px-6 py-4 space-y-1">

            {/* Upgrade */}
            {!portal.isPremium && !cancelled && (
              <button
                type="button"
                onClick={() => setShowUpgrade(true)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[13.5px] font-semibold">Upgrade to Premium</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-70" />
              </button>
            )}

            {/* Upgrade to Advanced (if already on Premium) */}
            {portal.plan === "premium" && !cancelled && (
              <button
                type="button"
                onClick={() => setShowUpgrade(true)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span className="text-[13.5px] font-medium">Upgrade to Advanced</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            )}

            {/* Cancel */}
            {portal.isPremium && !cancelled && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 transition-colors",
                  cancelling ? "opacity-50 cursor-wait" : "text-slate-500 hover:text-red-600 hover:border-red-100 hover:bg-red-50"
                )}
              >
                <span className="text-[13.5px] font-medium">
                  {cancelling ? "Cancelling…" : "Cancel subscription"}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            )}

            <p className="text-[11.5px] text-slate-400 px-1 pt-1">
              Payments are processed by Razorpay. Contact support for refunds or billing disputes.
            </p>
          </div>
        </div>

      </div>

      {/* Upgrade modal */}
      <AnimatePresence>
        {showUpgrade && (
          <UpgradeModal
            userEmail={userEmail}
            userName={userName}
            currentPlan={portal.plan}
            onClose={() => setShowUpgrade(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
