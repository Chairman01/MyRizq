"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/articles", label: "Articles" },
  { href: "/admin/qualitative-review", label: "Qualitative Review" }
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside className="w-64 border-r bg-white hidden md:block">
          <div className="px-5 py-6 font-semibold">MyRizq Admin</div>
          <nav className="px-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-2 rounded-md text-sm ${
                    isActive ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="px-3 mt-6">
            <button
              type="button"
              className="w-full text-sm px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-100"
              onClick={async () => {
                await fetch("/api/admin/logout", { method: "POST" })
                router.replace("/admin/login")
              }}
            >
              Log out
            </button>
          </div>
        </aside>

        <div className="flex-1">
          <header className="md:hidden border-b bg-white">
            <div className="px-4 py-3 font-semibold">MyRizq Admin</div>
            <div className="px-3 pb-3 flex flex-wrap gap-2">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-sm px-3 py-1 rounded-md border ${
                      isActive ? "bg-black text-white border-black" : "border-gray-200"
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
            <div className="px-3 pb-3">
              <button
                type="button"
                className="text-sm px-3 py-1 rounded-md border border-gray-200 hover:bg-gray-100"
                onClick={async () => {
                  await fetch("/api/admin/logout", { method: "POST" })
                  router.replace("/admin/login")
                }}
              >
                Log out
              </button>
            </div>
          </header>

          <main className="px-4 md:px-8 py-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
