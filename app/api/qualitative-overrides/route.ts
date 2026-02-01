import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("qualitative_overrides")
    .select("ticker,segments,total_revenue,year,source,notes,locked,updated_at")
    .order("ticker", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ overrides: data || [] })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const ticker = String(body?.ticker || "").toUpperCase()
  const segments = Array.isArray(body?.segments) ? body.segments : []
  const totalRevenue = typeof body?.total_revenue === "number" ? body.total_revenue : null
  const year = typeof body?.year === "number" ? body.year : null
  const source = typeof body?.source === "string" ? body.source : "Manual review"
  const notes = typeof body?.notes === "string" ? body.notes : null

  if (!ticker || segments.length === 0) {
    return NextResponse.json({ error: "Missing ticker or segments" }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from("qualitative_overrides")
    .upsert(
      {
        ticker,
        segments,
        total_revenue: totalRevenue,
        year,
        source,
        notes,
        locked: true,
        updated_at: new Date().toISOString()
      },
      { onConflict: "ticker" }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
