import { NextRequest, NextResponse } from "next/server"

// Cache crypto prices for 5 minutes
const priceCache: Record<string, { price: number; timestamp: number }> = {}
const CACHE_TTL_MS = 5 * 60 * 1000

export async function GET(request: NextRequest) {
    const ids = request.nextUrl.searchParams.get("ids")
    
    if (!ids) {
        return NextResponse.json({ error: "Missing ids parameter" }, { status: 400 })
    }

    const idList = ids.split(",").map(id => id.trim().toLowerCase())
    const now = Date.now()
    const result: Record<string, { price: number; change24h?: number }> = {}
    const idsToFetch: string[] = []

    // Check cache first
    for (const id of idList) {
        const cached = priceCache[id]
        if (cached && now - cached.timestamp < CACHE_TTL_MS) {
            result[id] = { price: cached.price }
        } else {
            idsToFetch.push(id)
        }
    }

    // Fetch missing prices from CoinGecko
    if (idsToFetch.length > 0) {
        try {
            const response = await fetch(
                `https://api.coingecko.com/api/v3/simple/price?ids=${idsToFetch.join(",")}&vs_currencies=usd&include_24hr_change=true`,
                {
                    headers: {
                        "Accept": "application/json"
                    }
                }
            )

            if (response.ok) {
                const data = await response.json()
                for (const id of idsToFetch) {
                    if (data[id]) {
                        const price = data[id].usd || 0
                        const change24h = data[id].usd_24h_change || 0
                        result[id] = { price, change24h }
                        priceCache[id] = { price, timestamp: now }
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching crypto prices:", error)
        }
    }

    return NextResponse.json(result)
}
