import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { analyzeReadiness } from "@/lib/ai/readiness-engine"
import { AIParseError, AIServiceError } from "@/lib/ai/schemas"
import type { OnboardingData } from "@/types/onboarding"

// Vercel Pro: allow up to 60s for OpenAI calls
export const maxDuration = 60

// ─── GET — return cached analysis if it exists ────────────────────────────────

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("roadmaps")
    .select("gap_analysis, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: "Failed to fetch analysis" }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ analysis: null }, { status: 200 })
  }

  return NextResponse.json({ analysis: data.gap_analysis, updatedAt: data.updated_at })
}

// ─── POST — run analysis (or re-run) and persist ─────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Support optional `force: true` in body to re-run even if cached
  let force = false
  try {
    const body = await req.json()
    force = body?.force === true
  } catch {
    // no body or invalid JSON — fine, default force=false
  }

  // Check for existing analysis unless forced
  if (!force) {
    const { data: existing } = await supabase
      .from("roadmaps")
      .select("gap_analysis, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing?.gap_analysis) {
      return NextResponse.json({
        analysis:  existing.gap_analysis,
        updatedAt: existing.updated_at,
        cached:    true,
      })
    }
  }

  // Load onboarding data
  const { data: submission, error: submissionError } = await supabase
    .from("onboarding_submissions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "complete")
    .maybeSingle()

  if (submissionError) {
    return NextResponse.json({ error: "Failed to fetch onboarding data" }, { status: 500 })
  }

  if (!submission) {
    return NextResponse.json(
      { error: "Onboarding not complete. Submit your profile before running analysis." },
      { status: 400 },
    )
  }

  // Map DB row → OnboardingData type
  const onboardingData: OnboardingData = {
    currentRole:            submission.current_role,
    experienceLevel:        submission.experience_level,
    yearsOfExperience:      submission.years_of_experience,
    currentSkills:          submission.current_skills ?? [],
    resumeStoragePath:      submission.resume_storage_path ?? undefined,
    resumeFileName:         submission.resume_file_name ?? undefined,
    targetRole:             submission.target_role,
    targetCompanySize:      submission.target_company_size,
    targetTimelineMonths:   submission.target_timeline_months,
    availableHoursPerWeek:  submission.available_hours_per_week,
    careerStruggles:        submission.career_struggles ?? [],
    preferredWorkType:      submission.preferred_work_type,
    confidenceScore:        submission.confidence_score,
  }

  // Run the analysis
  try {
    const analysis = await analyzeReadiness(onboardingData)
    const now = new Date().toISOString()

    // Persist to roadmaps table — select id so we can seed milestones
    const { data: roadmapRow, error: upsertError } = await supabase
      .from("roadmaps")
      .upsert(
        {
          user_id:         user.id,
          title:           `${onboardingData.targetRole} Readiness Plan`,
          readiness_score: analysis.readinessScore,
          gap_analysis:    analysis,
          updated_at:      now,
        },
        { onConflict: "user_id" },
      )
      .select("id")
      .single()

    if (upsertError) {
      console.error("Roadmap upsert error:", upsertError)
      return NextResponse.json({ analysis, updatedAt: now, persisted: false })
    }

    // Seed milestones from AI weeklyMilestones — only on first analysis
    if (roadmapRow?.id) {
      const { count } = await supabase
        .from("milestones")
        .select("id", { count: "exact", head: true })
        .eq("roadmap_id", roadmapRow.id)

      if (!count) {
        const milestoneInserts = analysis.weeklyMilestones.map((m, i) => ({
          user_id:          user.id,
          roadmap_id:       roadmapRow.id,
          week_number:      m.weekNumber,
          order_index:      i,
          title:            m.title,
          description:      m.deliverable,
          category:         m.category,
          estimated_hours:  m.estimatedHours,
          success_criteria: m.successCriteria,
          status:           "not_started" as const,
          is_premium:       m.weekNumber > 4,
        }))

        const { error: seedError } = await supabase
          .from("milestones")
          .insert(milestoneInserts)

        if (seedError) {
          console.error("[analyze] milestone seed error:", seedError)
        }
      }
    }

    return NextResponse.json({ analysis, updatedAt: now, persisted: true })

  } catch (err) {
    if (err instanceof AIParseError) {
      console.error(`AI parse error (attempt ${err.attempt}):`, err.message)
      return NextResponse.json(
        { error: "Analysis failed: model returned malformed data. Try again." },
        { status: 502 },
      )
    }

    if (err instanceof AIServiceError) {
      console.error(`AI service error [${err.code}]:`, err.message)
      const status = err.retryable ? 503 : 502
      return NextResponse.json(
        { error: err.retryable ? "AI service unavailable. Retry in a moment." : err.message },
        { status },
      )
    }

    console.error("Analyze route unexpected error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
