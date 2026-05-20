import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { getRazorpayClient } from "@/lib/razorpay/client"
import { PLAN_CONFIG, PAID_PLANS } from "@/lib/billing/plans"
import type { PlanKey } from "@/lib/billing/plans"

const BodySchema = z.object({
  plan: z.enum(["premium", "advanced"]),
})

// POST /api/billing/subscribe
// Creates a Razorpay subscription and returns the subscription_id for checkout.
// The client uses this ID to open the Razorpay checkout widget.
// Actual subscription activation happens in /api/billing/verify after payment.

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
    return NextResponse.json({ error: "Invalid plan", detail: String(e) }, { status: 400 })
  }

  const planConfig = PLAN_CONFIG[body.plan as PlanKey]
  if (!planConfig.razorpayPlanId) {
    return NextResponse.json(
      { error: `Razorpay plan ID not configured for ${body.plan}. Set RAZORPAY_PLAN_${body.plan.toUpperCase()} in env.` },
      { status: 503 },
    )
  }

  // Check if user already has an active paid subscription
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("plan, status, razorpay_subscription_id")
    .eq("user_id", user.id)
    .maybeSingle()

  const alreadyActive =
    existingSub &&
    PAID_PLANS.includes(existingSub.plan as PlanKey) &&
    existingSub.status === "active"

  if (alreadyActive) {
    return NextResponse.json(
      { error: "Already subscribed. Cancel current plan before switching." },
      { status: 409 },
    )
  }

  try {
    const rzp = getRazorpayClient()

    // Create a Razorpay Subscription
    // total_count: 1200 ≈ 100 years — effectively indefinite until cancelled
    const subscription = await rzp.subscriptions.create({
      plan_id:        planConfig.razorpayPlanId,
      total_count:    1200,
      quantity:       1,
      customer_notify: 1,
      notes: {
        user_id: user.id,
        plan:    body.plan,
        email:   user.email ?? "",
      },
    })

    return NextResponse.json({
      subscriptionId: subscription.id,
      keyId:          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      plan:           body.plan,
      planName:       planConfig.name,
      amount:         planConfig.price,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Razorpay error"
    console.error("[billing/subscribe]", err)
    return NextResponse.json({ error: "Failed to create subscription", detail: msg }, { status: 502 })
  }
}
