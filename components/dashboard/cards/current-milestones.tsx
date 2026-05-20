"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Circle, Clock, ChevronRight } from "lucide-react"
import { DashboardCard } from "@/components/dashboard/card"
import { cn } from "@/lib/utils"
import type { DbMilestone } from "@/types/database"

const STATUS_CONFIG = {
  complete:    { icon: CheckCircle2, color: "text-emerald-500" },
  in_progress: { icon: Clock,        color: "text-indigo-500"  },
  not_started: { icon: Circle,       color: "text-slate-300"   },
}

const CATEGORY_COLORS: Record<string, string> = {
  technical:  "bg-blue-50 text-blue-600",
  design:     "bg-violet-50 text-violet-600",
  behavioral: "bg-amber-50 text-amber-600",
  jobsearch:  "bg-emerald-50 text-emerald-700",
  // display aliases the AI might produce
  "system design":  "bg-violet-50 text-violet-600",
  "algorithms":     "bg-blue-50 text-blue-600",
  "interview prep": "bg-rose-50 text-rose-600",
  "job search":     "bg-emerald-50 text-emerald-700",
  "personal brand": "bg-pink-50 text-pink-600",
}

interface Props {
  milestones: DbMilestone[]
  weekNumber: number
  totalCompleted: number
  totalMilestones: number
}

export function CurrentMilestones({ milestones, weekNumber, totalCompleted, totalMilestones }: Props) {
  // Optimistic local state: id → 'complete' | 'not_started'
  const [overrides, setOverrides] = useState<Record<string, "complete" | "not_started">>({})
  const [pending, setPending]     = useState<Set<string>>(new Set())

  const currentWeek = milestones.filter(m => m.week_number === weekNumber)
  const nextWeek    = milestones.filter(m => m.week_number === weekNumber + 1)

  function getStatus(m: DbMilestone): "complete" | "in_progress" | "not_started" {
    if (overrides[m.id] !== undefined) return overrides[m.id]
    return m.status
  }

  const toggle = useCallback(async (m: DbMilestone) => {
    if (pending.has(m.id)) return
    const currentStatus = overrides[m.id] ?? m.status
    const willComplete  = currentStatus !== "complete"

    // Optimistic update
    setOverrides(prev => ({ ...prev, [m.id]: willComplete ? "complete" : "not_started" }))
    setPending(prev => new Set(prev).add(m.id))

    try {
      const res = await fetch(`/api/progress/milestones/${m.id}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complete: willComplete }),
      })
      if (!res.ok) throw new Error("failed")
    } catch {
      // Revert
      setOverrides(prev => ({ ...prev, [m.id]: willComplete ? "not_started" : "complete" }))
    } finally {
      setPending(prev => { const n = new Set(prev); n.delete(m.id); return n })
    }
  }, [overrides, pending])

  function renderGroup(label: string, items: DbMilestone[]) {
    if (items.length === 0) return null
    return (
      <div key={label}>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
          {label}
        </p>
        <div className="space-y-1.5">
          {items.map(m => {
            const status = getStatus(m)
            const done   = status === "complete"
            const cfg    = STATUS_CONFIG[status]
            const Icon   = cfg.icon
            const catKey = m.category.toLowerCase()
            const catColor = CATEGORY_COLORS[catKey] ?? "bg-slate-100 text-slate-500"

            return (
              <motion.button
                key={m.id}
                type="button"
                onClick={() => toggle(m)}
                disabled={pending.has(m.id)}
                whileTap={{ scale: 0.99 }}
                className={cn(
                  "w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-colors",
                  done
                    ? "bg-emerald-50/60 border-emerald-100"
                    : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50",
                  pending.has(m.id) && "opacity-60 cursor-wait"
                )}
              >
                <AnimatePresence mode="wait">
                  {done ? (
                    <motion.div key="chk" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    </motion.div>
                  ) : (
                    <motion.div key="unc" initial={{ scale: 1 }} animate={{ scale: 1 }}>
                      <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", cfg.color)} />
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
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", catColor)}>
                      {m.category}
                    </span>
                    <span className="text-[10.5px] text-slate-400">
                      {m.estimated_hours}h
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 mt-0.5 flex-shrink-0" />
              </motion.button>
            )
          })}
        </div>
      </div>
    )
  }

  const hasAny = currentWeek.length > 0 || nextWeek.length > 0

  return (
    <DashboardCard
      title="Current Milestones"
      subtitle={`Week ${weekNumber} focus`}
      action={
        <span className="text-[12px] text-slate-400 font-medium tabular-nums">
          {totalCompleted}/{totalMilestones} total
        </span>
      }
    >
      {!hasAny ? (
        <div className="py-6 text-center text-slate-400">
          <p className="text-[13px]">Milestones loading…</p>
          <p className="text-[12px] mt-1">They appear after your first analysis completes.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {renderGroup(`Week ${weekNumber} — This week`, currentWeek)}
          {renderGroup(`Week ${weekNumber + 1} — Coming up`, nextWeek)}
        </div>
      )}
    </DashboardCard>
  )
}
