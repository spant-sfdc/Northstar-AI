"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { TrendingUp } from "lucide-react"
import { DashboardCard } from "@/components/dashboard/card"
import { cn } from "@/lib/utils"
import type { ConfidencePoint } from "@/lib/mock-data"
import type { ReadinessSnapshot } from "@/types/database"

const W = 280
const H = 80
const PAD = 8

function buildPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return ""
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const cpx = (prev.x + curr.x) / 2
    d += ` C ${cpx} ${prev.y} ${cpx} ${curr.y} ${curr.x} ${curr.y}`
  }
  return d
}

interface Props {
  history: ConfidencePoint[]
  snapshots?: ReadinessSnapshot[]
  baseConfidence?: number
}

export function ConfidenceTracker({ history, snapshots, baseConfidence }: Props) {
  // If real snapshot data exists, use it; otherwise fall back to static history
  const effectiveHistory: ConfidencePoint[] = snapshots && snapshots.length > 0
    ? [
        { label: "Start", score: baseConfidence ?? history[0].score },
        ...snapshots.map(s => ({ label: `W${s.week_number}`, score: s.confidence_score })),
      ]
    : history
  const ref = useRef<SVGSVGElement>(null)
  const isInView = useInView(ref, { once: true })

  const minScore = 1
  const maxScore = 10
  const current = effectiveHistory[effectiveHistory.length - 1].score
  const first = effectiveHistory[0].score
  const delta = current - first
  const isUp = delta > 0

  const points = effectiveHistory.map((d, i) => ({
    x: PAD + (effectiveHistory.length === 1 ? (W - PAD * 2) / 2 : (i / (effectiveHistory.length - 1)) * (W - PAD * 2)),
    y: H - PAD - ((d.score - minScore) / (maxScore - minScore)) * (H - PAD * 2),
  }))

  const linePath = buildPath(points)
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${H} L ${points[0].x} ${H} Z`

  return (
    <DashboardCard
      title="Confidence Tracker"
      subtitle="Your self-rated confidence over time"
    >
      {/* Score and trend */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <span className="text-[40px] font-bold text-slate-900 leading-none tabular-nums">
            {current}
          </span>
          <span className="text-[15px] text-slate-400 ml-1">/10</span>
        </div>
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold",
          isUp ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
        )}>
          <TrendingUp className={cn("w-3.5 h-3.5", isUp ? "text-emerald-500" : "text-slate-400")} />
          {isUp ? `+${delta}` : delta} since start
        </div>
      </div>

      {/* Sparkline */}
      <div className="relative">
        <svg
          ref={ref}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: H }}
        >
          <defs>
            <linearGradient id="conf-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="rgb(99,102,241)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="rgb(99,102,241)" stopOpacity="0"    />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <motion.path
            d={areaPath}
            fill="url(#conf-fill)"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
          />

          {/* Line */}
          <motion.path
            d={linePath}
            fill="none"
            stroke="rgb(99,102,241)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={isInView ? { pathLength: 1 } : {}}
            transition={{ duration: 1, ease: "easeInOut" }}
          />

          {/* Dots */}
          {points.map((p, i) => (
            <motion.circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={3}
              fill="white"
              stroke="rgb(99,102,241)"
              strokeWidth={2}
              initial={{ opacity: 0, scale: 0 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.2, delay: 0.8 + i * 0.05 }}
            />
          ))}
        </svg>

        {/* X-axis labels */}
        <div className="flex justify-between mt-1.5">
          {effectiveHistory.map((d, i) => (
            <span key={i} className={cn(
              "text-[10px] font-medium",
              i === effectiveHistory.length - 1 ? "text-indigo-500" : "text-slate-400"
            )}>
              {d.label}
            </span>
          ))}
        </div>
      </div>
    </DashboardCard>
  )
}
