"use client"

import { useState } from "react"
import { AnimatePresence } from "framer-motion"
import { Calendar, CheckCircle2, ChevronRight } from "lucide-react"
import { DashboardCard } from "@/components/dashboard/card"
import { WeeklyReviewModal } from "@/components/dashboard/weekly-review-modal"
import { PremiumGate } from "@/components/dashboard/premium-gate"
import { cn } from "@/lib/utils"
import type { DbMilestone, WeeklyCheckIn } from "@/types/database"

interface Props {
  weekNumber: number
  milestones: DbMilestone[]
  existingCheckin: WeeklyCheckIn | null
  isPremium: boolean
}

export function WeeklyCheckin({ weekNumber, milestones, existingCheckin, isPremium }: Props) {
  const [showModal, setShowModal]         = useState(false)
  const [showGate, setShowGate]           = useState(false)

  const thisWeekMilestones = milestones.filter(m => m.week_number === weekNumber)
  const completedThisWeek  = thisWeekMilestones.filter(m => m.status === "complete").length

  function handleStartReview() {
    // Free users can only review weeks 1–4
    if (!isPremium && weekNumber > 4) {
      setShowGate(true)
    } else {
      setShowModal(true)
    }
  }

  return (
    <>
      <DashboardCard
        title="Weekly Check-in"
        subtitle={existingCheckin ? `Week ${weekNumber} complete` : `Week ${weekNumber} · Due this week`}
        action={
          existingCheckin ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> Done
            </span>
          ) : null
        }
      >
        {existingCheckin ? (
          /* ── Already checked in this week ── */
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-[22px] font-bold text-slate-900 tabular-nums leading-none">
                  {existingCheckin.completed_milestone_ids.length}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">milestones done</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-[22px] font-bold text-indigo-600 tabular-nums leading-none">
                  {existingCheckin.confidence_score}
                  <span className="text-[14px] text-slate-400">/10</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-1">confidence</p>
              </div>
            </div>

            {existingCheckin.wins && (
              <div className="bg-emerald-50 rounded-xl p-3">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Win</p>
                <p className="text-[12.5px] text-slate-700 leading-snug line-clamp-2">
                  {existingCheckin.wins}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleStartReview}
              className="w-full flex items-center justify-center gap-1.5 text-[12.5px] text-indigo-600 hover:text-indigo-700 font-semibold transition-colors py-1"
            >
              Update this week
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* ── Not checked in yet ── */
          <div className="space-y-4 pt-2">
            {/* This week stats */}
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="text-slate-500">This week&apos;s milestones</span>
              <span className={cn(
                "font-semibold tabular-nums",
                completedThisWeek === thisWeekMilestones.length && thisWeekMilestones.length > 0
                  ? "text-emerald-600"
                  : "text-slate-700"
              )}>
                {completedThisWeek}/{thisWeekMilestones.length}
              </span>
            </div>

            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{
                  width: thisWeekMilestones.length > 0
                    ? `${Math.round((completedThisWeek / thisWeekMilestones.length) * 100)}%`
                    : "0%"
                }}
              />
            </div>

            <div className="bg-indigo-50 rounded-xl p-3.5">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-[11.5px] font-semibold text-indigo-700">Weekly review</span>
              </div>
              <p className="text-[12px] text-slate-500 leading-snug">
                Log your progress, rate your confidence, and get AI insights on what to adjust next week.
              </p>
            </div>

            <button
              type="button"
              onClick={handleStartReview}
              className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[13.5px] font-semibold transition-colors"
            >
              Start weekly review →
            </button>
          </div>
        )}
      </DashboardCard>

      {/* Modals */}
      <AnimatePresence>
        {showModal && (
          <WeeklyReviewModal
            weekNumber={weekNumber}
            milestones={milestones}
            isPremium={isPremium}
            onClose={() => setShowModal(false)}
          />
        )}
        {showGate && (
          <PremiumGate
            feature="Week 5+ Reviews"
            description="Free users can track up to 4 weeks. Upgrade to Pro to log check-ins for your full roadmap."
            onClose={() => setShowGate(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
