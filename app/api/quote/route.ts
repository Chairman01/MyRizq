import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'

const yahooFinance = new YahooFinance({
    suppressNotices: ['yahooSurvey']
})

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const ticker = searchParams.get('ticker')

    if (!ticker) {
        return NextResponse.json({ error: 'Ticker is required' }, { status: 400 })
    }

    try {
        const quote = await yahooFinance.quote(ticker)

        return NextResponse.json({
            ticker: quote.symbol,
            price: quote.regularMarketPrice,
            change: quote.regularMarketChange,
            changePercent: quote.regularMarketChangePercent,
            name: quote.shortName || quote.longName
        })
    } catch (error) {
        console.error('Error fetching quote:', error)
        return NextResponse.json({ error: 'Failed to fetch quote', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
    }
}
