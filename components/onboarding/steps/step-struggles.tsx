"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { StepHeader, StepActions } from "@/components/onboarding/step-wrapper"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const STRUGGLES = [
  "System design interviews",
  "Algorithms & data structures",
  "Getting visibility at work",
  "Demonstrating impact",
  "Technical communication",
  "Building leadership experience",
  "Navigating promotion processes",
  "Getting past resume screens",
  "Salary negotiation",
  "Knowing what to work on",
  "Staying consistent",
  "Imposter syndrome",
  "Cross-team collaboration",
  "Making time to prepare",
  "Networking & referrals",
]

export function StepStruggles() {
  const { data, updateData, nextStep, prevStep } = useOnboardingStore()
  const [selected, setSelected] = useState<Set<string>>(
    new Set(data.careerStruggles ?? [])
  )

  function toggle(item: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(item)) next.delete(item)
      else if (next.size < 5) next.add(item)
      else toast.error("Select up to 5 — prioritize what matters most")
      return next
    })
  }

  function onNext() {
    if (selected.size === 0) {
      toast.error("Select at least one area")
      return
    }
    updateData({ careerStruggles: [...selected] })
    nextStep()
  }

  return (
    <div className="flex flex-col h-full">
      <StepHeader
        title="Where do you feel stuck?"
        subtitle="Select up to 5. Naming the real obstacles is the first step to removing them."
      />

      {selected.size > 0 && (
        <div className="flex flex-wrap gap-2 mb-5 pb-4 border-b border-slate-100">
          <AnimatePresence>
            {[...selected].map((s) => (
              <motion.button
                key={s}
                type="button"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={() => toggle(s)}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full px-3 py-1"
              >
                {s}
                <X className="w-3 h-3" />
              </motion.button>
            ))}
          </AnimatePresence>
          <span className="self-center text-[11px] text-slate-400 ml-auto">
            {selected.size}/5
          </span>
        </div>
      )}

      <div className="flex-1 flex flex-wrap content-start gap-2.5 overflow-y-auto">
        {STRUGGLES.map((item) => {
          const isActive = selected.has(item)
          const isDisabled = selected.size >= 5 && !isActive
          return (
            <motion.button
              key={item}
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => toggle(item)}
              disabled={isDisabled}
              className={cn(
                "text-[13px] font-medium rounded-full px-4 py-2 border transition-all",
                isActive
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : isDisabled
                    ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              {item}
            </motion.button>
          )
        })}
      </div>

      <StepActions onNext={onNext} onBack={prevStep} step={8} />
    </div>
  )
}
