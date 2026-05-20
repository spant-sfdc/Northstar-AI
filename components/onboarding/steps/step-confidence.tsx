"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { StepActions } from "@/components/onboarding/step-wrapper"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const LABELS: Record<number, { word: string; sub: string }> = {
  1:  { word: "Very low",     sub: "I feel far from ready" },
  2:  { word: "Low",          sub: "Lots of uncertainty" },
  3:  { word: "Uncertain",    sub: "More gaps than I'd like" },
  4:  { word: "Shaky",        sub: "Some confidence, some doubt" },
  5:  { word: "Neutral",      sub: "Hard to say either way" },
  6:  { word: "Cautious",     sub: "Mostly ready, some gaps" },
  7:  { word: "Fairly ready", sub: "Getting close" },
  8:  { word: "Confident",    sub: "I think I'm close" },
  9:  { word: "Very ready",   sub: "Just need the right opportunity" },
  10: { word: "Ready now",    sub: "I just need to start applying" },
}

interface StepConfidenceProps {
  onSubmit?: () => void
}

export function StepConfidence({ onSubmit }: StepConfidenceProps) {
  const { data, updateData, prevStep, isSaving } = useOnboardingStore()
  const [score, setScore] = useState<number>(data.confidenceScore ?? 0)

  function onNext() {
    if (!score) {
      toast.error("Rate your confidence to finish")
      return
    }
    updateData({ confidenceScore: score })
    onSubmit?.()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Custom header for final step */}
      <div className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 mb-3">Final question</p>
        <h2 className="text-[26px] md:text-[30px] font-bold text-slate-900 tracking-tight leading-snug mb-2">
          How confident are you right now?
        </h2>
        <p className="text-[15px] text-slate-500 leading-relaxed">
          Be honest — this isn't a test. It helps us calibrate where to start your roadmap.
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        {/* Score label */}
        <AnimatePresence mode="wait">
          {score > 0 && (
            <motion.div
              key={score}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="text-center"
            >
              <div className="text-[64px] font-bold text-slate-900 leading-none mb-2">{score}</div>
              <div className="text-[18px] font-semibold text-indigo-600">{LABELS[score]?.word}</div>
              <div className="text-[14px] text-slate-400 mt-1">{LABELS[score]?.sub}</div>
            </motion.div>
          )}
          {score === 0 && (
            <motion.div
              key="prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="text-[48px] font-bold text-slate-200 leading-none mb-2">—</div>
              <p className="text-[15px] text-slate-400">Click a number below</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Score selector */}
        <div className="flex items-end gap-1.5">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
            const isActive  = n === score
            const isPast    = n < score
            const height    = 24 + n * 5  // growing bar heights

            return (
              <motion.button
                key={n}
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => setScore(n)}
                className="flex flex-col items-center gap-1.5 group"
                aria-label={`Rate confidence ${n} out of 10`}
              >
                <motion.div
                  className={cn(
                    "w-7 rounded-md transition-colors",
                    isActive
                      ? "bg-indigo-600"
                      : isPast
                        ? "bg-indigo-200"
                        : "bg-slate-100 group-hover:bg-slate-200"
                  )}
                  style={{ height: `${height}px` }}
                  animate={{ height: `${height}px` }}
                />
                <span className={cn(
                  "text-[11px] font-semibold transition-colors",
                  isActive ? "text-indigo-600" : "text-slate-400"
                )}>
                  {n}
                </span>
              </motion.button>
            )
          })}
        </div>

        <div className="flex justify-between w-full max-w-[320px] text-[11px] text-slate-400 font-medium">
          <span>Not ready</span>
          <span>Ready now</span>
        </div>
      </div>

      <StepActions
        onNext={onNext}
        onBack={prevStep}
        step={10}
        disabled={!score}
        isSubmitting={isSaving}
        nextLabel="Finish & analyze"
      />
    </div>
  )
}
