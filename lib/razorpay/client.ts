import Razorpay from "razorpay"

// Singleton — instantiated once per server process
let _instance: Razorpay | null = null

export function getRazorpayClient(): Razorpay {
  if (!_instance) {
    const key_id     = process.env.RAZORPAY_KEY_ID
    const key_secret = process.env.RAZORPAY_KEY_SECRET
    if (!key_id || !key_secret) {
      throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set")
    }
    _instance = new Razorpay({ key_id, key_secret })
  }
  return _instance
}
