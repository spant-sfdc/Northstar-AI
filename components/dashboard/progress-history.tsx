"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { TrendingUp, Lock } from "lucide-react"
import { DashboardCard } from "@/components/dashboard/card"
import { cn } from "@/lib/utils"
import type { ReadinessSnapshot } from "@/types/database"

// ─── Chart constants ──────────────────────────────────────────────────────────

const VW = 400
const VH = 110
const PAD_L = 36   // left margin for Y-axis labels
const PAD_R = 12
const PAD_T = 10
const PAD_B = 28   // bottom margin for X-axis labels
const PLOT_W = VW - PAD_L - PAD_R
const PLOT_H = VH - PAD_T - PAD_B

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSmoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return ""
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], c = pts[i]
    const cpx = (p.x + c.x) / 2
    d += ` C ${cpx} ${p.y} ${cpx} ${c.y} ${c.x} ${c.y}`
  }
  return d
}

function toPoints(
  data: { score: number }[],
  minS: number,
  maxS: number,
): { x: number; y: number }[] {
  const n = data.length
  return data.map((d, i) => ({
    x: PAD_L + (n === 1 ? PLOT_W / 2 : (i / (n - 1)) * PLOT_W),
    y: PAD_T + (1 - (d.score - minS) / (maxS - minS)) * PLOT_H,
  }))
}

// ─── Component ────────────────────────────────────────────────────────────────

const FREE_WEEK_LIMIT = 4

interface Props {
  snapshots: ReadinessSnapshot[]
  baseScore: number | null
  isPremium: boolean
  daysUntilReady: number
  milestonesCompleted: number
  milestonesTotal: number
}

export function ProgressHistory({
  snapshots,
  baseScore,
  isPremium,
  daysUntilReady,
  milestonesCompleted,
  milestonesTotal,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const isInView = useInView(svgRef, { once: true })

  // Build chart data — start point is the base AI score
  const chartData: { score: number; label: string; week: number }[] = [
    { score: baseScore ?? 50, label: "Start", week: 0 },
    ...snapshots.map(s => ({
      score: s.readiness_score,
      label: `W${s.week_number}`,
      week:  s.week_number,
    })),
  ]

  // For free users, only show first FREE_WEEK_LIMIT + 1 points (start + 4 weeks)
  const visibleCount  = isPremium ? chartData.length : Math.min(chartData.length, FREE_WEEK_LIMIT + 1)
  const visibleData   = chartData.slice(0, visibleCount)
  const hasHiddenData = !isPremium && chartData.length > FREE_WEEK_LIMIT + 1

  const scores = visibleData.map(d => d.score)
  const minS   = Math.max(0,   Math.min(...scores) - 8)
  const maxS   = Math.min(100, Math.max(...scores) + 8)

  const pts      = toPoints(visibleData, minS, maxS)
  const linePath = buildSmoothPath(pts)
  const areaPath = pts.length >= 2
    ? `${linePath} L ${pts[pts.length - 1].x} ${PAD_T + PLOT_H} L ${pts[0].x} ${PAD_T + PLOT_H} Z`
    : ""

  const current  = chartData[chartData.length - 1]?.score ?? baseScore ?? 50
  const initial  = chartData[0]?.score ?? baseScore ?? 50
  const delta    = current - initial
  const isUp     = delta > 0

  const pct = milestonesTotal > 0 ? Math.round((milestonesCompleted / milestonesTotal) * 100) : 0

  return (
    <DashboardCard title="Progress History" subtitle="Readiness score over time">
      <div className="space-y-4">
        {/* Score headline */}
        <div className="flex items-end justify-between">
          <div>
            <span className="text-[36px] font-bold text-slate-900 leading-none tabular-nums">{current}</span>
            <span className="text-[14px] text-slate-400 ml-1">/ 100</span>
          </div>
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold",
            isUp ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
          )}>
            <TrendingUp className={cn("w-3.5 h-3.5", isUp ? "text-emerald-500" : "text-slate-400")} />
            {isUp ? `+${delta}` : delta} from start
          </div>
        </div>

        {/* Chart */}
        {snapshots.length === 0 ? (
          <div className="h-[VH]px flex flex-col items-center justify-center py-8 text-center">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
            </div>
            <p className="text-[13px] font-medium text-slate-600">No check-ins yet</p>
            <p className="text-[12px] text-slate-400 mt-1">
              Complete your first weekly review to start tracking your score.
            </p>
          </div>
        ) : (
          <div className="relative">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${VW} ${VH}`}
              className="w-full"
              style={{ height: VH }}
            >
              <defs>
                <linearGradient id="hist-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="rgb(99,102,241)" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="rgb(99,102,241)" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Y-axis labels */}
              {[minS, Math.round((minS + maxS) / 2), maxS].map((v) => {
                const y = PAD_T + (1 - (v - minS) / (maxS - minS)) * PLOT_H
                return (
                  <text key={v} x={PAD_L - 6} y={y + 4} textAnchor="end"
                    className="fill-slate-400" style={{ fontSize: 9 }}>
                    {Math.round(v)}
                  </text>
                )
              })}

              {/* Grid lines */}
              {[minS, Math.round((minS + maxS) / 2), maxS].map((v) => {
                const y = PAD_T + (1 - (v - minS) / (maxS - minS)) * PLOT_H
                return (
                  <line key={`g${v}`} x1={PAD_L} y1={y} x2={VW - PAD_R} y2={y}
                    stroke="#f1f5f9" strokeWidth={1} />
                )
              })}

              {/* Area */}
              {areaPath && (
                <motion.path
                  d={areaPath}
                  fill="url(#hist-fill)"
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 }}
                />
              )}

              {/* Line */}
              {linePath && (
                <motion.path
                  d={linePath}
                  fill="none"
                  stroke="rgb(99,102,241)"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={isInView ? { pathLength: 1 } : {}}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                />
              )}

              {/* Data dots */}
              {pts.map((p, i) => (
                <motion.circle
                  key={i}
                  cx={p.x} cy={p.y} r={i === pts.length - 1 ? 4.5 : 3}
                  fill={i === pts.length - 1 ? "rgb(99,102,241)" : "white"}
                  stroke="rgb(99,102,241)"
                  strokeWidth={2}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.2, delay: 0.8 + i * 0.06 }}
                />
              ))}

              {/* X-axis labels */}
              {visibleData.map((d, i) => {
                const x = PAD_L + (visibleData.length === 1
                  ? PLOT_W / 2
                  : (i / (visibleData.length - 1)) * PLOT_W)
                return (
                  <text key={i} x={x} y={VH - 4} textAnchor="middle"
                    className="fill-slate-400" style={{ fontSize: 9 }}>
                    {d.label}
                  </text>
                )
              })}
            </svg>

            {/* Premium blur overlay */}
            {hasHiddenData && (
              <div className="absolute inset-y-0 right-0 w-2/5 flex flex-col items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/95 rounded-r-xl" />
                <div className="relative z-10 flex flex-col items-center text-center px-3">
                  <Lock className="w-4 h-4 text-slate-400 mb-1.5" />
                  <p className="text-[10.5px] font-semibold text-slate-500 leading-tight">
                    {chartData.length - visibleCount} more weeks
                  </p>
                  <p className="text-[9.5px] text-slate-400 mt-0.5">Pro unlocks full history</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Milestone progress bar */}
        <div className="pt-1">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[12px] text-slate-500 font-medium">Overall progress</span>
            <span className="text-[12px] text-slate-500 tabular-nums">
              {milestonesCompleted}/{milestonesTotal} milestones · {daysUntilReady}d left
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-500 rounded-full"
              initial={{ width: 0 }}
              animate={isInView ? { width: `${pct}%` } : {}}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number] }}
            />
          </div>
          <p className="text-[10.5px] text-slate-400 mt-1.5 text-right">{pct}% of roadmap complete</p>
        </div>
      </div>
    </DashboardCard>
  )
}
