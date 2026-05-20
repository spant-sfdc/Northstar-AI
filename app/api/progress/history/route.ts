import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [{ data: snapshots, error: snapError }, { data: roadmap }] = await Promise.all([
    supabase
      .from("readiness_snapshots")
      .select("week_number, readiness_score, confidence_score, milestones_completed, milestones_total, created_at")
      .eq("user_id", user.id)
      .order("week_number", { ascending: true }),
    supabase
      .from("roadmaps")
      .select("readiness_score")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (snapError) {
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 })
  }

  return NextResponse.json({
    snapshots: snapshots ?? [],
    baseScore: roadmap?.readiness_score ?? null,
  })
}
