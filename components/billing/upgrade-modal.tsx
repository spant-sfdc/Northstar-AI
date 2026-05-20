"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, Sparkles, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { PLAN_CONFIG } from "@/lib/billing/plans"
import type { PlanKey } from "@/lib/billing/plans"

// ─── Razorpay script loader ───────────────────────────────────────────────────

function loadRazorpay(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") { reject(new Error("SSR")); return }
    if ((window as unknown as Record<string, unknown>).Razorpay) { resolve(); return }
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Razorpay"))
    document.body.appendChild(script)
  })
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  userEmail: string
  userName: string
  currentPlan?: PlanKey
  onClose: () => void
}

// ─── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({
  planKey,
  selected,
  onSelect,
}: {
  planKey: "premium" | "advanced"
  selected: boolean
  onSelect: () => void
}) {
  const config = PLAN_CONFIG[planKey]
  const isAdv  = planKey === "advanced"

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "w-full text-left rounded-2xl border-2 p-5 transition-all",
        selected
          ? isAdv
            ? "border-violet-400 bg-violet-50"
            : "border-indigo-400 bg-indigo-50"
          : "border-slate-100 bg-white hover:border-slate-200"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className={cn(
              "text-[13px] font-bold",
              selected
                ? isAdv ? "text-violet-700" : "text-indigo-700"
                : "text-slate-800"
            )}>
              {config.name}
            </span>
            {isAdv && (
              <span className="text-[9px] font-bold uppercase tracking-widest bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full">
                Best value
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[22px] font-bold text-slate-900">₹{config.price}</span>
            <span className="text-[12px] text-slate-400">/month</span>
          </div>
        </div>

        <div className={cn(
          "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all",
          selected
            ? isAdv ? "border-violet-500 bg-violet-500" : "border-indigo-500 bg-indigo-500"
            : "border-slate-200"
        )}>
          {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        </div>
      </div>

      <ul className="space-y-1.5">
        {config.features.map(f => (
          <li key={f} className="flex items-start gap-2">
            <Check className={cn(
              "w-3.5 h-3.5 mt-0.5 flex-shrink-0",
              selected
                ? isAdv ? "text-violet-500" : "text-indigo-500"
                : "text-slate-400"
            )} />
            <span className="text-[12px] text-slate-600 leading-snug">{f}</span>
          </li>
        ))}
      </ul>
    </motion.button>
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function UpgradeModal({ userEmail, userName, currentPlan = "free", onClose }: Props) {
  const router = useRouter()
  const [selectedPlan, setSelected]  = useState<"premium" | "advanced">("premium")
  const [loading, setLoading]        = useState(false)
  const [error, setError]            = useState<string | null>(null)
  const [success, setSuccess]        = useState(false)

  async function handleSubscribe() {
    setLoading(true)
    setError(null)

    try {
      // Step 1: Create Razorpay subscription on server
      const subRes = await fetch("/api/billing/subscribe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ plan: selectedPlan }),
      })
      const subData = await subRes.json()
      if (!subRes.ok) throw new Error(subData.error ?? "Failed to initiate subscription")

      // Step 2: Load Razorpay script
      await loadRazorpay()

      // Step 3: Open Razorpay checkout
      const options = {
        key:             subData.keyId,
        subscription_id: subData.subscriptionId,
        name:            "SkillSynq",
        description:     `${subData.planName} — ₹${subData.amount}/month`,
        image:           "/skillsynq-logo.png",
        handler: async function (response: {
          razorpay_payment_id: string
          razorpay_subscription_id: string
          razorpay_signature: string
        }) {
          // Step 4: Verify payment server-side
          const verifyRes = await fetch("/api/billing/verify", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(response),
          })
          const verifyData = await verifyRes.json()
          if (!verifyRes.ok) {
            setError(verifyData.error ?? "Payment verification failed. Contact support.")
            setLoading(false)
            return
          }
          setSuccess(true)
          setLoading(false)
          // Refresh server data so dashboard reflects new plan
          setTimeout(() => {
            router.refresh()
            onClose()
          }, 2000)
        },
        prefill: {
          email: userEmail,
          name:  userName,
        },
        theme: { color: "#4f46e5" },
        modal: {
          ondismiss: () => setLoading(false),
        },
      }

      const RazorpayCheckout = (window as unknown as Record<string, unknown>).Razorpay as new (opts: unknown) => { open(): void }
      const rzp = new RazorpayCheckout(options)
      rzp.open()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Modal */}
      <motion.div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.24, ease: [0.25, 0.4, 0.25, 1] }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between border-b border-slate-100">
          <div>
            <h2 className="text-[18px] font-bold text-slate-900">Upgrade your plan</h2>
            <p className="text-[12.5px] text-slate-400 mt-0.5">Cancel anytime · Secure payments via Razorpay</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors mt-0.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Success state */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3"
              >
                <Sparkles className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="text-[13px] font-semibold text-emerald-800">You&apos;re now on {PLAN_CONFIG[selectedPlan].name}!</p>
                  <p className="text-[12px] text-emerald-600">Refreshing your dashboard…</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error state */}
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-[12.5px] text-red-700">{error}</p>
            </div>
          )}

          {/* Plan cards */}
          {!success && (
            <div className="grid grid-cols-2 gap-3">
              <PlanCard planKey="premium" selected={selectedPlan === "premium"} onSelect={() => setSelected("premium")} />
              <PlanCard planKey="advanced" selected={selectedPlan === "advanced"} onSelect={() => setSelected("advanced")} />
            </div>
          )}

          {/* CTA */}
          {!success && (
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={loading}
              className={cn(
                "w-full h-12 rounded-xl text-white text-[14px] font-semibold transition-all",
                loading ? "opacity-60 cursor-wait" :
                selectedPlan === "advanced"
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                  : "bg-indigo-600 hover:bg-indigo-700"
              )}
            >
              {loading
                ? "Opening checkout…"
                : `Subscribe to ${PLAN_CONFIG[selectedPlan].name} · ₹${PLAN_CONFIG[selectedPlan].price}/month`
              }
            </button>
          )}

          {!success && (
            <p className="text-center text-[11.5px] text-slate-400">
              Payments are processed securely by Razorpay. Your card is never stored on our servers.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
