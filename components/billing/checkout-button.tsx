"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

// ─── Razorpay script loader ───────────────────────────────────────────────────

function loadRazorpay(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") { reject(new Error("SSR")); return }
    if ((window as unknown as Record<string, unknown>).Razorpay) { resolve(); return }
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Razorpay"))
    document.body.appendChild(script)
  })
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface CheckoutButtonProps {
  /** Amount in INR (whole rupees). Minimum 1. */
  amount: number
  /** Label shown on the button when idle */
  label?: string
  /** Prefill data for the Razorpay modal */
  prefill?: {
    name?:    string
    email?:   string
    contact?: string
  }
  /** Optional receipt string (max 40 chars) sent to create-order */
  receipt?: string
  /** Called with verified paymentId + orderId on success */
  onSuccess?: (result: { paymentId: string; orderId: string }) => void
  /** Called with error message on failure */
  onError?: (message: string) => void
  className?: string
  disabled?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CheckoutButton({
  amount,
  label = "Pay now",
  prefill,
  receipt,
  onSuccess,
  onError,
  className,
  disabled,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (loading || disabled) return
    setLoading(true)

    try {
      // Step 1: Create Razorpay order on server
      const orderRes = await fetch("/api/billing/create-order", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ amount, receipt }),
      })
      const orderData = await orderRes.json()
      if (!orderRes.ok) throw new Error(orderData.error ?? "Failed to create order")

      // Step 2: Load Razorpay checkout script
      await loadRazorpay()

      // Step 3: Open Razorpay checkout modal
      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      const RazorpayCheckout = (window as unknown as Record<string, unknown>).Razorpay as new (opts: unknown) => { open(): void }

      const rzp = new RazorpayCheckout({
        key:      keyId,
        order_id: orderData.orderId,
        amount:   orderData.amount,    // paise — Razorpay shows the correct rupee amount
        currency: orderData.currency ?? "INR",
        name:     "SkillSynq",
        image:    "/skillsynq-logo.png",
        prefill,
        theme:    { color: "#4f46e5" },
        handler: async function (response: {
          razorpay_payment_id: string
          razorpay_order_id:   string
          razorpay_signature:  string
        }) {
          // Step 4: Verify payment server-side
          const verifyRes = await fetch("/api/billing/verify-payment", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(response),
          })
          const verifyData = await verifyRes.json()

          if (!verifyRes.ok) {
            onError?.(verifyData.error ?? "Payment verification failed. Contact support.")
            setLoading(false)
            return
          }

          onSuccess?.({ paymentId: response.razorpay_payment_id, orderId: response.razorpay_order_id })
          setLoading(false)
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      })

      rzp.open()
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Something went wrong")
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading || disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-[14px] font-semibold text-white transition-all",
        "bg-indigo-600 hover:bg-indigo-700",
        (loading || disabled) && "opacity-60 cursor-wait",
        className
      )}
    >
      {loading ? "Opening checkout…" : label}
    </button>
  )
}
