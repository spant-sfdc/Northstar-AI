"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Circle, X, ChevronRight, Sparkles, TrendingUp, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DbMilestone } from "@/types/database"

// ─── Types ────────────────────────────────────────────────────────────────────

interface CheckInResult {
  weekNumber: number
  readinessScore: number
  previousReadinessScore: number
  confidenceScore: number
  thisWeekCompleted: number
  thisWeekTotal: number
  milestonesCompleted: number
  milestonesTotal: number
  aiFeedback: {
    summary: string
    adjustments: string[]
    nextWeekFocus: string
    encouragement: string
  } | null
  isPremiumRequired: boolean
}

interface Props {
  weekNumber: number
  milestones: DbMilestone[]
  isPremium: boolean
  onClose: () => void
}

// ─── Confidence config ────────────────────────────────────────────────────────

const CONFIDENCE_CONFIG: Record<number, { label: string; color: string; bg: string }> = {
  1:  { label: "Lost",       color: "text-red-600",    bg: "bg-red-50 ring-red-200"    },
  2:  { label: "Struggling", color: "text-red-500",    bg: "bg-red-50 ring-red-200"    },
  3:  { label: "Uncertain",  color: "text-orange-500", bg: "bg-orange-50 ring-orange-200" },
  4:  { label: "Shaky",      color: "text-amber-500",  bg: "bg-amber-50 ring-amber-200"   },
  5:  { label: "Neutral",    color: "text-yellow-600", bg: "bg-yellow-50 ring-yellow-200" },
  6:  { label: "Okay",       color: "text-lime-600",   bg: "bg-lime-50 ring-lime-200"     },
  7:  { label: "Good",       color: "text-emerald-600",bg: "bg-emerald-50 ring-emerald-200"},
  8:  { label: "Solid",      color: "text-emerald-700",bg: "bg-emerald-50 ring-emerald-300"},
  9:  { label: "Strong",     color: "text-teal-700",   bg: "bg-teal-50 ring-teal-200"     },
  10: { label: "Crushing it",color: "text-indigo-600", bg: "bg-indigo-50 ring-indigo-300" },
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WeeklyReviewModal({ weekNumber, milestones, isPremium, onClose }: Props) {
  const router = useRouter()
  const thisWeekMilestones = milestones.filter(m => m.week_number === weekNumber)

  const [step, setStep]           = useState<1 | 2 | 3>(1)
  const [checked, setChecked]     = useState<Set<string>>(
    new Set(thisWeekMilestones.filter(m => m.status === "complete").map(m => m.id))
  )
  const [confidence, setConf]     = useState(5)
  const [wins, setWins]           = useState("")
  const [blockers, setBlockers]   = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult]       = useState<CheckInResult | null>(null)

  function toggleMilestone(id: string) {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function submit() {
    setSubmitting(true)
    try {
      const res = await fetch("/api/progress/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekNumber,
          confidenceScore:       confidence,
          completedMilestoneIds: Array.from(checked),
          wins:                  wins.trim() || undefined,
          blockers:              blockers.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Submission failed")

      setResult({
        weekNumber,
        readinessScore:         json.snapshot.readinessScore,
        previousReadinessScore: json.snapshot.previousReadinessScore,
        confidenceScore:        confidence,
        thisWeekCompleted:      json.snapshot.thisWeekCompleted,
        thisWeekTotal:          json.snapshot.thisWeekTotal,
        milestonesCompleted:    json.snapshot.milestonesCompleted,
        milestonesTotal:        json.snapshot.milestonesTotal,
        aiFeedback:             json.aiFeedback,
        isPremiumRequired:      json.isPremiumRequired,
      })
      setStep(3)
      router.refresh()
    } catch (err) {
      console.error("[WeeklyReviewModal] submit:", err)
    } finally {
      setSubmitting(false)
    }
  }

  const conf = CONFIDENCE_CONFIG[confidence]

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Panel */}
      <motion.div
        className="relative w-full sm:max-w-md max-h-[90vh] bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.28, ease: [0.25, 0.4, 0.25, 1] }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex gap-1.5">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  s === step ? "w-6 bg-indigo-600" : s < step ? "w-1.5 bg-indigo-300" : "w-1.5 bg-slate-200"
                )}
              />
            ))}
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">

            {/* ─── Step 1: Milestone completion ──────────────────────────── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="px-6 py-5"
              >
                <h2 className="text-[17px] font-bold text-slate-900 mb-1">
                  What did you complete?
                </h2>
                <p className="text-[12.5px] text-slate-400 mb-5">
                  Week {weekNumber} · Tap to mark complete
                </p>

                {thisWeekMilestones.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <p className="text-[13px]">No milestones for week {weekNumber} yet.</p>
                    <p className="text-[12px] mt-1">Your roadmap may still be generating.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {thisWeekMilestones.map(m => {
                      const done = checked.has(m.id)
                      return (
                        <motion.button
                          key={m.id}
                          type="button"
                          onClick={() => toggleMilestone(m.id)}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            "w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all",
                            done
                              ? "bg-emerald-50 border-emerald-100"
                              : "bg-white border-slate-100 hover:border-slate-200"
                          )}
                        >
                          <div className="mt-0.5 flex-shrink-0">
                            {done
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              : <Circle className="w-4 h-4 text-slate-300" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-[13px] font-medium leading-snug",
                              done ? "line-through text-slate-400" : "text-slate-700"
                            )}>
                              {m.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                {m.category}
                              </span>
                              <span className="text-[10.5px] text-slate-400">
                                {m.estimated_hours}h
                              </span>
                            </div>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── Step 2: Confidence + context ───────────────────────────── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="px-6 py-5"
              >
                <h2 className="text-[17px] font-bold text-slate-900 mb-1">
                  How was your week?
                </h2>
                <p className="text-[12.5px] text-slate-400 mb-5">
                  Be honest — it calibrates your roadmap
                </p>

                {/* Confidence picker */}
                <div className="mb-5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">
                    Confidence this week
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
                      const cfg = CONFIDENCE_CONFIG[n]
                      const selected = confidence === n
                      return (
                        <motion.button
                          key={n}
                          type="button"
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setConf(n)}
                          className={cn(
                            "w-9 h-9 rounded-xl text-[13px] font-bold border-2 transition-all",
                            selected
                              ? `${cfg.bg} ring-2 border-transparent ${cfg.color}`
                              : "border-slate-100 text-slate-400 hover:border-slate-200"
                          )}
                        >
                          {n}
                        </motion.button>
                      )
                    })}
                  </div>
                  {confidence && (
                    <p className={cn("text-[12px] font-semibold mt-2", conf.color)}>
                      {conf.label}
                    </p>
                  )}
                </div>

                {/* Wins */}
                <div className="mb-4">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                    Biggest win this week
                  </label>
                  <textarea
                    value={wins}
                    onChange={e => setWins(e.target.value)}
                    rows={2}
                    placeholder="Any breakthroughs, progress, or moments of clarity?"
                    className="w-full text-[13px] text-slate-700 placeholder-slate-300 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
                  />
                </div>

                {/* Blockers */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                    What slowed you down?
                  </label>
                  <textarea
                    value={blockers}
                    onChange={e => setBlockers(e.target.value)}
                    rows={2}
                    placeholder="Blockers, distractions, or skills that felt hard?"
                    className="w-full text-[13px] text-slate-700 placeholder-slate-300 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
                  />
                </div>
              </motion.div>
            )}

            {/* ─── Step 3: Results ─────────────────────────────────────────── */}
            {step === 3 && result && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="px-6 py-5"
              >
                {/* Checkmark + score */}
                <div className="flex flex-col items-center text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
                    className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4"
                  >
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </motion.div>

                  <h2 className="text-[19px] font-bold text-slate-900">
                    Week {result.weekNumber} wrapped
                  </h2>
                  <p className="text-[13px] text-slate-400 mt-1">
                    {result.thisWeekCompleted}/{result.thisWeekTotal} milestones this week
                  </p>
                </div>

                {/* Score delta */}
                <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-4 mb-5">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Readiness score
                    </p>
                    <div className="flex items-end gap-1">
                      <span className="text-[28px] font-bold text-indigo-600 leading-none tabular-nums">
                        {result.readinessScore}
                      </span>
                      <span className="text-[12px] text-slate-400 mb-1">/ 100</span>
                    </div>
                  </div>
                  {result.readinessScore > result.previousReadinessScore && (
                    <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-[12px] font-semibold">
                      <TrendingUp className="w-3.5 h-3.5" />
                      +{result.readinessScore - result.previousReadinessScore}
                    </div>
                  )}
                </div>

                {/* AI Feedback (pro) */}
                {!result.isPremiumRequired && result.aiFeedback ? (
                  <div className="space-y-4">
                    <div className="bg-indigo-50 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest">
                          AI Analysis
                        </span>
                      </div>
                      <p className="text-[13px] text-slate-700 leading-relaxed">
                        {result.aiFeedback.summary}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                        Next week adjustments
                      </p>
                      <ul className="space-y-2">
                        {result.aiFeedback.adjustments.map((adj, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <ChevronRight className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
                            <span className="text-[13px] text-slate-600">{adj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3.5">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Focus for week {result.weekNumber + 1}
                      </p>
                      <p className="text-[13px] font-semibold text-slate-700">
                        {result.aiFeedback.nextWeekFocus}
                      </p>
                    </div>

                    <p className="text-[12.5px] text-slate-500 italic px-1">
                      &ldquo;{result.aiFeedback.encouragement}&rdquo;
                    </p>
                  </div>
                ) : (
                  /* Premium teaser for free users */
                  <div className="border border-slate-200 rounded-2xl p-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-white flex items-end justify-center pb-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-2">
                          <Lock className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="text-[12px] font-bold text-indigo-600">Pro Feature</span>
                        </div>
                        <button
                          type="button"
                          onClick={onClose}
                          className="text-[12px] bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                        >
                          Upgrade for AI feedback
                        </button>
                      </div>
                    </div>
                    <div className="blur-sm pointer-events-none select-none">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest">AI Analysis</span>
                      </div>
                      <p className="text-[13px] text-slate-700 mb-3">
                        Your completion rate signals strong momentum. The system design gap is your highest leverage area right now.
                      </p>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Next week adjustments</p>
                      <ul className="space-y-1.5">
                        {["Prioritize DDIA chapters 5–7 over new LeetCode sets",
                          "Schedule mock interview in first half of the week"].map((a, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <ChevronRight className="w-3.5 h-3.5 text-indigo-400 mt-0.5" />
                            <span className="text-[13px] text-slate-600">{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer navigation */}
        <div className="flex-shrink-0 px-6 pb-6 pt-4 border-t border-slate-100">
          {step === 1 && (
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[14px] font-semibold transition-colors"
            >
              Next →
            </button>
          )}
          {step === 2 && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="h-11 px-5 rounded-xl border border-slate-200 text-slate-600 text-[14px] font-medium hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[14px] font-semibold transition-colors"
              >
                {submitting ? "Saving…" : "Submit Check-in"}
              </button>
            </div>
          )}
          {step === 3 && (
            <button
              type="button"
              onClick={onClose}
              className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[14px] font-semibold transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
