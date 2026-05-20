import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("milestones")
    .select("*")
    .eq("user_id", user.id)
    .order("week_number", { ascending: true })
    .order("order_index", { ascending: true })

  if (error) {
    console.error("[progress/milestones] GET error:", error)
    return NextResponse.json({ error: "Failed to fetch milestones" }, { status: 500 })
  }

  return NextResponse.json({ milestones: data ?? [] })
}
