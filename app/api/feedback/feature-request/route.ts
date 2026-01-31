import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email, title, details, userId } = body || {}

        if (!title || typeof title !== "string") {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { error } = await supabase.from("feature_requests").insert({
            email: email || null,
            title: title.trim(),
            details: details || null,
            user_id: userId || null
        })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error?.message || "Unknown error" }, { status: 500 })
    }
}
