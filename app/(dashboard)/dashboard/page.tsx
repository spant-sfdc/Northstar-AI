import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { getAccess } from "@/lib/billing/access"
import { analysisToDisplay } from "@/lib/ai/map-to-display"
import { ReadinessAnalysisSchema } from "@/lib/ai/schemas"
import { AnalysisGenerating } from "@/components/dashboard/analysis-generating"
import { Topbar } from "@/components/dashboard/topbar"
import { ReadinessScore } from "@/components/dashboard/cards/readiness-score"
import { WeeklyProgress } from "@/components/dashboard/cards/weekly-progress"
import { CurrentMilestones } from "@/components/dashboard/cards/current-milestones"
import { SkillGapOverview } from "@/components/dashboard/cards/skill-gap"
import { RoadmapTimeline } from "@/components/dashboard/cards/roadmap-timeline"
import { NextActions } from "@/components/dashboard/cards/next-actions"
import { ConfidenceTracker } from "@/components/dashboard/cards/confidence-tracker"
import { WeeklyCheckin } from "@/components/dashboard/cards/weekly-checkin"
import { ProgressHistory } from "@/components/dashboard/progress-history"
import { PremiumPreview } from "@/components/dashboard/cards/premium-preview"

export const metadata: Metadata = { title: "Dashboard" }
export const dynamic = "force-dynamic"

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const userName = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "You"

  // ── Onboarding ────────────────────────────────────────────────────────────
  const { data: submission } = await supabase
    .from("onboarding_submissions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "complete")
    .maybeSingle()

  if (!submission) redirect("/onboarding")

  // ── AI analysis + retention data — parallel fetches ──────────────────────
  const [
    { data: roadmap },
    { data: dbMilestones },
    { data: snapshots },
    { data: sub },
  ] = await Promise.all([
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
    supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", user.id)
      .maybeSingle(),
  ])

  // ── Show generating state if no analysis yet ─────────────────────────────
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

  // ── Derived state ─────────────────────────────────────────────────────────
  const access    = getAccess(sub)
  const isPremium = access.isPremium

  const d = analysisToDisplay(parsed.data, {
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

  const allMilestones    = dbMilestones ?? []
  const allSnapshots     = snapshots ?? []
  const weekNumber       = d.user.weekNumber

  // Real milestone counts (override mock stats)
  const realCompleted    = allMilestones.filter(m => m.status === "complete").length
  const realTotal        = allMilestones.length

  // Current week check-in
  const { data: thisWeekCheckin } = await supabase
    .from("weekly_check_ins")
    .select("*")
    .eq("user_id", user.id)
    .eq("week_number", weekNumber)
    .maybeSingle()

  return (
    <>
      <Topbar
        user={d.user}
        greeting={getGreeting()}
        streakDays={allSnapshots.length}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1280px] mx-auto px-6 py-6 space-y-5">

          {/* Row 1: Score + Weekly Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-4">
              <ReadinessScore
                score={d.readinessScore}
                breakdown={d.readinessBreakdown}
              />
            </div>
            <div className="lg:col-span-8">
              <WeeklyProgress
                data={d.weeklyProgress}
                hoursThisWeek={d.stats.hoursThisWeek}
                hoursTarget={d.stats.hoursTarget}
              />
            </div>
          </div>

          {/* Row 2: Milestones + Next Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7">
              <CurrentMilestones
                milestones={allMilestones}
                weekNumber={weekNumber}
                totalCompleted={realCompleted}
                totalMilestones={realTotal}
              />
            </div>
            <div className="lg:col-span-5">
              <NextActions actions={d.nextActions} />
            </div>
          </div>

          {/* Row 3: Skill Gaps + Confidence Tracker */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7">
              <SkillGapOverview skillGaps={d.skillGaps} />
            </div>
            <div className="lg:col-span-5">
              <ConfidenceTracker
                history={d.confidenceHistory}
                snapshots={allSnapshots}
                baseConfidence={submission.confidence_score}
              />
            </div>
          </div>

          {/* Row 4: Roadmap Timeline — full width */}
          <RoadmapTimeline
            weeks={d.roadmapWeeks}
            currentWeek={weekNumber}
          />

          {/* Row 5: Weekly Check-in + Progress History */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5">
              <WeeklyCheckin
                weekNumber={weekNumber}
                milestones={allMilestones}
                existingCheckin={thisWeekCheckin ?? null}
                isPremium={isPremium}
              />
            </div>
            <div className="lg:col-span-7">
              <ProgressHistory
                snapshots={allSnapshots}
                baseScore={roadmap.readiness_score}
                isPremium={isPremium}
                daysUntilReady={d.stats.daysUntilReady}
                milestonesCompleted={realCompleted}
                milestonesTotal={realTotal}
              />
            </div>
          </div>

          {/* Row 6: Premium Preview (free users) or nothing */}
          {!isPremium && <PremiumPreview userEmail={user.email ?? ""} userName={userName} />}

          <div className="h-4" />
        </div>
      </main>
    </>
  )
}
