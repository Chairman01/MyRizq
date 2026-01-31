import { NextRequest, NextResponse } from "next/server"
import { stockDatabase } from "@/lib/stock-data"

type TopMetric = "marketCap" | "revenue" | "earnings" | "employees" | "dividend"

async function getYahooFinance() {
    const { default: YahooFinance } = await import("yahoo-finance2")
    return new YahooFinance({ suppressNotices: ["yahooSurvey"] })
}

async function getFxRate(fromCurrency: string, toCurrency: string) {
    if (!fromCurrency || fromCurrency === toCurrency) return 1
    const yahooFinance = await getYahooFinance()
    const directSymbol = `${fromCurrency}${toCurrency}=X`
    const inverseSymbol = `${toCurrency}${fromCurrency}=X`

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const quote: any = await yahooFinance.quote(directSymbol)
        const price = quote?.regularMarketPrice
        if (typeof price === "number" && price > 0) return price
    } catch {
        // try inverse
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inverseQuote: any = await yahooFinance.quote(inverseSymbol)
    const inversePrice = inverseQuote?.regularMarketPrice
    if (typeof inversePrice === "number" && inversePrice > 0) {
        return 1 / inversePrice
    }
    return 1
}

function toNumber(value: any) {
    if (typeof value === "number") return value
    if (value && typeof value === "object" && typeof value.raw === "number") return value.raw
    return 0
}

function toNumberOrNull(value: any) {
    if (typeof value === "number") return Number.isFinite(value) ? value : null
    if (value && typeof value === "object" && typeof value.raw === "number") {
        return Number.isFinite(value.raw) ? value.raw : null
    }
    return null
}

function pickFirstNumber(...values: Array<number | null | undefined>) {
    for (const value of values) {
        if (typeof value === "number" && Number.isFinite(value)) return value
    }
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
                modules: [
                    "price",
                    "financialData",
                    "summaryProfile",
                    "summaryDetail",
                    "incomeStatementHistory",
                    "incomeStatementHistoryQuarterly"
                ]
            })
            const price = quoteSummary.price
            const financialData = quoteSummary.financialData
            const profile = quoteSummary.summaryProfile
            const summaryDetail = quoteSummary.summaryDetail
            const incomeHistory = quoteSummary.incomeStatementHistory?.incomeStatementHistory
            const earningsValue = pickFirstNumber(
                toNumberOrNull(incomeHistory?.[0]?.netIncome),
                toNumberOrNull(financialData?.netIncomeToCommon),
                toNumberOrNull(financialData?.netIncome)
            )
            const revenueValue = pickFirstNumber(
                toNumberOrNull(incomeHistory?.[0]?.totalRevenue),
                toNumberOrNull(financialData?.totalRevenue)
            )
            const financialCurrency = financialData?.financialCurrency || price?.currency || "USD"
            const fxRate = await getFxRate(financialCurrency, "USD")

            results.push({
                ticker: ticker.toUpperCase(),
                name: price?.longName || price?.shortName || ticker,
                marketCap: toNumber(price?.marketCap) * fxRate,
                price: toNumber(price?.regularMarketPrice) * fxRate,
                priceCurrency: "USD",
                country: profile?.country || "N/A",
                revenue: revenueValue * fxRate,
                earnings: earningsValue * fxRate,
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
const TOP_STOCKS_CACHE_VERSION = 2

function getNextUtcMidnight() {
    const now = new Date()
    const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0))
    return next.getTime()
}

export async function GET(request: NextRequest) {
    const metric = (request.nextUrl.searchParams.get("metric") || "marketCap") as TopMetric
    const limit = Number(request.nextUrl.searchParams.get("limit") || 25)

    const cacheKey = `${TOP_STOCKS_CACHE_VERSION}:${metric}:${limit}`
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
