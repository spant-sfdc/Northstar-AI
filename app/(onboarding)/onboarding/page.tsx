import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OnboardingWizard } from "@/components/onboarding/wizard"

export const metadata = { title: "Get started" }

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // If onboarding already completed, go to dashboard
  const { data: submission } = await supabase
    .from("onboarding_submissions")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("status", "complete")
    .maybeSingle()

  if (submission) redirect("/dashboard")

  return <OnboardingWizard userId={user.id} userEmail={user.email ?? ""} />
}
