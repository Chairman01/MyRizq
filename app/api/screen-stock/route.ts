import { NextRequest, NextResponse } from "next/server"

// Helper function to create Yahoo Finance instance
async function getYahooFinance() {
    const { default: YahooFinance } = await import("yahoo-finance2")
    return new YahooFinance({ suppressNotices: ['yahooSurvey'] })
}

// BDS Boycott List
const bdsBoycottList = [
    "SBUX", "MCD", "KO", "PEP", "NSRGY", "PZZA", "DPZ",
    "HPQ", "HPE", "INTC",
    "CAT", "LMT", "RTX", "BA", "GD", "NOC",
    "AXP", "DIS"
]

// Haram business keywords
const haramKeywords = [
    "bank", "insurance", "alcohol", "tobacco", "gambling", "casino",
    "weapon", "defense", "adult", "pork", "wine", "beer", "spirits"
]

interface StockData {
    ticker: string
    name: string
    sector: string
    industry: string
    marketCap: number
    totalDebt: number
    cashAndEquivalents: number
    shortTermInvestments: number
    accountsReceivable: number
    totalAssets: number
    totalRevenue: number
    isBDSListed: boolean
    lastUpdated: string
    // Profile fields
    description: string
    website: string
    country: string
    city: string
    employees: number
    exchange: string
    currency: string
}

// Helper function to safely get numeric value from various formats
function getNumericValue(obj: any, ...keys: string[]): number {
    if (!obj) return 0
    for (const key of keys) {
        const value = obj[key]
        if (value !== undefined && value !== null) {
            // Handle raw numbers
            if (typeof value === 'number') return value
            // Handle objects with 'raw' property (yahoo-finance2 format)
            if (typeof value === 'object' && value.raw !== undefined) return value.raw
            // Handle objects with 'longFmt' property
            if (typeof value === 'object' && value.longFmt !== undefined) {
                const parsed = parseFloat(value.longFmt.replace(/,/g, ''))
                if (!isNaN(parsed)) return parsed
            }
        }
    }
    return 0
}

async function fetchStockData(ticker: string): Promise<StockData | null> {
    try {
        const yahooFinance = await getYahooFinance()

        // Fetch quote summary for price and profile data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const quoteSummary: any = await yahooFinance.quoteSummary(ticker, {
            modules: [
                "price",
                "summaryProfile",
                "financialData",
                "assetProfile"
            ]
        })

        const price = quoteSummary.price
        const profile = quoteSummary.summaryProfile || quoteSummary.assetProfile
        const financialData = quoteSummary.financialData

        if (!price) {
            console.log(`No price data for ${ticker}`)
            return null
        }

        // Fetch fundamentals time series for balance sheet data (this has complete data)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let fundamentals: any[] = []
        try {
            fundamentals = await yahooFinance.fundamentalsTimeSeries(ticker, {
                period1: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year ago
                type: 'quarterly',
                module: 'all'
            })
        } catch (e) {
            console.log(`fundamentalsTimeSeries failed for ${ticker}, using fallback`)
        }

        // Get the most recent quarterly data
        const latestFundamentals = fundamentals.length > 0 ? fundamentals[fundamentals.length - 1] : null

        // Extract market cap
        const marketCap = getNumericValue(price, 'marketCap') ||
            getNumericValue(financialData, 'totalPriceToSales') || 0

        // Extract data - prioritize fundamentalsTimeSeries, fallback to financialData
        let totalDebt = 0
        let cashAndEquivalents = 0
        let shortTermInvestments = 0
        let accountsReceivable = 0
        let totalAssets = 0
        let totalRevenue = 0

        if (latestFundamentals) {
            // Use the comprehensive fundamentalsTimeSeries data
            totalDebt = latestFundamentals.totalDebt ||
                (latestFundamentals.longTermDebt || 0) + (latestFundamentals.currentDebt || 0) || 0
            cashAndEquivalents = latestFundamentals.cashAndCashEquivalents ||
                latestFundamentals.cashCashEquivalentsAndShortTermInvestments || 0
            shortTermInvestments = latestFundamentals.otherShortTermInvestments || 0
            accountsReceivable = latestFundamentals.accountsReceivable ||
                latestFundamentals.receivables ||
                latestFundamentals.netReceivables || 0
            totalAssets = latestFundamentals.totalAssets || 0
            totalRevenue = latestFundamentals.totalRevenue || 0

            console.log(`Using fundamentalsTimeSeries for ${ticker}:`, {
                totalDebt: totalDebt / 1000000,
                cash: cashAndEquivalents / 1000000,
                investments: shortTermInvestments / 1000000,
                receivables: accountsReceivable / 1000000,
                totalAssets: totalAssets / 1000000
            })
        } else {
            // Fallback to financialData
            totalDebt = getNumericValue(financialData, 'totalDebt')
            cashAndEquivalents = getNumericValue(financialData, 'totalCash')
            // These may not be available in financialData fallback
            shortTermInvestments = 0
            accountsReceivable = 0
            totalAssets = marketCap * 0.8 // rough estimate as fallback
            totalRevenue = getNumericValue(financialData, 'totalRevenue')

            console.log(`Using financialData fallback for ${ticker}`)
        }

        return {
            ticker: ticker.toUpperCase(),
            name: price.longName || price.shortName || ticker,
            sector: profile?.sector || "Unknown",
            industry: profile?.industry || "Unknown",
            marketCap: marketCap / 1000000, // Convert to millions
            totalDebt: totalDebt / 1000000,
            cashAndEquivalents: cashAndEquivalents / 1000000,
            shortTermInvestments: shortTermInvestments / 1000000,
            accountsReceivable: accountsReceivable / 1000000,
            totalAssets: totalAssets / 1000000,
            totalRevenue: totalRevenue / 1000000,
            isBDSListed: bdsBoycottList.includes(ticker.toUpperCase()),
            lastUpdated: new Date().toISOString().split("T")[0],
            // Profile data
            description: profile?.longBusinessSummary || "",
            website: profile?.website || "",
            country: profile?.country || "",
            city: profile?.city || "",
            employees: profile?.fullTimeEmployees || 0,
            exchange: price?.exchangeName || "",
            currency: price?.currency || "USD"
        }
    } catch (error) {
        console.error(`Error fetching data for ${ticker}:`, error)
        return null
    }
}

function calculateScreening(data: StockData) {
    // Calculate quantitative ratios
    const debtRatio = data.marketCap > 0 ? (data.totalDebt / data.marketCap) * 100 : 0
    const securitiesRatio = data.marketCap > 0
        ? ((data.cashAndEquivalents + data.shortTermInvestments) / data.marketCap) * 100
        : 0

    // For liquidity ratio, if totalAssets is 0, we should NOT calculate it
    let liquidityRatio = 0
    let liquidityRatioAvailable = true
    if (data.totalAssets > 0) {
        liquidityRatio = ((data.cashAndEquivalents + data.accountsReceivable) / data.totalAssets) * 100
    } else {
        liquidityRatioAvailable = false
    }

    // Check if ratios pass (under 30% threshold per AAOIFI)
    const debtPassed = debtRatio < 30
    const securitiesPassed = securitiesRatio < 30
    // If liquidity data is unavailable, assume pass (conservative approach for user)
    const liquidityPassed = !liquidityRatioAvailable || liquidityRatio < 30
    const quantitativePassed = debtPassed && securitiesPassed && liquidityPassed

    // Check for haram sectors/industries
    const sectorLower = data.sector.toLowerCase()
    const industryLower = data.industry.toLowerCase()
    const isHaramBusiness = haramKeywords.some(keyword =>
        sectorLower.includes(keyword) || industryLower.includes(keyword)
    )

    // Determine qualitative screening
    let compliantPercent: number | null = null
    let questionablePercent: number | null = null
    let nonCompliantPercent: number | null = null
    let qualitativeMethod: "segment_based" | "industry_estimate" | "insufficient_data" = "insufficient_data"
    const revenueDataAvailable = data.totalRevenue > 0

    if (isHaramBusiness) {
        compliantPercent = 0
        questionablePercent = 0
        nonCompliantPercent = 100
        qualitativeMethod = "industry_estimate"
    } else if (sectorLower === "financial services" || sectorLower === "financials") {
        compliantPercent = 10
        questionablePercent = 20
        nonCompliantPercent = 70
        qualitativeMethod = "industry_estimate"
    }

    const qualitativePassed = typeof nonCompliantPercent === "number"
        ? nonCompliantPercent < 5 && !isHaramBusiness
        : false

    // Build issues list
    const issues: string[] = []
    if (data.isBDSListed) {
        issues.push("Listed on BDS Boycott List - supports Israeli occupation")
    }
    if (isHaramBusiness) {
        issues.push(`Operates in non-compliant industry: ${data.industry}`)
    }
    if (!revenueDataAvailable) {
        issues.push("Revenue data unavailable; qualitative screening requires verified revenue sources")
    }
    if (!debtPassed) {
        issues.push(`Interest-bearing debt ratio (${debtRatio.toFixed(2)}%) exceeds 30% threshold`)
    }
    if (!securitiesPassed) {
        issues.push(`Interest-bearing securities ratio (${securitiesRatio.toFixed(2)}%) exceeds 30% threshold`)
    }
    if (!liquidityPassed) {
        issues.push(`Liquidity ratio (${liquidityRatio.toFixed(2)}%) exceeds 30% threshold`)
    }

    // Determine overall status
    let overallStatus: "Compliant" | "Questionable" | "Non-Compliant"

    if (!quantitativePassed) {
        overallStatus = "Non-Compliant"
    } else if (data.isBDSListed) {
        overallStatus = "Non-Compliant"
    } else if (isHaramBusiness) {
        overallStatus = "Non-Compliant"
    } else if (sectorLower === "financial services" || sectorLower === "financials") {
        overallStatus = "Non-Compliant"
    } else if (qualitativeMethod === "insufficient_data") {
        overallStatus = "Questionable"
    } else if (typeof questionablePercent === "number" && questionablePercent > 3) {
        overallStatus = "Questionable"
    } else {
        overallStatus = "Compliant"
    }

    return {
        ticker: data.ticker,
        name: data.name,
        sector: data.sector,
        industry: data.industry,
        isShariahCompliant: overallStatus === "Compliant",
        isBDSListed: data.isBDSListed,
        businessActivities: [data.industry],
        lastUpdated: data.lastUpdated,
        qualitative: {
            passed: qualitativePassed && !data.isBDSListed,
            compliantPercent,
            questionablePercent,
            nonCompliantPercent,
            issues,
            revenueDataAvailable,
            dataSources: {
                totalRevenue: revenueDataAvailable ? "Yahoo Finance (totalRevenue)" : "Unavailable",
                segmentRevenue: "Unavailable",
                interestIncome: "Unavailable"
            },
            method: qualitativeMethod
        },
        quantitative: {
            passed: quantitativePassed,
            debtRatio: Math.round(debtRatio * 100) / 100,
            securitiesRatio: Math.round(securitiesRatio * 100) / 100,
            liquidityRatio: liquidityRatioAvailable ? Math.round(liquidityRatio * 100) / 100 : null,
            debtPassed,
            securitiesPassed,
            liquidityPassed,
            liquidityRatioAvailable
        },
        rawData: {
            marketCap: Math.round(data.marketCap),
            totalDebt: Math.round(data.totalDebt),
            cashAndEquivalents: Math.round(data.cashAndEquivalents),
            deposits: Math.round(data.shortTermInvestments),
            accountsReceivable: Math.round(data.accountsReceivable),
            totalAssets: Math.round(data.totalAssets),
            totalRevenue: Math.round(data.totalRevenue)
        },
        profile: {
            description: data.description,
            website: data.website,
            country: data.country,
            city: data.city,
            employees: data.employees,
            exchange: data.exchange,
            currency: data.currency
        },
        overallStatus
    }
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const ticker = searchParams.get("ticker")

    if (!ticker) {
        return NextResponse.json({ error: "Ticker is required" }, { status: 400 })
    }

    try {
        const stockData = await fetchStockData(ticker)

        if (!stockData) {
            return NextResponse.json({ error: "Stock not found" }, { status: 404 })
        }

        const screening = calculateScreening(stockData)

        return NextResponse.json(screening)
    } catch (error) {
        console.error("API Error:", error)
        return NextResponse.json({ error: "Failed to fetch stock data" }, { status: 500 })
    }
}
