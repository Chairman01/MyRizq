import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'

const yahooFinance = new YahooFinance({
    suppressNotices: ['yahooSurvey']
})

async function getFxRate(from: string, to: string): Promise<number | null> {
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
    const ticker = searchParams.get('ticker')

    if (!ticker) {
        return NextResponse.json({ error: 'Ticker is required' }, { status: 400 })
    }

    try {
        const quote = await yahooFinance.quote(ticker)
        const currency = (quote as any)?.currency || 'USD'
        const fxRate = currency !== 'USD' ? await getFxRate(currency, 'USD') : 1
        const price = quote.regularMarketPrice ?? 0
        const change = quote.regularMarketChange ?? 0
        const changePercent = quote.regularMarketChangePercent ?? 0
        const usdPrice = typeof fxRate === 'number' ? price * fxRate : price
        const usdChange = typeof fxRate === 'number' ? change * fxRate : change

        return NextResponse.json({
            ticker: quote.symbol,
            price,
            change,
            changePercent,
            currency,
            usdPrice,
            usdChange,
            name: quote.shortName || quote.longName
        })
    } catch (error) {
        console.error('Error fetching quote:', error)
        return NextResponse.json({ error: 'Failed to fetch quote', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
    }
}
