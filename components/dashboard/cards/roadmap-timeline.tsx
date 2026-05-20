"use client"

import { useRef } from "react"
import { motion } from "framer-motion"
import { CheckCircle2, CircleDot, Circle } from "lucide-react"
import { DashboardCard } from "@/components/dashboard/card"
import { cn } from "@/lib/utils"
import type { RoadmapWeek } from "@/lib/mock-data"

const STATUS_CONFIG = {
  complete: {
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
    weekText: "text-emerald-600",
    themeText: "text-slate-500",
    opacity: "opacity-80",
  },
  current: {
    border: "border-indigo-400",
    bg: "bg-indigo-50",
    icon: CircleDot,
    iconColor: "text-indigo-500",
    weekText: "text-indigo-700",
    themeText: "text-slate-800",
    opacity: "opacity-100",
  },
  upcoming: {
    border: "border-slate-200",
    bg: "bg-white",
    icon: Circle,
    iconColor: "text-slate-300",
    weekText: "text-slate-400",
    themeText: "text-slate-500",
    opacity: "opacity-100",
  },
}

interface Props {
  weeks: RoadmapWeek[]
  currentWeek: number
}

export function RoadmapTimeline({ weeks, currentWeek }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const totalComplete = weeks.filter((w) => w.status === "complete").length

  return (
    <DashboardCard
      title="Roadmap Timeline"
      subtitle={`${totalComplete} of ${weeks.length} weeks complete`}
      noPadding
    >
      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="px-6 pb-6 overflow-x-auto flex gap-3 scrollbar-hide"
        style={{ scrollbarWidth: "none" }}
      >
        {weeks.map((week, i) => {
          const cfg = STATUS_CONFIG[week.status]
          const Icon = cfg.icon

          return (
            <motion.div
              key={week.week}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className={cn(
                "flex-shrink-0 w-[110px] rounded-xl border-2 p-3 flex flex-col gap-2 transition-all",
                cfg.border,
                cfg.bg,
                cfg.opacity,
                week.status === "current" && "shadow-md shadow-indigo-100"
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn("text-[10px] font-bold uppercase tracking-wide", cfg.weekText)}>
                  W{week.week}
                </span>
                <Icon className={cn("w-3.5 h-3.5", cfg.iconColor)} />
              </div>

              <div>
                <p className={cn("text-[12.5px] font-semibold leading-snug", cfg.themeText)}>
                  {week.theme}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{week.focusArea}</p>
              </div>

              <div className="mt-auto flex items-center gap-1">
                <span className="text-[10px] text-slate-400 tabular-nums">
                  {week.milestoneCount} tasks
                </span>
              </div>

              {week.status === "current" && (
                <div className="absolute -top-1 -right-1">
                  <span className="text-[8px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                    Now
                  </span>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Fade edges hint */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white pointer-events-none rounded-r-2xl" />
    </DashboardCard>
  )
}
