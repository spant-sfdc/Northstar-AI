import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { getRazorpayClient } from "@/lib/razorpay/client"

const BodySchema = z.object({
  amount:   z.number().int().positive(), // INR
  currency: z.string().default("INR"),
  receipt:  z.string().max(40).optional(),
})

// POST /api/billing/create-order
// Creates a Razorpay order for one-time payment.
// Returns { orderId, amount (paise), currency } to the frontend.
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

  const amountPaise = body.amount * 100
  if (amountPaise < 100) {
    return NextResponse.json({ error: "Minimum order amount is ₹1" }, { status: 422 })
  }

  const receipt = body.receipt ?? `rcpt_${user.id.slice(0, 16)}_${Date.now()}`

  let order: Record<string, unknown>
  try {
    order = await getRazorpayClient().orders.create({
      amount:   amountPaise,
      currency: body.currency,
      receipt,
    }) as unknown as Record<string, unknown>
  } catch (err) {
    console.error("[billing/create-order] Razorpay error:", err)
    return NextResponse.json({ error: "Failed to create order" }, { status: 502 })
  }

  return NextResponse.json({
    orderId:  order.id,
    amount:   order.amount,   // paise
    currency: order.currency,
  })
}
