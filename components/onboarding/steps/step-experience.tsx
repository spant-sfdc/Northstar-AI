"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { StepHeader, StepActions } from "@/components/onboarding/step-wrapper"
import { cn } from "@/lib/utils"
import type { ExperienceLevel } from "@/types/onboarding"
import { toast } from "sonner"

const LEVELS: {
  id: ExperienceLevel
  label: string
  years: string
  description: string
  emoji: string
}[] = [
  { id: "junior",    label: "Junior",    years: "0 – 2 yrs", description: "Building foundational skills",        emoji: "🌱" },
  { id: "mid",       label: "Mid-level", years: "2 – 5 yrs", description: "Independently shipping features",      emoji: "⚡" },
  { id: "senior",    label: "Senior",    years: "5 – 8 yrs", description: "Leading projects and mentoring",       emoji: "🔥" },
  { id: "staff",     label: "Staff",     years: "8 – 12 yrs",description: "Driving cross-team technical strategy",emoji: "⭐" },
  { id: "principal", label: "Principal", years: "12+ yrs",   description: "Setting org-level technical direction", emoji: "🏆" },
]

export function StepExperience() {
  const { data, updateData, nextStep, prevStep } = useOnboardingStore()
  const [selected, setSelected] = useState<ExperienceLevel | "">(data.experienceLevel ?? "")

  function onNext() {
    if (!selected) {
      toast.error("Select your experience level to continue")
      return
    }
    const yearsMap: Record<ExperienceLevel, number> = {
      junior: 1, mid: 3, senior: 6, staff: 10, principal: 14,
    }
    updateData({ experienceLevel: selected, yearsOfExperience: yearsMap[selected] })
    nextStep()
  }

  return (
    <div className="flex flex-col h-full">
      <StepHeader
        title="What's your experience level?"
        subtitle="Choose the one that best describes where you are today — not where you want to be."
      />

      <div className="grid grid-cols-1 gap-3 flex-1">
        {LEVELS.map((level) => {
          const isActive = selected === level.id
          return (
            <motion.button
              key={level.id}
              type="button"
              whileTap={{ scale: 0.99 }}
              onClick={() => setSelected(level.id)}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
                isActive
                  ? "border-indigo-500 bg-indigo-50/60"
                  : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 transition-colors",
                isActive ? "bg-indigo-100" : "bg-slate-100"
              )}>
                {level.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[14.5px] font-semibold",
                    isActive ? "text-indigo-700" : "text-slate-800"
                  )}>
                    {level.label}
                  </span>
                  <span className="text-[12px] text-slate-400 font-medium">{level.years}</span>
                </div>
                <p className="text-[12.5px] text-slate-500 mt-0.5">{level.description}</p>
              </div>
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                isActive ? "border-indigo-500 bg-indigo-500" : "border-slate-300"
              )}>
                {isActive && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </motion.button>
          )
        })}
      </div>

      <StepActions onNext={onNext} onBack={prevStep} step={2} disabled={!selected} />
    </div>
  )
}
