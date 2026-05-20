"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Circle, Clock, ChevronDown, ChevronRight } from "lucide-react"
import { DashboardCard } from "@/components/dashboard/card"
import { cn } from "@/lib/utils"
import type { DbMilestone } from "@/types/database"

const CATEGORY_COLORS: Record<string, string> = {
  technical:        "bg-blue-50 text-blue-600 border-blue-100",
  design:           "bg-violet-50 text-violet-600 border-violet-100",
  behavioral:       "bg-amber-50 text-amber-700 border-amber-100",
  jobsearch:        "bg-emerald-50 text-emerald-700 border-emerald-100",
  "system design":  "bg-violet-50 text-violet-600 border-violet-100",
  algorithms:       "bg-blue-50 text-blue-600 border-blue-100",
  "interview prep": "bg-rose-50 text-rose-600 border-rose-100",
  "job search":     "bg-emerald-50 text-emerald-700 border-emerald-100",
  "personal brand": "bg-pink-50 text-pink-600 border-pink-100",
}

interface Props {
  milestones:  DbMilestone[]
  weekNumber:  number
  isPremium:   boolean
}

export function MilestonesBoard({ milestones, weekNumber, isPremium }: Props) {
  const [overrides, setOverrides] = useState<Record<string, "complete" | "not_started">>({})
  const [pending,   setPending]   = useState<Set<string>>(new Set())
  const [expanded,  setExpanded]  = useState<Record<number, boolean>>(() => {
    // Default: current week and previous week expanded
    const init: Record<number, boolean> = {}
    const wks = [...new Set(milestones.map(m => m.week_number))]
    for (const w of wks) {
      init[w] = w >= weekNumber - 1
    }
    return init
  })

  function getStatus(m: DbMilestone): "complete" | "in_progress" | "not_started" {
    if (overrides[m.id] !== undefined) return overrides[m.id]
    return m.status
  }

  const toggle = useCallback(async (m: DbMilestone) => {
    if (pending.has(m.id)) return
    const current     = overrides[m.id] ?? m.status
    const willComplete = current !== "complete"

    setOverrides(prev => ({ ...prev, [m.id]: willComplete ? "complete" : "not_started" }))
    setPending(prev => new Set(prev).add(m.id))

    try {
      const res = await fetch(`/api/progress/milestones/${m.id}/complete`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ complete: willComplete }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setOverrides(prev => ({ ...prev, [m.id]: willComplete ? "not_started" : "complete" }))
    } finally {
      setPending(prev => { const n = new Set(prev); n.delete(m.id); return n })
    }
  }, [overrides, pending])

  // Group by week
  const weeks = [...new Set(milestones.map(m => m.week_number))].sort((a, b) => a - b)
  const byWeek: Record<number, DbMilestone[]> = {}
  for (const m of milestones) {
    if (!byWeek[m.week_number]) byWeek[m.week_number] = []
    byWeek[m.week_number].push(m)
  }

  // Global stats
  const totalCompleted  = milestones.filter(m => getStatus(m) === "complete").length
  const totalMilestones = milestones.length
  const pct = totalMilestones ? Math.round((totalCompleted / totalMilestones) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Overall progress bar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[14px] font-semibold text-slate-800">Overall Progress</p>
            <p className="text-[12px] text-slate-400 mt-0.5">{totalCompleted} of {totalMilestones} milestones completed</p>
          </div>
          <span className="text-[24px] font-bold text-slate-900 tabular-nums">{pct}%</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          />
        </div>
        <div className="flex gap-4 mt-3">
          {[
            { label: "Complete",    count: totalCompleted,                          color: "text-emerald-600" },
            { label: "In progress", count: milestones.filter(m => getStatus(m) === "in_progress").length, color: "text-blue-600"    },
            { label: "Not started", count: milestones.filter(m => getStatus(m) === "not_started").length, color: "text-slate-400"   },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span className={cn("text-[13px] font-semibold tabular-nums", s.color)}>{s.count}</span>
              <span className="text-[11px] text-slate-400">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Week groups */}
      {weeks.map(week => {
        const wMs        = byWeek[week] ?? []
        const wCompleted = wMs.filter(m => getStatus(m) === "complete").length
        const isCurrent  = week === weekNumber
        const isPast     = week < weekNumber
        const isOpen     = expanded[week] ?? false

        return (
          <div
            key={week}
            className={cn(
              "bg-white rounded-2xl border shadow-sm overflow-hidden",
              isCurrent ? "border-blue-200" : "border-slate-100"
            )}
          >
            {/* Week header — clickable to expand/collapse */}
            <button
              type="button"
              onClick={() => setExpanded(prev => ({ ...prev, [week]: !prev[week] }))}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0",
                  isCurrent ? "bg-blue-600 text-white" :
                  isPast    ? "bg-emerald-500 text-white" :
                              "bg-slate-100 text-slate-500"
                )}>
                  {isPast && wCompleted === wMs.length ? "✓" : `W${week}`}
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-semibold text-slate-800">
                    Week {week}
                    {isCurrent && (
                      <span className="ml-2 text-[9px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">
                        Current
                      </span>
                    )}
                  </p>
                  <p className="text-[11.5px] text-slate-400 tabular-nums">
                    {wCompleted}/{wMs.length} completed
                    {wMs.reduce((s, m) => s + m.estimated_hours, 0) > 0 && (
                      <span> · {wMs.reduce((s, m) => s + m.estimated_hours, 0)}h total</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      isPast && wCompleted === wMs.length ? "bg-emerald-500" : "bg-blue-500"
                    )}
                    style={{ width: `${wMs.length ? (wCompleted / wMs.length) * 100 : 0}%` }}
                  />
                </div>
                {isOpen
                  ? <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  : <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />}
              </div>
            </button>

            {/* Milestone list */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-4 space-y-2 border-t border-slate-100">
                    <div className="h-3" />
                    {wMs.map(m => {
                      const status  = getStatus(m)
                      const done    = status === "complete"
                      const catKey  = m.category.toLowerCase()
                      const catColor = CATEGORY_COLORS[catKey] ?? "bg-slate-100 text-slate-500 border-slate-100"
                      const locked  = m.is_premium && !isPremium

                      return (
                        <motion.button
                          key={m.id}
                          type="button"
                          onClick={() => !locked && toggle(m)}
                          disabled={pending.has(m.id) || locked}
                          whileTap={locked ? undefined : { scale: 0.99 }}
                          className={cn(
                            "w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-colors",
                            done    ? "bg-emerald-50/60 border-emerald-100"
                            : locked ? "bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed"
                            :          "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50",
                            pending.has(m.id) && "opacity-60 cursor-wait"
                          )}
                        >
                          <AnimatePresence mode="wait">
                            {done ? (
                              <motion.div key="done" initial={{ scale: 0.6 }} animate={{ scale: 1 }} exit={{ scale: 0.6 }}>
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                              </motion.div>
                            ) : status === "in_progress" ? (
                              <motion.div key="prog" initial={{ scale: 1 }} animate={{ scale: 1 }}>
                                <Clock className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                              </motion.div>
                            ) : (
                              <motion.div key="todo" initial={{ scale: 1 }} animate={{ scale: 1 }}>
                                <Circle className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-[13px] font-medium leading-snug",
                              done ? "line-through text-slate-400" : "text-slate-700"
                            )}>
                              {m.title}
                            </p>
                            {m.description && !done && (
                              <p className="text-[11.5px] text-slate-400 mt-0.5 leading-snug line-clamp-2">
                                {m.description}
                              </p>
                            )}
                            {m.success_criteria && !done && (
                              <p className="text-[11px] text-slate-400 mt-1 italic">
                                Done when: {m.success_criteria}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", catColor)}>
                                {m.category}
                              </span>
                              {m.estimated_hours > 0 && (
                                <span className="text-[10.5px] text-slate-400">
                                  {m.estimated_hours}h
                                </span>
                              )}
                              {locked && (
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                  Premium
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
