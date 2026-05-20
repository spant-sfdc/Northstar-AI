"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence } from "framer-motion"
import { toast } from "sonner"

import { useOnboardingStore } from "@/stores/onboarding-store"
import { StepIndicator } from "@/components/onboarding/step-indicator"
import { StepWrapper } from "@/components/onboarding/step-wrapper"
import { StepCurrentRole } from "@/components/onboarding/steps/step-current-role"
import { StepExperience } from "@/components/onboarding/steps/step-experience"
import { StepSkills } from "@/components/onboarding/steps/step-skills"
import { StepResume } from "@/components/onboarding/steps/step-resume"
import { StepTargetRole } from "@/components/onboarding/steps/step-target-role"
import { StepTimeline } from "@/components/onboarding/steps/step-timeline"
import { StepHours } from "@/components/onboarding/steps/step-hours"
import { StepStruggles } from "@/components/onboarding/steps/step-struggles"
import { StepWorkType } from "@/components/onboarding/steps/step-work-type"
import { StepConfidence } from "@/components/onboarding/steps/step-confidence"

interface WizardProps {
  userId: string
  userEmail: string
}

const STEP_LABELS: Record<number, string> = {
  1:  "Your role",
  2:  "Experience",
  3:  "Skills",
  4:  "Resume",
  5:  "Target role",
  6:  "Timeline",
  7:  "Hours",
  8:  "Struggles",
  9:  "Work type",
  10: "Confidence",
}

export function OnboardingWizard({ userId, userEmail: _userEmail }: WizardProps) {
  const router = useRouter()
  const { step, direction, isSaving, setIsSaving, markComplete, reset } =
    useOnboardingStore()

  const handleSubmit = useCallback(async () => {
    setIsSaving(true)
    try {
      // Read store state at call time, not from the closed-over render snapshot.
      // StepConfidence calls updateData() then onSubmit() in the same tick; React
      // hasn't re-rendered yet, so the closed-over `data` is one render stale and
      // would be missing `confidenceScore` on the first-ever submission.
      const currentData = useOnboardingStore.getState().data

      console.log("[wizard] submitting payload keys:", Object.keys(currentData))

      const res = await fetch("/api/onboarding/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...currentData, userId }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const detail = body.detail ? ` (${body.code}: ${body.detail})` : ""
        console.error("[wizard] submit failed:", body)
        throw new Error((body.error ?? "Submission failed") + detail)
      }

      markComplete()
      reset()

      // Kick off AI analysis in background — page polls until ready
      fetch("/api/ai/analyze", { method: "POST" }).catch(() => {})

      router.push("/dashboard")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }, [userId, setIsSaving, markComplete, reset, router])

  function renderStep() {
    switch (step) {
      case 1:  return <StepCurrentRole />
      case 2:  return <StepExperience />
      case 3:  return <StepSkills />
      case 4:  return <StepResume userId={userId} />
      case 5:  return <StepTargetRole />
      case 6:  return <StepTimeline />
      case 7:  return <StepHours />
      case 8:  return <StepStruggles />
      case 9:  return <StepWorkType />
      case 10: return <StepConfidence onSubmit={handleSubmit} />
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <StepIndicator step={step} isSaving={isSaving} />

      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-10">
        <div className="w-full max-w-xl">
          {/* Step label */}
          <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-500 mb-6">
            {STEP_LABELS[step]}
          </p>

          {/* Animated step content */}
          <AnimatePresence mode="wait" custom={direction}>
            <StepWrapper
              key={step}
              stepKey={step}
              direction={direction}
              className="flex flex-col min-h-[520px]"
            >
              {renderStep()}
            </StepWrapper>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
