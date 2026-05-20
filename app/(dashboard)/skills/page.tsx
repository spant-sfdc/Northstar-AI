import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { CheckCircle2, AlertCircle, Info, Clock, ExternalLink } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { ReadinessAnalysisSchema } from "@/lib/ai/schemas"
import { analysisToDisplay } from "@/lib/ai/map-to-display"
import { AnalysisGenerating } from "@/components/dashboard/analysis-generating"
import { Topbar } from "@/components/dashboard/topbar"
import { DashboardCard } from "@/components/dashboard/card"
import { cn } from "@/lib/utils"
import type { SkillGap } from "@/lib/ai/schemas"

export const metadata: Metadata = { title: "Skills" }
export const dynamic = "force-dynamic"

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

const GAP_BAR: Record<string, { width: string; color: string }> = {
  critical: { width: "w-[15%]",  color: "bg-red-500"    },
  large:    { width: "w-[35%]",  color: "bg-orange-400" },
  moderate: { width: "w-[58%]",  color: "bg-amber-400"  },
  small:    { width: "w-[78%]",  color: "bg-emerald-400" },
}

function SkillGapCard({ gap, tier }: { gap: SkillGap; tier: "critical" | "important" | "optional" }) {
  const bar = GAP_BAR[gap.gapSize] ?? { width: "w-[50%]", color: "bg-slate-400" }

  return (
    <div className={cn(
      "rounded-xl border p-4 space-y-2.5",
      tier === "critical"  ? "border-red-100 bg-red-50/40"      :
      tier === "important" ? "border-orange-100 bg-orange-50/30" :
                             "border-slate-100 bg-white"
    )}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-semibold text-slate-800 leading-snug">{gap.skill}</p>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Clock className="w-3 h-3 text-slate-400" />
          <span className="text-[11px] text-slate-400 tabular-nums">{gap.hoursToClose}h to close</span>
        </div>
      </div>

      {/* Progress bar — current level visualised */}
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", bar.width, bar.color)} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-[11.5px]">
        <div>
          <p className="text-slate-400 mb-0.5">Current</p>
          <p className="text-slate-600 leading-snug">{gap.currentLevel}</p>
        </div>
        <div>
          <p className="text-slate-400 mb-0.5">Target</p>
          <p className="text-slate-600 leading-snug">{gap.targetLevel}</p>
        </div>
      </div>

      {gap.specificResources.length > 0 && (
        <div className="pt-0.5">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Resources</p>
          <ul className="space-y-0.5">
            {gap.specificResources.map((r, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <ExternalLink className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                <span className="text-[11.5px] text-blue-600 leading-snug">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default async function SkillsPage() {
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

  const [{ data: roadmap }, { data: snapshots }] = await Promise.all([
    supabase
      .from("roadmaps")
      .select("id, gap_analysis, readiness_score")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
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

  const analysis    = parsed.data
  const d           = analysisToDisplay(analysis, {
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

  const allSnapshots    = snapshots ?? []
  const { skillGaps }   = analysis
  const { marketReadiness, estimatedReadiness, recommendedProjects, confidenceBlockers } = analysis

  const totalGapHours =
    [...skillGaps.critical, ...skillGaps.important, ...skillGaps.optional]
      .reduce((s, g) => s + g.hoursToClose, 0)

  const TIERS = [
    {
      key:    "critical" as const,
      label:  "Critical gaps",
      icon:   AlertCircle,
      color:  "text-red-500",
      bg:     "bg-red-50",
      border: "border-red-100",
      desc:   "Must close these to clear technical screens",
      gaps:   skillGaps.critical,
    },
    {
      key:    "important" as const,
      label:  "Important gaps",
      icon:   Info,
      color:  "text-orange-500",
      bg:     "bg-orange-50",
      border: "border-orange-100",
      desc:   "Differentiates your offers",
      gaps:   skillGaps.important,
    },
    {
      key:    "optional" as const,
      label:  "Optional gaps",
      icon:   CheckCircle2,
      color:  "text-emerald-500",
      bg:     "bg-emerald-50",
      border: "border-emerald-100",
      desc:   "Marginal gains — address after critical/important",
      gaps:   skillGaps.optional,
    },
  ]

  return (
    <>
      <Topbar user={d.user} greeting={getGreeting()} streakDays={allSnapshots.length} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1100px] mx-auto px-6 py-6 space-y-6">

          {/* Header + market context */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Market readiness verdict */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
                Market readiness
              </p>
              <p className="text-[14px] font-semibold text-slate-800 leading-snug mb-3">
                {marketReadiness.verdict}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10.5px] font-semibold text-emerald-600 uppercase tracking-wider mb-1.5">
                    Strengths
                  </p>
                  <ul className="space-y-1">
                    {marketReadiness.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-[5px] flex-shrink-0" />
                        <span className="text-[12px] text-slate-600 leading-snug">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10.5px] font-semibold text-red-500 uppercase tracking-wider mb-1.5">
                    Blocking gaps
                  </p>
                  <ul className="space-y-1">
                    {marketReadiness.criticalGaps.map((g, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-[5px] flex-shrink-0" />
                        <span className="text-[12px] text-slate-600 leading-snug">{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-[10px] text-slate-400">Time to first interview</p>
                  <p className="text-[13px] font-semibold text-slate-800">{marketReadiness.timeToFirstInterview}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Market demand</p>
                  <p className={cn(
                    "text-[13px] font-semibold capitalize",
                    marketReadiness.marketDemand === "high"   ? "text-emerald-600" :
                    marketReadiness.marketDemand === "medium" ? "text-amber-600"   : "text-red-500"
                  )}>
                    {marketReadiness.marketDemand}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Salary range</p>
                  <p className="text-[13px] font-semibold text-slate-800">
                    {marketReadiness.estimatedSalaryRange.currency}{" "}
                    {(marketReadiness.estimatedSalaryRange.min / 1000).toFixed(0)}k–
                    {(marketReadiness.estimatedSalaryRange.max / 1000).toFixed(0)}k
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Total hours to close</p>
                  <p className="text-[13px] font-semibold text-slate-800">{totalGapHours}h</p>
                </div>
              </div>
            </div>

            {/* Readiness score card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
                  Readiness score
                </p>
                <div className="flex items-end gap-1.5">
                  <span className="text-[48px] font-bold text-slate-900 leading-none tabular-nums">
                    {analysis.readinessScore}
                  </span>
                  <span className="text-[20px] font-bold text-slate-300 mb-1">/100</span>
                </div>
                <p className="text-[12px] text-slate-500 mt-2 leading-snug">{analysis.scoreRationale}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 mb-1">Projected ready by</p>
                <p className="text-[13px] font-semibold text-blue-600">{estimatedReadiness.targetDate}</p>
                <p className={cn(
                  "text-[10.5px] mt-0.5 capitalize",
                  estimatedReadiness.confidence === "high"   ? "text-emerald-600" :
                  estimatedReadiness.confidence === "medium" ? "text-amber-600"   : "text-red-500"
                )}>
                  {estimatedReadiness.confidence} confidence
                </p>
              </div>
            </div>
          </div>

          {/* Skill gaps by tier */}
          {TIERS.filter(t => t.gaps.length > 0).map(tier => {
            const Icon = tier.icon
            return (
              <DashboardCard
                key={tier.key}
                title={tier.label}
                subtitle={`${tier.gaps.length} skill${tier.gaps.length === 1 ? "" : "s"} · ${tier.desc}`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tier.gaps.map((gap, i) => (
                    <SkillGapCard key={i} gap={gap} tier={tier.key} />
                  ))}
                </div>
              </DashboardCard>
            )
          })}

          {/* Recommended projects */}
          {recommendedProjects.length > 0 && (
            <DashboardCard
              title="Recommended Projects"
              subtitle="Build these to demonstrate readiness in interviews"
            >
              <div className="space-y-3">
                {recommendedProjects.map((proj, i) => (
                  <div key={i} className="rounded-xl border border-slate-100 bg-white p-4">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <p className="text-[13px] font-semibold text-slate-800">{proj.title}</p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="text-[11px] text-slate-400 tabular-nums">{proj.estimatedHours}h</span>
                      </div>
                    </div>
                    <p className="text-[12px] text-slate-500 leading-snug mb-2.5">{proj.rationale}</p>
                    {proj.technicalRequirements.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {proj.technicalRequirements.map((req, j) => (
                          <span key={j} className="text-[10.5px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {req}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="border-t border-slate-100 pt-2.5 mt-0.5">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                        Interview signal
                      </p>
                      <p className="text-[12px] text-blue-600 leading-snug">{proj.interviewSignal}</p>
                    </div>
                  </div>
                ))}
              </div>
            </DashboardCard>
          )}

          {/* Confidence blockers */}
          {confidenceBlockers.length > 0 && (
            <DashboardCard
              title="Confidence Blockers"
              subtitle="What's holding you back — and how to fix it"
            >
              <div className="space-y-3">
                {confidenceBlockers.map((b, i) => (
                  <div key={i} className="rounded-xl border border-amber-100 bg-amber-50/30 p-4">
                    <p className="text-[13px] font-semibold text-slate-800 mb-1">{b.blocker}</p>
                    <p className="text-[12px] text-slate-500 mb-2 leading-snug">
                      <span className="font-medium text-slate-600">Root cause: </span>{b.rootCause}
                    </p>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-[12px] text-blue-700 leading-snug">{b.fix}</p>
                    </div>
                  </div>
                ))}
              </div>
            </DashboardCard>
          )}

          <div className="h-4" />
        </div>
      </main>
    </>
  )
}
