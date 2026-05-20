"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Circle, Clock } from "lucide-react"
import { DashboardCard } from "@/components/dashboard/card"
import { cn } from "@/lib/utils"
import type { NextAction } from "@/lib/mock-data"

const PRIORITY_CONFIG = {
  high:   { bar: "bg-rose-400",   badge: "bg-rose-50 text-rose-600"   },
  medium: { bar: "bg-amber-400",  badge: "bg-amber-50 text-amber-700" },
  low:    { bar: "bg-slate-300",  badge: "bg-slate-100 text-slate-500" },
}

function formatMinutes(min: number) {
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

interface Props {
  actions: NextAction[]
}

export function NextActions({ actions }: Props) {
  const [done, setDone] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setDone((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const sorted = [...actions].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 }
    return order[a.priority] - order[b.priority]
  })

  return (
    <DashboardCard
      title="Recommended Next Actions"
      subtitle="Do these first"
    >
      <div className="space-y-2">
        <AnimatePresence>
          {sorted.map((action) => {
            const isDone = done.has(action.id)
            const cfg = PRIORITY_CONFIG[action.priority]

            return (
              <motion.button
                key={action.id}
                type="button"
                onClick={() => toggle(action.id)}
                whileTap={{ scale: 0.99 }}
                layout
                animate={{ opacity: isDone ? 0.5 : 1 }}
                className={cn(
                  "w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-colors relative overflow-hidden",
                  isDone
                    ? "bg-slate-50 border-slate-100"
                    : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                )}
              >
                {/* Priority bar */}
                <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-xl", cfg.bar)} />

                <div className="pl-1 mt-0.5 flex-shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-[12.5px] font-medium leading-snug",
                    isDone ? "line-through text-slate-400" : "text-slate-700"
                  )}>
                    {action.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", cfg.badge)}>
                      {action.priority}
                    </span>
                    <span className="flex items-center gap-1 text-[10.5px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      {formatMinutes(action.estimatedMinutes)}
                    </span>
                    <span className="text-[10px] text-slate-400">{action.category}</span>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>
    </DashboardCard>
  )
}
