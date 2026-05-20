import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getAccess } from "@/lib/billing/access"
import { Sidebar } from "@/components/dashboard/sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const name  = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "You"
  const email = user.email ?? ""

  // Lightweight subscription check for trial badge in sidebar
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, status, trial_ends_at")
    .eq("user_id", user.id)
    .maybeSingle()

  const access = getAccess(sub)
  const trialDaysLeft = access.isTrialing ? access.trialDaysLeft : undefined

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar userName={name} userEmail={email} trialDaysLeft={trialDaysLeft} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
