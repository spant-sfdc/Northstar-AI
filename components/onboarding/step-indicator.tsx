"use client"

import { motion } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import { TOTAL_ONBOARDING_STEPS } from "@/stores/onboarding-store"

interface StepIndicatorProps {
  step: number
  isSaving: boolean
}

export function StepIndicator({ step, isSaving }: StepIndicatorProps) {
  const pct = Math.round(((step - 1) / TOTAL_ONBOARDING_STEPS) * 100)

  return (
    <div className="px-6 pt-4 pb-6 max-w-xl mx-auto w-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12px] font-semibold text-slate-400 tracking-wide uppercase">
          Step {step} of {TOTAL_ONBOARDING_STEPS}
        </span>
        {isSaving ? (
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <motion.span
              className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            Saving…
          </span>
        ) : step > 1 ? (
          <span className="text-[11px] text-emerald-600 font-medium">✓ Saved</span>
        ) : null}
      </div>
      <Progress value={pct} className="h-1 bg-slate-100" />
    </div>
  )
}
