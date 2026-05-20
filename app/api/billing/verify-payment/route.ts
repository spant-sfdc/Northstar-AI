import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const BodySchema = z.object({
  razorpay_order_id:   z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature:  z.string(),
})

// POST /api/billing/verify-payment
// Verifies a one-time Razorpay payment (order-based checkout).
// Signature algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
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

  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!secret) {
    return NextResponse.json({ error: "Payment verification not configured" }, { status: 503 })
  }

  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
    .digest("hex")

  if (expectedSig !== body.razorpay_signature) {
    console.warn("[billing/verify-payment] signature mismatch for user", user.id)
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 })
  }

  return NextResponse.json({
    verified:   true,
    orderId:    body.razorpay_order_id,
    paymentId:  body.razorpay_payment_id,
  })
}
