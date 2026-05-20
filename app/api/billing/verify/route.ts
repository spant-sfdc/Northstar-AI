import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { getRazorpayClient } from "@/lib/razorpay/client"
import { planKeyFromRazorpayId } from "@/lib/billing/plans"

const BodySchema = z.object({
  razorpay_payment_id:      z.string(),
  razorpay_subscription_id: z.string(),
  razorpay_signature:       z.string(),
})

// POST /api/billing/verify
// Called by the Razorpay checkout handler after the user completes payment.
// Verifies the payment signature client-side CANNOT fake, then activates the subscription.

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: z.infer<typeof BodySchema>
  try {
    body = BodySchema.parse(await req.json())
  } catch (e) {
    return NextResponse.json({ error: "Invalid payload", detail: String(e) }, { status: 400 })
  }

  // ── Verify Razorpay signature ─────────────────────────────────────────────
  // Formula: HMAC-SHA256(payment_id + "|" + subscription_id, key_secret)
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!secret) {
    return NextResponse.json({ error: "Payment verification not configured" }, { status: 503 })
  }

  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(`${body.razorpay_payment_id}|${body.razorpay_subscription_id}`)
    .digest("hex")

  if (expectedSig !== body.razorpay_signature) {
    console.warn("[billing/verify] signature mismatch for user", user.id)
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 })
  }

  // ── Fetch subscription details from Razorpay ──────────────────────────────
  // The Razorpay SDK types for subscriptions.fetch are not accurate;
  // cast through unknown to access the real runtime shape.
  let rzpSub: Record<string, unknown>
  try {
    rzpSub = await getRazorpayClient().subscriptions.fetch(body.razorpay_subscription_id) as unknown as Record<string, unknown>
  } catch (err) {
    console.error("[billing/verify] subscription fetch error:", err)
    return NextResponse.json({ error: "Could not retrieve subscription details" }, { status: 502 })
  }

  // Map Razorpay plan_id → our plan key
  const razorpayPlanId = rzpSub.plan_id as string | undefined
  const plan = razorpayPlanId ? planKeyFromRazorpayId(razorpayPlanId) : null
  if (!plan) {
    console.error("[billing/verify] unknown plan_id:", razorpayPlanId)
    return NextResponse.json({ error: "Unknown plan" }, { status: 400 })
  }

  const now = new Date().toISOString()
  const currentEndTs = rzpSub.current_end as number | undefined
  const currentEnd   = currentEndTs ? new Date(currentEndTs * 1000).toISOString() : null

  // ── Activate subscription in Supabase ─────────────────────────────────────
  const { error: dbError } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id:                  user.id,
        plan,
        status:                   "active",
        razorpay_subscription_id: body.razorpay_subscription_id,
        razorpay_customer_id:     rzpSub.customer_id as string ?? null,
        current_period_end:       currentEnd,
        trial_ends_at:            null,  // trial consumed on first payment
        updated_at:               now,
      },
      { onConflict: "user_id" },
    )

  if (dbError) {
    console.error("[billing/verify] DB upsert error:", dbError)
    return NextResponse.json({ error: "Failed to activate subscription", detail: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ activated: true, plan })
}
