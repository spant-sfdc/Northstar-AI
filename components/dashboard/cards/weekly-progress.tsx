"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { DashboardCard } from "@/components/dashboard/card"
import { cn } from "@/lib/utils"
import type { WeeklyProgressPoint } from "@/lib/mock-data"

const MAX_BAR_HEIGHT = 88

interface Props {
  data: WeeklyProgressPoint[]
  hoursThisWeek: number
  hoursTarget: number
}

export function WeeklyProgress({ data, hoursThisWeek, hoursTarget }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })
  const maxHours = Math.max(...data.map((d) => d.hours), data[0].target)
  const pct = Math.round((hoursThisWeek / hoursTarget) * 100)

  return (
    <DashboardCard
      title="Weekly Progress"
      subtitle="Hours invested over the last 8 weeks"
      action={
        <div className="text-right">
          <p className="text-[20px] font-bold text-slate-900 leading-none tabular-nums">
            {hoursThisWeek}
            <span className="text-[12px] font-medium text-slate-400">/{hoursTarget}h</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">this week</p>
        </div>
      }
    >
      <div ref={ref}>
        {/* This week progress bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11.5px] text-slate-500">This week</span>
            <span className={cn(
              "text-[11.5px] font-semibold",
              pct >= 100 ? "text-emerald-600" : pct >= 60 ? "text-indigo-600" : "text-amber-600"
            )}>
              {pct}%
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                pct >= 100 ? "bg-emerald-500" : "bg-indigo-500"
              )}
              initial={{ width: 0 }}
              animate={isInView ? { width: `${Math.min(pct, 100)}%` } : {}}
              transition={{ duration: 0.9, ease: [0.25, 0.4, 0.25, 1] as [number,number,number,number] }}
            />
          </div>
        </div>

        {/* Bar chart */}
        <div className="flex items-end justify-between gap-1" style={{ height: MAX_BAR_HEIGHT + 28 }}>
          {data.map((d, i) => {
            const height = Math.round((d.hours / maxHours) * MAX_BAR_HEIGHT)
            const isLatest = i === data.length - 1

            return (
              <div key={d.week} className="flex flex-col items-center gap-1.5 flex-1">
                <motion.div
                  className={cn(
                    "w-full rounded-t-md",
                    isLatest ? "bg-indigo-500" : "bg-indigo-200"
                  )}
                  initial={{ height: 0 }}
                  animate={isInView ? { height } : { height: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: i * 0.06,
                    ease: [0.25, 0.4, 0.25, 1] as [number,number,number,number],
                  }}
                />
                <span className={cn(
                  "text-[10px] font-medium",
                  isLatest ? "text-indigo-600" : "text-slate-400"
                )}>
                  {d.week}
                </span>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
            <span className="text-[11px] text-slate-400">Current week</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-indigo-200" />
            <span className="text-[11px] text-slate-400">Past weeks</span>
          </div>
        </div>
      </div>
    </DashboardCard>
  )
}
