"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

const STAGES = [
  "Evaluating your skill profile…",
  "Mapping gaps to market demand…",
  "Building your weekly roadmap…",
  "Calibrating salary benchmarks…",
  "Identifying critical blockers…",
  "Finalising your readiness score…",
]

const POLL_INTERVAL_MS = 4000
const STAGE_INTERVAL_MS = 3500

export function AnalysisGenerating() {
  const router  = useRouter()
  const [stage, setStage] = useState(0)
  const [dots,  setDots]  = useState("")
  const triggered = useRef(false)

  // Cycle through stage labels
  useEffect(() => {
    const id = setInterval(() => {
      setStage(s => Math.min(s + 1, STAGES.length - 1))
    }, STAGE_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  // Animate trailing dots
  useEffect(() => {
    const id = setInterval(() => {
      setDots(d => d.length >= 3 ? "" : d + ".")
    }, 500)
    return () => clearInterval(id)
  }, [])

  // Fire the analyze call once, then poll until data is ready
  useEffect(() => {
    if (triggered.current) return
    triggered.current = true

    // POST is already fired from wizard; just start polling GET
    const poll = setInterval(async () => {
      try {
        const res = await fetch("/api/ai/analyze")
        if (!res.ok) return
        const { analysis } = await res.json()
        if (analysis) {
          clearInterval(poll)
          router.refresh()
        }
      } catch {
        // network hiccup — keep polling
      }
    }, POLL_INTERVAL_MS)

    return () => clearInterval(poll)
  }, [router])

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] select-none">

      {/* Animated ring */}
      <div className="relative mb-10">
        <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
          <circle cx="48" cy="48" r="40" stroke="#e2e8f0" strokeWidth="6" />
          <motion.circle
            cx="48" cy="48" r="40"
            stroke="#4F46E5"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 40}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 40, rotate: -90 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: STAGES.length * (STAGE_INTERVAL_MS / 1000), ease: "linear" }}
            style={{ transformOrigin: "48px 48px" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                stroke="#fff" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      <h2 className="text-[18px] font-700 text-slate-900 tracking-tight mb-2">
        Building your readiness analysis
      </h2>
      <p className="text-[13px] text-slate-400 mb-8">
        This takes about 20–40 seconds. Don&apos;t close this tab.
      </p>

      {/* Cycling stage label */}
      <div className="h-6 flex items-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={stage}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="text-[13px] font-medium text-indigo-600"
          >
            {STAGES[stage]}{dots}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Stage dots */}
      <div className="flex gap-2 mt-8">
        {STAGES.map((_, i) => (
          <motion.div
            key={i}
            className="rounded-full"
            animate={{
              width:           i <= stage ? 20 : 8,
              backgroundColor: i <= stage ? "#4F46E5" : "#e2e8f0",
            }}
            style={{ height: 8 }}
            transition={{ duration: 0.4 }}
          />
        ))}
      </div>

    </div>
  )
}
