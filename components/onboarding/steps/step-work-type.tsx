"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { StepHeader, StepActions } from "@/components/onboarding/step-wrapper"
import { cn } from "@/lib/utils"
import type { WorkType } from "@/types/onboarding"
import { toast } from "sonner"

const OPTIONS: { id: WorkType; label: string; desc: string; icon: string }[] = [
  { id: "remote",   label: "Remote",    desc: "Work from anywhere",          icon: "🏠" },
  { id: "hybrid",   label: "Hybrid",    desc: "Mix of home and office",      icon: "🔀" },
  { id: "onsite",   label: "On-site",   desc: "In-office, full-time",        icon: "🏢" },
  { id: "flexible", label: "Flexible",  desc: "Open to any arrangement",     icon: "🌍" },
]

export function StepWorkType() {
  const { data, updateData, nextStep, prevStep } = useOnboardingStore()
  const [selected, setSelected] = useState<WorkType | "">(data.preferredWorkType ?? "")

  function onNext() {
    if (!selected) {
      toast.error("Choose your preferred work type")
      return
    }
    updateData({ preferredWorkType: selected })
    nextStep()
  }

  return (
    <div className="flex flex-col h-full">
      <StepHeader
        title="How do you prefer to work?"
        subtitle="This helps us focus your job search strategy on opportunities that fit your life."
      />

      <div className="flex-1 grid grid-cols-2 gap-3">
        {OPTIONS.map((opt) => {
          const isActive = selected === opt.id
          return (
            <motion.button
              key={opt.id}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelected(opt.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all",
                isActive
                  ? "border-indigo-500 bg-indigo-50/60"
                  : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-xl text-2xl flex items-center justify-center transition-colors",
                isActive ? "bg-indigo-100" : "bg-slate-100"
              )}>
                {opt.icon}
              </div>
              <div className="text-center">
                <div className={cn("text-[14px] font-semibold mb-0.5", isActive ? "text-indigo-700" : "text-slate-800")}>
                  {opt.label}
                </div>
                <p className="text-[11.5px] text-slate-400">{opt.desc}</p>
              </div>
            </motion.button>
          )
        })}
      </div>

      <StepActions onNext={onNext} onBack={prevStep} step={9} disabled={!selected} />
    </div>
  )
}
