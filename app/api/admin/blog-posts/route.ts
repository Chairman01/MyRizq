import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/utils/admin-auth"
import { createAdminClient } from "@/utils/supabase/admin"

export const runtime = "nodejs"

async function requireAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value
  return verifyAdminToken(token)
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("date", { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ posts: data || [] })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    if (Array.isArray(body)) {
      const { data, error } = await supabase.from("blog_posts").upsert(body, { onConflict: "slug" })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ posts: data || [] })
    }

    const { data, error } = await supabase.from("blog_posts").insert(body).select("*").maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ post: data })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
