"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { StepHeader, StepActions } from "@/components/onboarding/step-wrapper"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const OPTIONS = [
  { hours: 5,  label: "~5 hrs/week",  tag: "Light",     desc: "1 focused hour on weekdays", color: "text-sky-600 bg-sky-50" },
  { hours: 10, label: "~10 hrs/week", tag: "Regular",   desc: "Evenings or weekend sessions", color: "text-indigo-600 bg-indigo-50" },
  { hours: 15, label: "~15 hrs/week", tag: "Committed", desc: "Daily practice plus weekends", color: "text-violet-600 bg-violet-50" },
  { hours: 20, label: "20+ hrs/week", tag: "Intensive", desc: "Treating it like a part-time job", color: "text-purple-600 bg-purple-50" },
]

export function StepHours() {
  const { data, updateData, nextStep, prevStep } = useOnboardingStore()
  const [selected, setSelected] = useState<number | null>(data.availableHoursPerWeek ?? null)

  function onNext() {
    if (!selected) {
      toast.error("Select your available hours")
      return
    }
    updateData({ availableHoursPerWeek: selected })
    nextStep()
  }

  return (
    <div className="flex flex-col h-full">
      <StepHeader
        title="How much time can you commit?"
        subtitle="Be realistic. A plan built around 5 real hours beats a plan assuming 20 hours you don't have."
      />

      <div className="flex-1 grid grid-cols-2 gap-3">
        {OPTIONS.map((opt) => {
          const isActive = selected === opt.hours
          return (
            <motion.button
              key={opt.hours}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelected(opt.hours)}
              className={cn(
                "flex flex-col gap-3 p-5 rounded-xl border-2 text-left transition-all",
                isActive
                  ? "border-indigo-500 bg-indigo-50/60"
                  : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center text-[13px] font-bold transition-colors",
                isActive ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
              )}>
                {opt.hours}h
              </div>
              <div>
                <div className={cn("text-[14px] font-semibold mb-0.5", isActive ? "text-indigo-700" : "text-slate-800")}>
                  {opt.tag}
                </div>
                <p className="text-[12px] text-slate-500 leading-snug">{opt.desc}</p>
              </div>
            </motion.button>
          )
        })}
      </div>

      {selected && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-[13px] text-slate-500 pt-4"
        >
          Your roadmap will be scoped to <span className="font-semibold text-slate-700">{selected} hours/week</span>.
          You can adjust this later.
        </motion.p>
      )}

      <StepActions onNext={onNext} onBack={prevStep} step={7} disabled={!selected} />
    </div>
  )
}
