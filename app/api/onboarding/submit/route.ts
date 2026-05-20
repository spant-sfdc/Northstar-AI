import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { fullOnboardingSchema } from "@/lib/validations/onboarding"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[onboarding/submit] auth failed:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let rawBody: unknown
    try {
      rawBody = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    console.log("[onboarding/submit] user:", user.id, "payload keys:", Object.keys(rawBody as object))

    const parsed = fullOnboardingSchema.safeParse(rawBody)
    if (!parsed.success) {
      const issues = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`)
      console.error("[onboarding/submit] schema validation failed:", issues)
      return NextResponse.json(
        { error: "Invalid data", issues },
        { status: 422 }
      )
    }

    const d   = parsed.data
    const now = new Date().toISOString()

    const fields = {
      current_role:             d.currentRole,
      experience_level:         d.experienceLevel,
      years_of_experience:      d.yearsOfExperience,
      current_skills:           d.currentSkills,
      resume_storage_path:      d.resumeStoragePath ?? null,
      resume_file_name:         d.resumeFileName ?? null,
      target_role:              d.targetRole,
      target_company_size:      d.targetCompanySize,
      target_timeline_months:   d.targetTimelineMonths,
      available_hours_per_week: d.availableHoursPerWeek,
      career_struggles:         d.careerStruggles,
      preferred_work_type:      d.preferredWorkType,
      confidence_score:         d.confidenceScore,
      status:                   "complete" as const,
      completed_at:             now,
      updated_at:               now,
    }

    // ── Select first to decide insert vs update ──────────────────────────────
    // This avoids requiring a UNIQUE constraint for upsert's ON CONFLICT clause.
    const { data: existing, error: selectError } = await supabase
      .from("onboarding_submissions")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (selectError) {
      console.error("[onboarding/submit] select error:", selectError)
      return NextResponse.json(
        { error: "Failed to check existing profile", detail: selectError.message, code: selectError.code },
        { status: 500 }
      )
    }

    let dbError
    if (existing?.id) {
      const { error } = await supabase
        .from("onboarding_submissions")
        .update(fields)
        .eq("user_id", user.id)
      dbError = error
    } else {
      const { error } = await supabase
        .from("onboarding_submissions")
        .insert({ user_id: user.id, ...fields })
      dbError = error
    }

    if (dbError) {
      console.error("[onboarding/submit] db write error:", dbError)
      return NextResponse.json(
        { error: "Failed to save your profile", detail: dbError.message, code: dbError.code },
        { status: 500 }
      )
    }

    // Update profiles — best-effort, do not fail the request if this fails
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ onboarding_complete: true, updated_at: now })
      .eq("id", user.id)

    if (profileError) {
      console.warn("[onboarding/submit] profiles update failed (non-fatal):", profileError.message, profileError.code)
    }

    console.log("[onboarding/submit] success for user:", user.id)
    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error("[onboarding/submit] unexpected error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
