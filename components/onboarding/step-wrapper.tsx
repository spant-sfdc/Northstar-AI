"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface StepWrapperProps {
  children: React.ReactNode
  direction: number
  stepKey: number
  className?: string
}

const EASE: [number, number, number, number] = [0.25, 0.4, 0.25, 1]

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 48 : -48,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.32, ease: EASE },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -48 : 48,
    opacity: 0,
    transition: { duration: 0.2, ease: EASE },
  }),
}

export function StepWrapper({ children, direction, stepKey, className }: StepWrapperProps) {
  return (
    <motion.div
      key={stepKey}
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      className={cn("w-full", className)}
    >
      {children}
    </motion.div>
  )
}

export function StepHeader({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <div className="mb-8">
      <h2 className="text-[26px] md:text-[30px] font-bold text-slate-900 tracking-tight leading-snug mb-2">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[15px] text-slate-500 leading-relaxed">{subtitle}</p>
      )}
    </div>
  )
}

export function StepActions({
  onNext,
  onBack,
  step,
  isSubmitting,
  nextLabel = "Continue",
  disabled = false,
}: {
  onNext: () => void
  onBack?: () => void
  step: number
  isSubmitting?: boolean
  nextLabel?: string
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between pt-8">
      {step > 1 ? (
        <button
          type="button"
          onClick={onBack}
          className="text-[14px] font-medium text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      ) : (
        <div />
      )}

      <motion.button
        type="button"
        onClick={onNext}
        disabled={disabled || isSubmitting}
        whileTap={{ scale: 0.98 }}
        className="inline-flex items-center gap-2 h-11 px-7 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-[14.5px] transition-colors shadow-sm shadow-indigo-200"
      >
        {isSubmitting ? (
          <>
            <motion.div
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            />
            Saving…
          </>
        ) : (
          <>
            {nextLabel}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </>
        )}
      </motion.button>
    </div>
  )
}
