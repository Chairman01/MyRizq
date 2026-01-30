import { NextResponse } from 'next/server'
import { tempFixSubscription } from '@/app/login/actions'

export const dynamic = 'force-dynamic'

export async function GET() {
    // User ID from screenshot: Ali Omar / aabdihal@ualberta.ca
    const userId = '6e6d30af-16c8-4f78-bd4c-4f9abf1be8d7'

    console.log("Triggering manual fix via API...")
    const result = await tempFixSubscription(userId)

    return NextResponse.json(result)
}
