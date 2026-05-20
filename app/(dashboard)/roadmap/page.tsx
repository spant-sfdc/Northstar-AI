import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { CheckCircle2, CircleDot, Circle, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { ReadinessAnalysisSchema } from "@/lib/ai/schemas"
import { analysisToDisplay } from "@/lib/ai/map-to-display"
import { AnalysisGenerating } from "@/components/dashboard/analysis-generating"
import { Topbar } from "@/components/dashboard/topbar"
import { DashboardCard } from "@/components/dashboard/card"
import { cn } from "@/lib/utils"
import type { DbMilestone } from "@/types/database"

export const metadata: Metadata = { title: "Roadmap" }
export const dynamic = "force-dynamic"

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

function parseWeekRange(weeks: string): [number, number] {
  const parts = weeks.split(/[–\-]/).map(s => parseInt(s.trim(), 10))
  return [parts[0] ?? 1, parts[1] ?? parts[0] ?? 1]
}

export default async function RoadmapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const userName = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "You"

  const { data: submission } = await supabase
    .from("onboarding_submissions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "complete")
    .maybeSingle()
  if (!submission) redirect("/onboarding")

  const [{ data: roadmap }, { data: dbMilestones }, { data: snapshots }] = await Promise.all([
    supabase
      .from("roadmaps")
      .select("id, gap_analysis, readiness_score, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("milestones")
      .select("*")
      .eq("user_id", user.id)
      .order("week_number", { ascending: true })
      .order("order_index", { ascending: true }),
    supabase
      .from("readiness_snapshots")
      .select("*")
      .eq("user_id", user.id)
      .order("week_number", { ascending: true }),
  ])

  if (!roadmap?.gap_analysis) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <AnalysisGenerating />
      </main>
    )
  }

  const parsed = ReadinessAnalysisSchema.safeParse(roadmap.gap_analysis)
  if (!parsed.success) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <AnalysisGenerating />
      </main>
    )
  }

  const analysis = parsed.data
  const d = analysisToDisplay(analysis, {
    userName,
    userEmail:             user.email ?? "",
    currentRole:           submission.current_role,
    targetRole:            submission.target_role,
    targetCompanySize:     submission.target_company_size,
    timelineMonths:        submission.target_timeline_months,
    availableHoursPerWeek: submission.available_hours_per_week,
    confidenceScore:       submission.confidence_score,
    submittedAt:           submission.completed_at ?? submission.created_at,
  })

  const allMilestones  = dbMilestones ?? []
  const weekNumber     = d.user.weekNumber
  const allSnapshots   = snapshots ?? []
  const totalWeeks     = analysis.roadmap.totalWeeks
  const totalHours     = analysis.roadmap.totalHours
  const completedWeeks = d.roadmapWeeks.filter(w => w.status === "complete").length

  // Group DB milestones by week_number
  const milestonesByWeek: Record<number, DbMilestone[]> = {}
  for (const m of allMilestones) {
    if (!milestonesByWeek[m.week_number]) milestonesByWeek[m.week_number] = []
    milestonesByWeek[m.week_number].push(m)
  }

  const STAT_CARDS = [
    { label: "Total weeks",    value: String(totalWeeks),     sub: `${completedWeeks} complete`           },
    { label: "Est. hours",     value: String(totalHours),     sub: `${submission.available_hours_per_week}h/week pace` },
    { label: "Readiness",      value: `${roadmap.readiness_score ?? analysis.readinessScore}`,  sub: "out of 100"                    },
    { label: "Target role",    value: submission.target_role, sub: submission.target_company_size + " companies" },
  ]

  return (
    <>
      <Topbar user={d.user} greeting={getGreeting()} streakDays={allSnapshots.length} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1280px] mx-auto px-6 py-6 space-y-6">

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STAT_CARDS.map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                  {s.label}
                </p>
                <p className="text-[20px] font-bold text-slate-900 leading-none truncate">
                  {s.value}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 truncate">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Phases */}
          <DashboardCard
            title="Execution Phases"
            subtitle={`${analysis.roadmap.phases.length} phases · ${totalWeeks}-week journey`}
          >
            <div className="space-y-3">
              {analysis.roadmap.phases.map((phase, i) => {
                const [start, end] = parseWeekRange(phase.weeks)
                const isCurrent = weekNumber >= start && weekNumber <= end
                const isPast    = weekNumber > end

                return (
                  <div
                    key={i}
                    className={cn(
                      "rounded-xl border p-4 transition-all",
                      isCurrent ? "border-blue-200 bg-blue-50"        :
                      isPast    ? "border-emerald-100 bg-emerald-50/50" :
                                  "border-slate-100 bg-white"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-start gap-2.5">
                        {isPast    && <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />}
                        {isCurrent && <CircleDot    className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />}
                        {!isPast && !isCurrent && <Circle className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className={cn(
                              "text-[14px] font-semibold",
                              isCurrent ? "text-blue-900" : isPast ? "text-emerald-800" : "text-slate-700"
                            )}>
                              Phase {i + 1}: {phase.name}
                            </h4>
                            {isCurrent && (
                              <span className="text-[9px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[12px] text-slate-500 mt-0.5">{phase.focus}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[12px] font-semibold text-slate-700">Weeks {phase.weeks}</p>
                        <p className="text-[11px] text-slate-400">{phase.weeklyHours}h/week</p>
                      </div>
                    </div>
                    <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-1.5">
                      {phase.objectives.map((obj, j) => (
                        <div key={j} className="flex items-start gap-2">
                          <div className={cn(
                            "w-1 h-1 rounded-full mt-[7px] flex-shrink-0",
                            isCurrent ? "bg-blue-400" : isPast ? "bg-emerald-400" : "bg-slate-300"
                          )} />
                          <span className="text-[12.5px] text-slate-600 leading-snug">{obj}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </DashboardCard>

          {/* Week-by-week detail */}
          <DashboardCard
            title="Week-by-Week Plan"
            subtitle={`${totalWeeks} weeks · go to Dashboard to mark milestones complete`}
          >
            <div className="space-y-3">
              {d.roadmapWeeks.map(week => {
                const dbMs        = milestonesByWeek[week.week] ?? []
                const aiMs        = analysis.weeklyMilestones.filter(m => m.weekNumber === week.week)
                const isCurrent   = week.status === "current"
                const isPast      = week.status === "complete"
                const completed   = dbMs.filter(m => m.status === "complete").length
                const totalMs     = dbMs.length || aiMs.length

                return (
                  <div
                    key={week.week}
                    className={cn(
                      "rounded-xl border p-4",
                      isCurrent ? "border-blue-200 bg-blue-50/40" :
                      isPast    ? "border-slate-100 bg-slate-50/60 opacity-80" :
                                  "border-slate-100 bg-white"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0",
                          isCurrent ? "bg-blue-600 text-white" :
                          isPast    ? "bg-emerald-500 text-white" :
                                      "bg-slate-100 text-slate-500"
                        )}>
                          {isPast ? "✓" : `W${week.week}`}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-slate-800">{week.theme}</p>
                          <p className="text-[11px] text-slate-400">{week.focusArea}</p>
                        </div>
                      </div>
                      {totalMs > 0 && (
                        <span className="text-[11px] font-medium text-slate-400 tabular-nums">
                          {dbMs.length > 0 ? `${completed}/${totalMs} done` : `${totalMs} milestones`}
                        </span>
                      )}
                    </div>

                    <div className="ml-11 space-y-1.5">
                      {dbMs.length > 0
                        ? dbMs.map(m => (
                          <div key={m.id} className="flex items-start gap-2">
                            {m.status === "complete"
                              ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                              : m.status === "in_progress"
                                ? <Clock className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                                : <Circle className="w-3.5 h-3.5 text-slate-300 mt-0.5 flex-shrink-0" />}
                            <span className={cn(
                              "text-[12.5px] leading-snug",
                              m.status === "complete" ? "line-through text-slate-400" : "text-slate-600"
                            )}>
                              {m.title}
                              {m.estimated_hours > 0 && (
                                <span className="text-slate-400 ml-1">· {m.estimated_hours}h</span>
                              )}
                            </span>
                          </div>
                        ))
                        : aiMs.map((m, j) => (
                          <div key={j} className="flex items-start gap-2">
                            <Circle className="w-3.5 h-3.5 text-slate-300 mt-0.5 flex-shrink-0" />
                            <span className="text-[12.5px] text-slate-600 leading-snug">
                              {m.title}
                              <span className="text-slate-400 ml-1">· {m.estimatedHours}h</span>
                            </span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )
              })}
            </div>
          </DashboardCard>

          <div className="h-4" />
        </div>
      </main>
    </>
  )
}
