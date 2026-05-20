import { type EmailOtpType } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const code       = searchParams.get("code")
  const tokenHash  = searchParams.get("token_hash")
  const type       = searchParams.get("type") as EmailOtpType | null
  const next       = searchParams.get("next") ?? "/onboarding"

  const supabase = await createClient()

  // PKCE flow — OAuth + email signup when using PKCE auth
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // OTP flow — email confirmation links (token_hash + type)
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Both failed — send to login with visible error
  return NextResponse.redirect(`${origin}/login?error=link_expired`)
}
