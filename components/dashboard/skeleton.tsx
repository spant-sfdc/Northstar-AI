import React from "react"
import { cn } from "@/lib/utils"

function Bone({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn("bg-slate-100 rounded-lg animate-pulse", className)} style={style} />
}

export function ReadinessScoreSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <Bone className="h-4 w-32 mb-1" />
      <Bone className="h-3 w-48 mb-6" />
      <div className="flex justify-center mb-4">
        <Bone className="w-[130px] h-[130px] rounded-full" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <div className="flex justify-between mb-1">
              <Bone className="h-3 w-28" />
              <Bone className="h-3 w-8" />
            </div>
            <Bone className="h-1.5 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function WeeklyProgressSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex justify-between mb-6">
        <div>
          <Bone className="h-4 w-36 mb-1" />
          <Bone className="h-3 w-52" />
        </div>
        <Bone className="h-10 w-16" />
      </div>
      <Bone className="h-2 w-full mb-6" />
      <div className="flex items-end gap-1.5" style={{ height: 116 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <Bone className="w-full rounded-t-md" style={{ height: 40 + Math.random() * 60 }} />
            <Bone className="h-2 w-4" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function MilestonesSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <Bone className="h-4 w-40 mb-1" />
      <Bone className="h-3 w-24 mb-6" />
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100">
            <Bone className="w-4 h-4 rounded-full mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <Bone className="h-3 w-full mb-2" />
              <div className="flex gap-2">
                <Bone className="h-4 w-20 rounded-full" />
                <Bone className="h-4 w-10" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkillGapSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <Bone className="h-4 w-40 mb-1" />
      <Bone className="h-3 w-56 mb-6" />
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i}>
            <div className="flex justify-between mb-1.5">
              <Bone className="h-3 w-32" />
              <Bone className="h-3 w-20" />
            </div>
            <Bone className="h-2 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function RoadmapTimelineSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <Bone className="h-4 w-40 mb-1" />
      <Bone className="h-3 w-32 mb-5" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-[110px] rounded-xl border border-slate-100 p-3 space-y-2">
            <Bone className="h-3 w-8" />
            <Bone className="h-4 w-20" />
            <Bone className="h-3 w-16" />
            <Bone className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function CardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <Bone className="h-4 w-40 mb-1" />
      <Bone className="h-3 w-56 mb-6" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Bone key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
