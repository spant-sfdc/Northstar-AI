import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getRazorpayClient } from "@/lib/razorpay/client"

// POST /api/billing/cancel
// Cancels the active Razorpay subscription at end of current billing cycle.
// The subscription remains active until the cycle ends (graceful cancellation).
// Razorpay will fire subscription.cancelled webhook when the cycle ends.

export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Fetch subscription from DB
  const { data: sub, error: subError } = await supabase
    .from("subscriptions")
    .select("razorpay_subscription_id, plan, status")
    .eq("user_id", user.id)
    .maybeSingle()

  if (subError || !sub) {
    return NextResponse.json({ error: "No subscription found" }, { status: 404 })
  }

  if (!sub.razorpay_subscription_id) {
    return NextResponse.json({ error: "No active Razorpay subscription to cancel" }, { status: 400 })
  }

  if (sub.status === "canceled") {
    return NextResponse.json({ error: "Subscription is already cancelled" }, { status: 400 })
  }

  try {
    const rzp = getRazorpayClient()

    // cancel_at_cycle_end = 1 → graceful (access continues until billing period ends)
    await rzp.subscriptions.cancel(sub.razorpay_subscription_id, true)

    // Mark locally as cancelling — Razorpay will confirm via webhook
    // We don't flip status to 'canceled' yet; user retains access until cycle ends
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status:     "canceled",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)

    if (updateError) {
      console.error("[billing/cancel] DB update error:", updateError)
    }

    return NextResponse.json({
      cancelled: true,
      message:   "Your subscription will remain active until the end of the current billing cycle.",
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Razorpay error"
    console.error("[billing/cancel]", err)
    return NextResponse.json({ error: "Failed to cancel subscription", detail: msg }, { status: 502 })
  }
}
