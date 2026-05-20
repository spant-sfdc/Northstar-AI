"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { DashboardCard } from "@/components/dashboard/card"
import { cn } from "@/lib/utils"
import type { SkillGap } from "@/lib/mock-data"

const PRIORITY_DOT: Record<string, string> = {
  high:   "bg-rose-400",
  medium: "bg-amber-400",
  low:    "bg-slate-300",
}

interface Props {
  skillGaps: SkillGap[]
}

export function SkillGapOverview({ skillGaps }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  const sorted = [...skillGaps].sort((a, b) => (b.target - b.current) - (a.target - a.current))

  return (
    <DashboardCard
      title="Skill Gap Overview"
      subtitle="Current level vs. target for your role"
    >
      <div ref={ref} className="space-y-4">
        {sorted.map((item, i) => {
          const gap = item.target - item.current

          return (
            <div key={item.skill}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", PRIORITY_DOT[item.priority])} />
                  <span className="text-[13px] font-medium text-slate-700">{item.skill}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-semibold text-slate-800 tabular-nums">
                    {item.current}%
                  </span>
                  <span className="text-[11px] text-slate-400">→ {item.target}%</span>
                </div>
              </div>

              {/* Track shows full target width, fill shows current */}
              <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                {/* Target marker */}
                <div
                  className="absolute top-0 h-full border-r-2 border-slate-300 border-dashed"
                  style={{ left: `${item.target}%` }}
                />
                {/* Current fill */}
                <motion.div
                  className="h-full rounded-full bg-indigo-500"
                  initial={{ width: 0 }}
                  animate={isInView ? { width: `${item.current}%` } : {}}
                  transition={{
                    duration: 0.7,
                    delay: i * 0.08,
                    ease: [0.25, 0.4, 0.25, 1] as [number,number,number,number],
                  }}
                />
              </div>

              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-slate-400">{item.category}</span>
                <span className={cn(
                  "text-[10px] font-semibold",
                  gap >= 30 ? "text-rose-500" : gap >= 15 ? "text-amber-500" : "text-emerald-600"
                )}>
                  {gap}pt gap
                </span>
              </div>
            </div>
          )
        })}

        {/* Legend */}
        <div className="flex items-center gap-4 pt-2 border-t border-slate-100 mt-2">
          {Object.entries(PRIORITY_DOT).map(([key, cls]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={cn("w-1.5 h-1.5 rounded-full", cls)} />
              <span className="text-[10px] text-slate-400 capitalize">{key} priority</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardCard>
  )
}
