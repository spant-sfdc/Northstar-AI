import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  let complete = true
  try {
    const body = await req.json()
    complete = body?.complete !== false
  } catch {
    // no body — default to marking complete
  }

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from("milestones")
    .update({
      status:       complete ? "complete" : "not_started",
      completed_at: complete ? now : null,
    })
    .eq("id", id)
    .eq("user_id", user.id)  // RLS + ownership check
    .select("id, status, completed_at")
    .single()

  if (error) {
    console.error("[milestones/complete] PATCH error:", error)
    return NextResponse.json({ error: "Failed to update milestone" }, { status: 500 })
  }

  return NextResponse.json({ milestone: data })
}
