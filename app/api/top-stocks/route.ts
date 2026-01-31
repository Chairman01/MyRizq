import { NextRequest, NextResponse } from "next/server"
import { stockDatabase } from "@/lib/stock-data"

type TopMetric = "marketCap" | "revenue" | "earnings" | "employees" | "dividend"

async function getYahooFinance() {
    const { default: YahooFinance } = await import("yahoo-finance2")
    return new YahooFinance({ suppressNotices: ["yahooSurvey"] })
}

function toNumber(value: any) {
    if (typeof value === "number") return value
    if (value && typeof value === "object" && typeof value.raw === "number") return value.raw
    return 0
}

async function fetchBatch(tickers: string[]) {
    const yahooFinance = await getYahooFinance()
    const results: {
        ticker: string
        name: string
        marketCap: number
        price: number
        priceCurrency: string
        country: string
        revenue: number
        earnings: number
        employees: number
        dividendYield: number
    }[] = []

    for (const ticker of tickers) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const quoteSummary: any = await yahooFinance.quoteSummary(ticker, {
                modules: ["price", "financialData", "summaryProfile", "summaryDetail"]
            })
            const price = quoteSummary.price
            const financialData = quoteSummary.financialData
            const profile = quoteSummary.summaryProfile
            const summaryDetail = quoteSummary.summaryDetail

            results.push({
                ticker: ticker.toUpperCase(),
                name: price?.longName || price?.shortName || ticker,
                marketCap: toNumber(price?.marketCap),
                price: toNumber(price?.regularMarketPrice),
                priceCurrency: price?.currency || "USD",
                country: profile?.country || "N/A",
                revenue: toNumber(financialData?.totalRevenue),
                earnings: toNumber(financialData?.netIncomeToCommon || financialData?.netIncome),
                employees: toNumber(profile?.fullTimeEmployees),
                dividendYield: toNumber(summaryDetail?.dividendYield) * 100
            })
        } catch {
            results.push({
                ticker: ticker.toUpperCase(),
                name: ticker,
                marketCap: 0,
                price: 0,
                priceCurrency: "USD",
                country: "N/A",
                revenue: 0,
                earnings: 0,
                employees: 0,
                dividendYield: 0
            })
        }
    }

    return results
}

const topStocksCache: Record<string, { expiresAt: number; data: any }> = {}

function getNextUtcMidnight() {
    const now = new Date()
    const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0))
    return next.getTime()
}

export async function GET(request: NextRequest) {
    const metric = (request.nextUrl.searchParams.get("metric") || "marketCap") as TopMetric
    const limit = Number(request.nextUrl.searchParams.get("limit") || 25)

    const cacheKey = `${metric}:${limit}`
    const cached = topStocksCache[cacheKey]
    if (cached && Date.now() < cached.expiresAt) {
        return NextResponse.json(cached.data)
    }

    const allTickers = Object.keys(stockDatabase)
    const batchSize = 15
    const batches: string[][] = []
    for (let i = 0; i < allTickers.length; i += batchSize) {
        batches.push(allTickers.slice(i, i + batchSize))
    }

    const results: {
        ticker: string
        name: string
        marketCap: number
        price: number
        priceCurrency: string
        country: string
        revenue: number
        earnings: number
        employees: number
        dividendYield: number
    }[] = []

    for (const batch of batches) {
        const batchResults = await fetchBatch(batch)
        results.push(...batchResults)
    }

    const sorted = results.sort((a, b) => {
        if (metric === "revenue") return b.revenue - a.revenue
        if (metric === "earnings") return b.earnings - a.earnings
        if (metric === "employees") return b.employees - a.employees
        if (metric === "dividend") return b.dividendYield - a.dividendYield
        return b.marketCap - a.marketCap
    })

    const payload = {
        metric,
        results: sorted.slice(0, limit)
    }

    topStocksCache[cacheKey] = {
        expiresAt: getNextUtcMidnight(),
        data: payload
    }

    return NextResponse.json(payload)
}
