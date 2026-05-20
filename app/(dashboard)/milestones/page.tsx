import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { ReadinessAnalysisSchema } from "@/lib/ai/schemas"
import { analysisToDisplay } from "@/lib/ai/map-to-display"
import { getAccess } from "@/lib/billing/access"
import { AnalysisGenerating } from "@/components/dashboard/analysis-generating"
import { Topbar } from "@/components/dashboard/topbar"
import { MilestonesBoard } from "@/components/dashboard/milestones-board"

export const metadata: Metadata = { title: "Milestones" }
export const dynamic = "force-dynamic"

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

export default async function MilestonesPage() {
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

  const [{ data: roadmap }, { data: dbMilestones }, { data: sub }, { data: snapshots }] =
    await Promise.all([
      supabase
        .from("roadmaps")
        .select("id, gap_analysis, readiness_score")
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
        .from("subscriptions")
        .select("plan, status, trial_ends_at")
        .eq("user_id", user.id)
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

  const access      = getAccess(sub)
  const allMilestones = dbMilestones ?? []
  const allSnapshots  = snapshots ?? []

  return (
    <>
      <Topbar user={d.user} greeting={getGreeting()} streakDays={allSnapshots.length} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[900px] mx-auto px-6 py-6 space-y-2">
          <div className="mb-4">
            <h1 className="text-[18px] font-bold text-slate-900">Milestones</h1>
            <p className="text-[13px] text-slate-400 mt-0.5">
              Track your weekly execution — click any milestone to mark it complete.
            </p>
          </div>

          {allMilestones.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-10 text-center">
              <p className="text-[14px] font-semibold text-slate-700">Milestones are being generated</p>
              <p className="text-[12px] text-slate-400 mt-1">
                Your roadmap analysis is complete. Check back in a moment.
              </p>
            </div>
          ) : (
            <MilestonesBoard
              milestones={allMilestones}
              weekNumber={d.user.weekNumber}
              isPremium={access.isPremium}
            />
          )}
        </div>
      </main>
    </>
  )
}
