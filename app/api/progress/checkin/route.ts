import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { getAccess } from "@/lib/billing/access"
import { generateWeeklyAdjustment } from "@/lib/ai/weekly-adjust"

export const maxDuration = 30

const CheckInBodySchema = z.object({
  weekNumber:              z.number().int().min(1),
  confidenceScore:         z.number().int().min(1).max(10),
  completedMilestoneIds:   z.array(z.string().uuid()).default([]),
  wins:                    z.string().max(1000).optional(),
  blockers:                z.string().max(1000).optional(),
})

// GET — return this week's check-in if it exists
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const weekNumber = Number(new URL(req.url).searchParams.get("week") ?? "1")

  const { data, error } = await supabase
    .from("weekly_check_ins")
    .select("*")
    .eq("user_id", user.id)
    .eq("week_number", weekNumber)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: "Failed to fetch check-in" }, { status: 500 })
  }

  return NextResponse.json({ checkIn: data })
}

// POST — submit weekly check-in, recalculate score, optionally generate AI feedback
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Validate body
  let body: z.infer<typeof CheckInBodySchema>
  try {
    body = CheckInBodySchema.parse(await req.json())
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body", detail: String(err) }, { status: 400 })
  }

  const { weekNumber, confidenceScore, completedMilestoneIds, wins, blockers } = body

  // ── 1. Mark completed milestones ──────────────────────────────────────────
  if (completedMilestoneIds.length > 0) {
    const now = new Date().toISOString()
    const { error: markError } = await supabase
      .from("milestones")
      .update({ status: "complete", completed_at: now })
      .in("id", completedMilestoneIds)
      .eq("user_id", user.id)

    if (markError) {
      console.error("[checkin] milestone mark error:", markError)
    }
  }

  // ── 2. Aggregate milestone counts ─────────────────────────────────────────
  const { data: allMilestones } = await supabase
    .from("milestones")
    .select("id, status, week_number, title")
    .eq("user_id", user.id)

  const total     = allMilestones?.length ?? 0
  const completed = allMilestones?.filter(m => m.status === "complete").length ?? 0
  const thisWeekMilestones = allMilestones?.filter(m => m.week_number === weekNumber) ?? []
  const thisWeekTotal      = thisWeekMilestones.length
  const thisWeekCompleted  = thisWeekMilestones.filter(m => m.status === "complete").length

  // ── 3. Recalculate readiness score ────────────────────────────────────────
  // base score + up-to-30-point bonus based on overall milestone completion
  const { data: roadmap } = await supabase
    .from("roadmaps")
    .select("readiness_score")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const baseScore     = roadmap?.readiness_score ?? 50
  const progressRatio = total > 0 ? completed / total : 0
  const newScore      = Math.min(99, Math.round(baseScore + progressRatio * 30))

  // ── 4. Check subscription plan ────────────────────────────────────────────
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, status, trial_ends_at")
    .eq("user_id", user.id)
    .maybeSingle()

  const isPremium = getAccess(sub).isPremium

  // ── 5. Generate AI feedback (premium only) ────────────────────────────────
  let aiFeedback: object | null = null
  if (isPremium) {
    try {
      const { data: onboarding } = await supabase
        .from("onboarding_submissions")
        .select("target_role")
        .eq("user_id", user.id)
        .maybeSingle()

      const completedTitles = completedMilestoneIds
        .map(id => allMilestones?.find(m => m.id === id)?.title ?? "")
        .filter(Boolean)

      aiFeedback = await generateWeeklyAdjustment({
        targetRole:               onboarding?.target_role ?? "target role",
        weekNumber,
        completedMilestoneTitles: completedTitles,
        totalMilestonesThisWeek:  thisWeekTotal,
        confidenceScore,
        wins:     wins ?? null,
        blockers: blockers ?? null,
      })
    } catch (err) {
      console.error("[checkin] AI feedback error:", err)
      // non-fatal — check-in still saves
    }
  }

  // ── 6. Upsert weekly_check_in ─────────────────────────────────────────────
  const now = new Date().toISOString()
  const { data: checkIn, error: checkInError } = await supabase
    .from("weekly_check_ins")
    .upsert(
      {
        user_id:                 user.id,
        week_number:             weekNumber,
        confidence_score:        confidenceScore,
        completed_milestone_ids: completedMilestoneIds,
        wins:                    wins ?? null,
        blockers:                blockers ?? null,
        ai_feedback:             aiFeedback,
        updated_at:              now,
      },
      { onConflict: "user_id,week_number" },
    )
    .select()
    .single()

  if (checkInError) {
    console.error("[checkin] upsert error:", checkInError)
    return NextResponse.json({ error: "Failed to save check-in", detail: checkInError.message }, { status: 500 })
  }

  // ── 7. Upsert readiness_snapshot ──────────────────────────────────────────
  const { error: snapshotError } = await supabase
    .from("readiness_snapshots")
    .upsert(
      {
        user_id:              user.id,
        week_number:          weekNumber,
        readiness_score:      newScore,
        confidence_score:     confidenceScore,
        milestones_completed: completed,
        milestones_total:     total,
      },
      { onConflict: "user_id,week_number" },
    )

  if (snapshotError) {
    console.error("[checkin] snapshot error:", snapshotError)
  }

  return NextResponse.json({
    checkIn,
    snapshot: {
      weekNumber,
      readinessScore:       newScore,
      previousReadinessScore: baseScore,
      confidenceScore,
      milestonesCompleted:  completed,
      milestonesTotal:      total,
      thisWeekCompleted,
      thisWeekTotal,
    },
    aiFeedback,
    isPremiumRequired: !isPremium,
  })
}
