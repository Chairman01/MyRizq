"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ADMIN_COOKIE_NAME, ADMIN_TOKEN_TTL_MS, signAdminToken } from "@/utils/admin-auth"

type LoginState = {
  error?: string
}

export async function loginAdmin(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") || "")
  const password = String(formData.get("password") || "")
  const expectedUser = process.env.ADMIN_USERNAME || ""
  const expectedPass = process.env.ADMIN_PASSWORD || ""

  if (!expectedUser || !expectedPass) {
    return { error: "Admin login is not configured." }
  }

  if (username !== expectedUser || password !== expectedPass) {
    return { error: "Invalid admin credentials." }
  }

  const token = signAdminToken()
  if (!token) return { error: "Admin login is not configured." }

  const cookieStore = await cookies()
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(ADMIN_TOKEN_TTL_MS / 1000)
  })

  redirect("/admin/articles")
}
