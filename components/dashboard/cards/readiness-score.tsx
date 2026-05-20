"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import { DashboardCard } from "@/components/dashboard/card"
import { cn } from "@/lib/utils"
import type { DashboardData } from "@/lib/mock-data"

const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function scoreColor(score: number) {
  if (score < 40) return { stroke: "#f87171", text: "text-red-500",     bg: "bg-red-50",     label: "Early stage"  }
  if (score < 60) return { stroke: "#fb923c", text: "text-orange-500",  bg: "bg-orange-50",  label: "Building up"  }
  if (score < 75) return { stroke: "#6366f1", text: "text-indigo-600",  bg: "bg-indigo-50",  label: "Getting close" }
  return               { stroke: "#10b981", text: "text-emerald-600",   bg: "bg-emerald-50", label: "Ready soon"   }
}

interface Props {
  score: number
  breakdown: DashboardData["readinessBreakdown"]
}

export function ReadinessScore({ score, breakdown }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })
  const [displayed, setDisplayed] = useState(0)
  const color = scoreColor(score)
  const dashOffset = CIRCUMFERENCE * (1 - score / 100)

  useEffect(() => {
    if (!isInView) return
    const start = Date.now()
    const duration = 1200
    const raf = requestAnimationFrame(function tick() {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(eased * score))
      if (progress < 1) requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(raf)
  }, [isInView, score])

  return (
    <DashboardCard
      title="Readiness Score"
      subtitle="Based on your profile & progress"
    >
      <div ref={ref} className="flex flex-col items-center pt-2 pb-4">
        {/* Gauge */}
        <div className="relative w-[130px] h-[130px]">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            {/* Track */}
            <circle
              cx={60} cy={60} r={RADIUS}
              fill="none"
              stroke="#f1f5f9"
              strokeWidth={10}
            />
            {/* Progress */}
            <motion.circle
              cx={60} cy={60} r={RADIUS}
              fill="none"
              stroke={color.stroke}
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
              animate={isInView ? { strokeDashoffset: dashOffset } : {}}
              transition={{ duration: 1.2, ease: [0.25, 0.4, 0.25, 1] as [number,number,number,number] }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-[32px] font-bold leading-none tabular-nums", color.text)}>
              {displayed}
            </span>
            <span className="text-[10px] text-slate-400 font-medium mt-1">out of 100</span>
          </div>
        </div>

        {/* Label */}
        <span className={cn("mt-3 text-[12px] font-semibold px-3 py-1 rounded-full", color.bg, color.text)}>
          {color.label}
        </span>

        {/* Breakdown */}
        <div className="w-full mt-5 space-y-3">
          {breakdown.map((item) => (
            <div key={item.label}>
              <div className="flex justify-between mb-1">
                <span className="text-[11.5px] text-slate-600 font-medium">{item.label}</span>
                <span className="text-[11.5px] text-slate-400 tabular-nums">{item.score}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-indigo-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={isInView ? { width: `${item.score}%` } : {}}
                  transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.4, 0.25, 1] as [number,number,number,number] }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardCard>
  )
}
