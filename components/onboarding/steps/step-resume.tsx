"use client"

import { useState } from "react"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { ResumeDropzone } from "@/components/onboarding/resume-dropzone"
import { StepHeader, StepActions } from "@/components/onboarding/step-wrapper"
import { toast } from "sonner"

interface StepResumeProps {
  userId: string
}

export function StepResume({ userId }: StepResumeProps) {
  const { data, updateData, nextStep, prevStep } = useOnboardingStore()

  const [file, setFile] = useState<{ storagePath: string; fileName: string } | null>(
    data.resumeStoragePath
      ? { storagePath: data.resumeStoragePath, fileName: data.resumeFileName ?? "" }
      : null
  )

  function onFileChange(value: { storagePath: string; fileName: string } | null) {
    setFile(value)
    if (value) {
      updateData({ resumeStoragePath: value.storagePath, resumeFileName: value.fileName })
    } else {
      updateData({ resumeStoragePath: "", resumeFileName: "" })
    }
  }

  function onNext() {
    if (!file) {
      toast.error("Upload your resume to continue")
      return
    }
    nextStep()
  }

  function onSkip() {
    updateData({ resumeStoragePath: "skipped", resumeFileName: "skipped" })
    nextStep()
  }

  return (
    <div className="flex flex-col h-full">
      <StepHeader
        title="Upload your resume"
        subtitle="We use it to understand your background. We never share it or use it to train models."
      />

      <div className="flex-1">
        <ResumeDropzone userId={userId} value={file ?? undefined} onChange={onFileChange} />

        {/* What we use it for */}
        <div className="mt-6 space-y-2.5">
          {[
            "Extract your experience, skills, and trajectory",
            "Calibrate your readiness score against real job requirements",
            "Personalize your roadmap to your actual background",
          ].map((point) => (
            <div key={point} className="flex items-start gap-2.5">
              <div className="mt-1 w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              </div>
              <p className="text-[13px] text-slate-500">{point}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={prevStep}
          className="text-[14px] font-medium text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="text-[13px] text-slate-400 hover:text-slate-600 transition-colors"
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!file}
            className="inline-flex items-center gap-2 h-11 px-7 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-[14.5px] transition-colors"
          >
            Continue
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
