import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Temporarily disabled: Supabase SSR session refresh removed to unblock
// Edge Runtime deployment. Route protection is enforced server-side in
// each protected layout (app/(dashboard)/layout.tsx, onboarding/page.tsx).
export function middleware(_request: NextRequest) {
  return NextResponse.next()
}
