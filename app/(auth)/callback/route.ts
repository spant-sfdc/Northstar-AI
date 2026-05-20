import { NextResponse, type NextRequest } from "next/server"

// This route resolves to /callback (the (auth) group is invisible in URLs).
// All redirectTo values in Supabase point to /auth/callback — forward there preserving query string.
export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = "/auth/callback"
  return NextResponse.redirect(url, { status: 308 })
}
