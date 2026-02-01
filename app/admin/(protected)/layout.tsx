import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/utils/admin-auth"
import AdminShell from "@/components/admin/admin-shell"

export default async function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value
  const isAuthed = verifyAdminToken(token)

  if (!isAuthed) {
    redirect("/admin/login")
  }

  return <AdminShell>{children}</AdminShell>
}
