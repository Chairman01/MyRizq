import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'

const yahooFinance = new YahooFinance({
    suppressNotices: ['yahooSurvey']
})

async function fetchFxRate(from: string, to: string): Promise<number | null> {
    const fromCode = from.toUpperCase()
    const toCode = to.toUpperCase()
    if (fromCode === toCode) return 1

    try {
        const direct = await yahooFinance.quote(`${fromCode}${toCode}=X`)
        const directRate = direct?.regularMarketPrice
        if (typeof directRate === 'number' && directRate > 0) return directRate
    } catch {
        // Ignore and try inverse
    }

    try {
        const inverse = await yahooFinance.quote(`${toCode}${fromCode}=X`)
        const inverseRate = inverse?.regularMarketPrice
        if (typeof inverseRate === 'number' && inverseRate > 0) return 1 / inverseRate
    } catch {
        // Ignore
    }

    return null
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const from = (searchParams.get('from') || '').toUpperCase()
    const to = (searchParams.get('to') || 'USD').toUpperCase()

    if (!from || from.length < 3) {
        return NextResponse.json({ error: 'from currency is required' }, { status: 400 })
    }

    try {
        const rate = await fetchFxRate(from, to)
        if (!rate) {
            return NextResponse.json({ error: 'FX rate not available' }, { status: 404 })
        }

        return NextResponse.json({ from, to, rate })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch FX rate' }, { status: 500 })
    }
}
