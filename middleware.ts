import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(request: NextRequest) {
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If env vars are absent (e.g. missing from Vercel build), pass through
  // rather than crashing the entire Edge middleware invocation.
  if (!supabaseUrl || !supabaseAnon) {
    return NextResponse.next()
  }

  try {
    let response = NextResponse.next({ request })

    const supabase = createServerClient(supabaseUrl, supabaseAnon, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    })

    // Refreshes the session token so it never silently expires mid-session.
    await supabase.auth.getUser()

    return response
  } catch {
    // Never crash the middleware — fail open so pages still render.
    // Auth is enforced server-side in each protected layout/page.
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
