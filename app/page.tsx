import { createClient } from "@/utils/supabase/server"
import { LandingPage } from "@/components/landing-page"
import { DashboardHome } from "@/components/dashboard-home"

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    return <DashboardHome />
  }

  return <LandingPage />
}



