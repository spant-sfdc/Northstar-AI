import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@/lib/supabase/server"
import { planKeyFromRazorpayId } from "@/lib/billing/plans"

// export const runtime = "nodejs"  // needed for crypto in some Next.js versions

// POST /api/webhooks/razorpay
// Receives lifecycle events from Razorpay. Verifies signature, updates subscription state.
//
// Configure in Razorpay Dashboard → Webhooks:
//   URL: https://yourdomain.com/api/webhooks/razorpay
//   Events: subscription.*  (all subscription events)
//   Secret: value stored in RAZORPAY_WEBHOOK_SECRET

// ─── Razorpay subscription status → our status mapping ────────────────────────
const STATUS_MAP: Record<string, "active" | "canceled" | "past_due"> = {
  authenticated: "active",
  active:        "active",
  pending:       "past_due",
  halted:        "canceled",
  cancelled:     "canceled",
  completed:     "canceled",
  expired:       "canceled",
}

export async function POST(req: NextRequest) {
  // ── 1. Signature verification ─────────────────────────────────────────────
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("[webhook/razorpay] RAZORPAY_WEBHOOK_SECRET not set")
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 })
  }

  const rawBody   = await req.text()
  const signature = req.headers.get("x-razorpay-signature") ?? ""

  const expectedSig = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex")

  if (expectedSig !== signature) {
    console.warn("[webhook/razorpay] signature mismatch — rejected")
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  // ── 2. Parse event ────────────────────────────────────────────────────────
  let event: Record<string, unknown>
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const eventType = event.event as string
  const payload   = event.payload as Record<string, unknown>

  // ── 3. Route to handler ───────────────────────────────────────────────────
  if (!eventType.startsWith("subscription.")) {
    // Acknowledge non-subscription events without processing
    return NextResponse.json({ received: true })
  }

  const subEntity  = (payload?.subscription as Record<string, unknown>)?.entity as Record<string, unknown>
  const subId      = subEntity?.id as string
  const planId     = subEntity?.plan_id as string
  const customerId = subEntity?.customer_id as string | undefined
  const currentEnd = subEntity?.current_end as number | undefined
  const notes      = subEntity?.notes as Record<string, string> | undefined
  const userId     = notes?.user_id

  if (!subId) {
    console.warn("[webhook/razorpay] missing subscription.id in event:", eventType)
    return NextResponse.json({ received: true })
  }

  const supabase    = await createClient()
  const rzpStatus   = subEntity?.status as string | undefined
  const ourStatus   = rzpStatus ? STATUS_MAP[rzpStatus] ?? "active" : "active"
  const plan        = planKeyFromRazorpayId(planId) ?? "premium"
  const periodEnd   = currentEnd ? new Date(currentEnd * 1000).toISOString() : null
  const now         = new Date().toISOString()

  // ── 4. Subscription lifecycle events ─────────────────────────────────────

  if (eventType === "subscription.charged") {
    // Successful renewal payment — ensure subscription is marked active
    const update: Record<string, unknown> = {
      plan,
      status:                   "active",
      current_period_end:       periodEnd,
      trial_ends_at:            null,   // paid → trial consumed
      updated_at:               now,
    }
    if (customerId) update.razorpay_customer_id = customerId

    if (userId) {
      await supabase
        .from("subscriptions")
        .update(update)
        .eq("user_id", userId)
    } else {
      // Fallback: look up by razorpay_subscription_id
      await supabase
        .from("subscriptions")
        .update(update)
        .eq("razorpay_subscription_id", subId)
    }
  }

  else if (eventType === "subscription.authenticated") {
    // Mandate registered — subscription is now active
    const update: Record<string, unknown> = {
      plan,
      status:                   "active",
      razorpay_subscription_id: subId,
      current_period_end:       periodEnd,
      trial_ends_at:            null,
      updated_at:               now,
    }
    if (customerId) update.razorpay_customer_id = customerId

    if (userId) {
      await supabase
        .from("subscriptions")
        .upsert({ user_id: userId, ...update }, { onConflict: "user_id" })
    }
  }

  else if (eventType === "subscription.pending") {
    // Charge failed — retry in progress
    await supabase
      .from("subscriptions")
      .update({ status: "past_due", updated_at: now })
      .eq("razorpay_subscription_id", subId)
  }

  else if (
    eventType === "subscription.halted"    ||
    eventType === "subscription.cancelled" ||
    eventType === "subscription.completed" ||
    eventType === "subscription.expired"
  ) {
    // Subscription ended — downgrade to free
    await supabase
      .from("subscriptions")
      .update({
        plan:       "free",
        status:     "canceled",
        updated_at: now,
      })
      .eq("razorpay_subscription_id", subId)
  }

  else {
    console.log("[webhook/razorpay] unhandled event:", eventType)
  }

  return NextResponse.json({ received: true })
}
