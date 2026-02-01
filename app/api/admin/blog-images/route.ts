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

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 })
    }

    const supabase = createAdminClient()
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
    const arrayBuffer = await file.arrayBuffer()
    const { error } = await supabase.storage
      .from("blog-images")
      .upload(fileName, Buffer.from(arrayBuffer), { cacheControl: "3600", upsert: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data } = supabase.storage.from("blog-images").getPublicUrl(fileName)
    return NextResponse.json({ url: data.publicUrl })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
