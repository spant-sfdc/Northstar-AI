"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { StepHeader, StepActions } from "@/components/onboarding/step-wrapper"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const OPTIONS = [
  { months: 2,  label: "2 months",  tag: "Sprint",    desc: "Intensive focus, compressed timeline" },
  { months: 3,  label: "3 months",  tag: "Focused",   desc: "Balanced pace with clear weekly goals" },
  { months: 4,  label: "4 months",  tag: "Standard",  desc: "Recommended for most engineers", recommended: true },
  { months: 6,  label: "6 months",  tag: "Thorough",  desc: "Deep work, career change territory" },
]

export function StepTimeline() {
  const { data, updateData, nextStep, prevStep } = useOnboardingStore()
  const [selected, setSelected] = useState<number | null>(data.targetTimelineMonths ?? null)

  function onNext() {
    if (!selected) {
      toast.error("Choose a target timeline")
      return
    }
    updateData({ targetTimelineMonths: selected })
    nextStep()
  }

  return (
    <div className="flex flex-col h-full">
      <StepHeader
        title="When do you want to be market-ready?"
        subtitle="Choose a realistic timeline. We'll build your roadmap around it — not an idealized version of your schedule."
      />

      <div className="flex-1 grid grid-cols-1 gap-3">
        {OPTIONS.map((opt) => {
          const isActive = selected === opt.months
          return (
            <motion.button
              key={opt.months}
              type="button"
              whileTap={{ scale: 0.99 }}
              onClick={() => setSelected(opt.months)}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all relative",
                isActive
                  ? "border-indigo-500 bg-indigo-50/60"
                  : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
              )}
            >
              {opt.recommended && (
                <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wide text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                  Recommended
                </span>
              )}

              {/* Timeline circle */}
              <div className={cn(
                "w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 transition-colors",
                isActive ? "bg-indigo-100" : "bg-slate-100"
              )}>
                <span className={cn("text-xl font-bold leading-none", isActive ? "text-indigo-700" : "text-slate-700")}>
                  {opt.months}
                </span>
                <span className={cn("text-[10px] font-medium", isActive ? "text-indigo-500" : "text-slate-400")}>
                  months
                </span>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={cn("text-[15px] font-semibold", isActive ? "text-indigo-700" : "text-slate-800")}>
                    {opt.tag}
                  </span>
                </div>
                <p className="text-[12.5px] text-slate-500">{opt.desc}</p>
              </div>

              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                isActive ? "border-indigo-500 bg-indigo-500" : "border-slate-300"
              )}>
                {isActive && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </motion.button>
          )
        })}
      </div>

      <StepActions onNext={onNext} onBack={prevStep} step={6} disabled={!selected} />
    </div>
  )
}
