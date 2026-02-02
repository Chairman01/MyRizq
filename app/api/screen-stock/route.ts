import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSecQualitativeForTicker } from "@/lib/sec/edgar"
import { getSegmentHints } from "@/lib/sec/segment-hints"

// Helper function to create Yahoo Finance instance
async function getYahooFinance() {
    const { default: YahooFinance } = await import("yahoo-finance2")
    return new YahooFinance({ suppressNotices: ['yahooSurvey'] })
}

async function getFxRate(fromCurrency: string, toCurrency: string) {
    if (fromCurrency === toCurrency) return 1
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

// BDS Boycott List
const bdsBoycottList = [
    "SBUX", "MCD", "KO", "PEP", "NSRGY", "PZZA", "DPZ",
    "HPQ", "HPE", "INTC", "DELL", "TEVA", "RMAX",
    "CAT", "LMT", "RTX", "BA", "GD", "NOC",
    "AXP", "DIS",
    // Priority / pressure targets
    "CVX", "MSFT", "GOOGL", "GOOG", "AMZN", "EXPE", "ABNB", "BKNG", "CSCO",
    // International tickers
    "CA.PA", "AXA.PA", "SIEGY", "SIE.DE", "ITX.MC",
    // Food/restaurant brands
    "YUM", "QSR",
    // Consumer/tech
    "WIX"
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
                "assetProfile",
                "balanceSheetHistoryQuarterly",
                "balanceSheetHistory"
            ]
        })

        const price = quoteSummary.price
        const profile = quoteSummary.summaryProfile || quoteSummary.assetProfile
        const financialData = quoteSummary.financialData
        const balanceSheet =
            quoteSummary.balanceSheetHistoryQuarterly?.balanceSheetStatements?.[0]
            || quoteSummary.balanceSheetHistory?.balanceSheetStatements?.[0]
        const priceCurrency = price?.currency || financialData?.financialCurrency || "USD"
        const financialCurrency = financialData?.financialCurrency || priceCurrency

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
            }, { validateResult: false })
        } catch (e) {
            const err = e as { result?: any[] }
            if (Array.isArray(err?.result)) {
                fundamentals = err.result
            }
            console.log(`fundamentalsTimeSeries failed for ${ticker}, using fallback`)
        }

        const getDateValue = (value: any) => {
            if (!value) return 0
            if (value instanceof Date) return value.getTime()
            if (typeof value === "number") {
                return value > 10_000_000_000 ? value : value * 1000
            }
            const parsed = Date.parse(value)
            return Number.isFinite(parsed) ? parsed : 0
        }

        const latestFundamentals = fundamentals
            .filter(entry =>
                typeof entry?.totalAssets === "number"
                || typeof entry?.totalDebt === "number"
                || typeof entry?.cashAndCashEquivalents === "number"
                || typeof entry?.cashCashEquivalentsAndShortTermInvestments === "number"
            )
            .sort((a, b) => getDateValue(a?.date) - getDateValue(b?.date))
            .slice(-1)[0] ?? null

        // Extract market cap
        let marketCap = getNumericValue(price, 'marketCap') ||
            getNumericValue(financialData, 'totalPriceToSales') || 0

        // Extract data - prioritize balance sheet (quarterly), then fundamentals, fallback to financialData
        let totalDebt = 0
        let cashAndEquivalents = 0
        let shortTermInvestments = 0
        let accountsReceivable = 0
        let totalAssets = 0
        let totalRevenue = 0

        if (balanceSheet) {
            totalDebt = getNumericValue(
                balanceSheet,
                "shortLongTermDebtTotal",
                "totalDebt",
                "longTermDebt",
                "shortLongTermDebt"
            )
            if (!totalDebt) {
                totalDebt = getNumericValue(balanceSheet, "longTermDebt") + getNumericValue(balanceSheet, "shortLongTermDebt")
            }
            cashAndEquivalents = getNumericValue(balanceSheet, "cash", "cashAndCashEquivalents")
            shortTermInvestments = getNumericValue(balanceSheet, "shortTermInvestments")
            accountsReceivable = getNumericValue(balanceSheet, "netReceivables", "accountsReceivable")
            totalAssets = getNumericValue(balanceSheet, "totalAssets")
        }

        if (latestFundamentals) {
            // Use the comprehensive fundamentalsTimeSeries data
            if (!totalDebt) {
                totalDebt = latestFundamentals.totalDebt ||
                    (latestFundamentals.longTermDebt || 0) + (latestFundamentals.currentDebt || 0) || 0
            }
            if (!cashAndEquivalents) {
                cashAndEquivalents = latestFundamentals.cashAndCashEquivalents ||
                    latestFundamentals.cashCashEquivalentsAndShortTermInvestments || 0
            }
            if (!shortTermInvestments) {
                shortTermInvestments = latestFundamentals.otherShortTermInvestments || 0
            }
            if (!accountsReceivable) {
                accountsReceivable = latestFundamentals.accountsReceivable ||
                    latestFundamentals.receivables ||
                    latestFundamentals.netReceivables || 0
            }
            if (!totalAssets) {
                totalAssets = latestFundamentals.totalAssets || 0
            }
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
            totalDebt = totalDebt || getNumericValue(financialData, 'totalDebt')
            cashAndEquivalents = cashAndEquivalents || getNumericValue(financialData, 'totalCash')
            // These may not be available in financialData fallback
            shortTermInvestments = shortTermInvestments || 0
            accountsReceivable = accountsReceivable || 0
            totalAssets = totalAssets || getNumericValue(financialData, "totalAssets")
            totalRevenue = getNumericValue(financialData, 'totalRevenue')

            console.log(`Using financialData fallback for ${ticker}`)
        }

        let fxRate = 1
        if (financialCurrency && priceCurrency && financialCurrency !== priceCurrency) {
            fxRate = await getFxRate(financialCurrency, priceCurrency)
            if (fxRate > 0) {
                marketCap = marketCap / fxRate
            }
        }

        if (!totalAssets && balanceSheet) {
            totalAssets = getNumericValue(balanceSheet, "totalAssets")
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
            currency: financialCurrency || priceCurrency
        }
    } catch (error) {
        console.error(`Error fetching data for ${ticker}:`, error)
        return null
    }
}

const SEC_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30
const SEC_CACHE_VERSION = 19

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

async function getQualitativeOverride(ticker: string) {
    try {
        const supabase = getSupabaseAdmin()
        const { data } = await supabase
            .from("qualitative_overrides")
            .select("segments,total_revenue,year,source,notes,locked")
            .eq("ticker", ticker.toUpperCase())
            .maybeSingle()
        if (!data || !data.locked) return null
        return data
    } catch {
        return null
    }
}

async function getSecCache(ticker: string) {
    try {
        const supabase = getSupabaseAdmin()
        const { data } = await supabase
            .from("sec_qualitative_cache")
            .select("payload,updated_at")
            .eq("ticker", ticker.toUpperCase())
            .maybeSingle()
        if (!data?.payload || !data.updated_at) return null
        if (data.payload?.cacheVersion !== SEC_CACHE_VERSION) return null
        const updatedAt = Date.parse(data.updated_at)
        if (!Number.isFinite(updatedAt)) return null
        if (Date.now() - updatedAt > SEC_CACHE_TTL_MS) return null
        if (
            getSegmentHints(ticker) &&
            Array.isArray(data.payload?.segments) &&
            data.payload.segments.length === 0
        ) {
            return null
        }
        return data.payload
    } catch {
        return null
    }
}

async function setSecCache(ticker: string, payload: any) {
    try {
        const supabase = getSupabaseAdmin()
        await supabase
            .from("sec_qualitative_cache")
            .upsert(
                { ticker: ticker.toUpperCase(), payload, updated_at: new Date().toISOString() },
                { onConflict: "ticker" }
            )
    } catch {
        // Ignore cache write failures
    }
}

async function calculateScreening(data: StockData) {
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

    let revenueDataAvailable = data.totalRevenue > 0

    // Determine qualitative screening
    let compliantPercent: number | null = null
    let questionablePercent: number | null = null
    let nonCompliantPercent: number | null = null
    let qualitativeMethod: "segment_based" | "industry_estimate" | "insufficient_data" = "insufficient_data"
    let secFiling: { url: string; filedAt: string; accession: string; primaryDocument: string } | null = null
    let qualitativeSources = {
        totalRevenue: revenueDataAvailable ? "Financial data (totalRevenue)" : "Unavailable",
        segmentRevenue: revenueDataAvailable ? "Unavailable (requires filings)" : "Unavailable",
        interestIncome: revenueDataAvailable ? "Unavailable (requires filings)" : "Unavailable",
        xbrlTags: undefined as { totalRevenue: string; interestIncome: string } | undefined
    }

    const issues: string[] = []
    // Hardcoded segment overrides for specific tickers (manual research)
    const MANUAL_SEGMENT_OVERRIDES: Record<string, { segments: { name: string; value: number }[]; totalRevenue: number; year: string }> = {
        "ABBV": {
            year: "2024",
            totalRevenue: 56300000000, // $56.3B
            segments: [
                { name: "Immunology", value: 26700000000 },
                { name: "Neuroscience", value: 9000000000 },
                { name: "Oncology", value: 6600000000 },
                { name: "Aesthetics", value: 5200000000 },
                { name: "Other Key Products", value: 3600000000 },
                { name: "All Other", value: 3000000000 },
                { name: "Eye Care", value: 2200000000 }
            ]
        },
        "ABNB": {
            year: "2024",
            totalRevenue: 11100000000, // $11.1B
            segments: [
                { name: "Marketplace Platform Revenue", value: 11100000000 }
            ]
        },
        "COST": {
            year: "2025",
            totalRevenue: 275235000000, // $275.2B
            segments: [
                { name: "Net Sales", value: 269912000000 },
                { name: "Membership Fees", value: 5323000000 }
            ]
        },
        "XOM": {
            year: "2024",
            totalRevenue: 35052000000, // $35.05B (segment earnings excl. corporate)
            segments: [
                { name: "Upstream (Oil & Gas Production)", value: 25390000000 },
                { name: "Energy Products (Refining & Fuel)", value: 4033000000 },
                { name: "Specialty Products", value: 3052000000 },
                { name: "Chemical Products", value: 2577000000 }
            ]
        },
        "GOOGL": {
            year: "2024",
            totalRevenue: 350018000000, // $350B
            segments: [
                { name: "Google Search & other", value: 198084000000 },
                { name: "Google Cloud", value: 43229000000 },
                { name: "Google subscriptions, platforms, and devices", value: 40340000000 },
                { name: "YouTube ads", value: 36147000000 },
                { name: "Google Network", value: 30359000000 },
                { name: "Other Bets", value: 1648000000 },
                { name: "Hedging gains (losses)", value: 211000000 }
            ]
        },
        "GOOG": {
            year: "2024",
            totalRevenue: 350018000000, // $350B
            segments: [
                { name: "Google Search & other", value: 198084000000 },
                { name: "Google Cloud", value: 43229000000 },
                { name: "Google subscriptions, platforms, and devices", value: 40340000000 },
                { name: "YouTube ads", value: 36147000000 },
                { name: "Google Network", value: 30359000000 },
                { name: "Other Bets", value: 1648000000 },
                { name: "Hedging gains (losses)", value: 211000000 }
            ]
        }
    }

    let secQualitative: any = null
    let secError = false
    let secErrorMessage: string | null = null
    let cached: any = null
    try {
        // Check for hardcoded manual overrides first
        const manualOverride = MANUAL_SEGMENT_OVERRIDES[data.ticker.toUpperCase()]
        if (manualOverride) {
            const segmentTotal = manualOverride.segments.reduce((sum, seg) => sum + seg.value, 0)
            secQualitative = {
                totalRevenue: manualOverride.totalRevenue,
                interestIncome: 0,
                nonCompliantPercent: 0,
                compliantPercent: 100,
                questionablePercent: 0,
                filing: null,
                dataSources: {
                    totalRevenue: `Manual override (${manualOverride.year} 10-K)`,
                    interestIncome: "Manual override",
                    segmentRevenue: `Manual override (${manualOverride.year} 10-K)`
                },
                segments: manualOverride.segments,
                segmentTotal
            }
        }

        const override = await getQualitativeOverride(data.ticker)
        if (!secQualitative && override?.segments?.length) {
            const segmentTotal = override.segments.reduce((sum: number, seg: any) => sum + (seg.value || 0), 0)
            secQualitative = {
                totalRevenue: Number(override.total_revenue || segmentTotal || 0),
                interestIncome: 0,
                nonCompliantPercent: 0,
                compliantPercent: 100,
                questionablePercent: 0,
                filing: null,
                dataSources: {
                    totalRevenue: "Manual override",
                    interestIncome: "Manual override",
                    segmentRevenue: "Manual override"
                },
                segments: override.segments,
                segmentTotal
            }
        }
        
        if (!secQualitative) {
            cached = await getSecCache(data.ticker)
            secQualitative = cached || await getSecQualitativeForTicker(data.ticker)
        }
        if (secQualitative) {
            compliantPercent = secQualitative.compliantPercent
            questionablePercent = secQualitative.questionablePercent
            nonCompliantPercent = secQualitative.nonCompliantPercent
            qualitativeMethod = "segment_based"
            secFiling = secQualitative.filing
            qualitativeSources = secQualitative.dataSources
            if (secQualitative.xbrlTags) {
                qualitativeSources = { ...qualitativeSources, xbrlTags: secQualitative.xbrlTags }
            }
            // Prefer SEC total revenue for display (in millions)
            data.totalRevenue = secQualitative.totalRevenue / 1_000_000
            if (secQualitative.segments && secQualitative.segments.length > 0) {
                const haramKeywords = [
                    "interest", "riba", "gambling", "casino", "lottery",
                    "alcohol", "beer", "wine", "spirits", "pork", "tobacco",
                    "adult", "porn", "weapon", "defense", "arms", "firearm",
                    "conventional finance", "bank", "insurance"
                ]
                const questionableKeywords = [
                    "other", "services", "licenses", "licensing", "ads", "advertising", "gaming"
                ]
                const isHaramSegment = (name: string) => {
                    const lower = name.toLowerCase()
                    return haramKeywords.some(k => lower.includes(k))
                }
                const isQuestionableSegment = (name: string) => {
                    const lower = name.toLowerCase()
                    return questionableKeywords.some(k => lower.includes(k))
                }
                const classifySegment = (name: string) => {
                    if (data.ticker.toUpperCase() === "GOOGL" || data.ticker.toUpperCase() === "GOOG") {
                        const lower = name.toLowerCase()
                        if (lower.includes("hedging gains") || lower.includes("hedging") || lower.includes("gains")) return "haram"
                        if (lower.includes("other bets")) return "haram"
                        if (lower.includes("search & other") || lower.includes("search and other")) return "halal"
                        if (lower.includes("advertising") || lower.includes("ads")) return "questionable"
                    }
                    if (data.ticker.toUpperCase() === "META") {
                        const lower = name.toLowerCase()
                        if (lower.includes("advertising")) return "questionable"
                        if (lower.includes("other revenue")) return "questionable"
                        if (lower.includes("family of apps")) return "halal"
                        if (lower.includes("reality labs")) return "halal"
                    }
                    if (data.ticker.toUpperCase() === "NFLX") {
                        const lower = name.toLowerCase()
                        if (lower.includes("streaming")) return "questionable"
                    }
                    if (data.ticker.toUpperCase() === "MSFT") {
                        const lower = name.toLowerCase()
                        if (lower.includes("search and news advertising") || lower.includes("advertising")) {
                            return "questionable"
                        }
                        if (lower.includes("gaming")) return "questionable"
                        if (
                            lower.includes("server products and cloud services")
                            || lower.includes("microsoft 365 commercial products and cloud services")
                            || lower.includes("dynamics products and cloud services")
                            || lower.includes("enterprise and partner services")
                            || lower.includes("microsoft 365 consumer products and cloud services")
                            || lower.includes("windows and devices")
                            || lower.includes("linkedin")
                        ) {
                            return "halal"
                        }
                        if (lower === "other") return "questionable"
                        return "halal"
                    }
                    if (data.ticker.toUpperCase() === "AMZN") {
                        const lower = name.toLowerCase()
                        if (lower.includes("subscription services")) return "halal"
                        if (lower.includes("third-party seller services") || lower.includes("third party seller services")) return "halal"
                    }
                    if (data.ticker.toUpperCase() === "DIS") {
                        const lower = name.toLowerCase()
                        if (lower.includes("entertainment")) return "questionable"
                        if (lower.includes("sports")) return "halal"
                        if (lower.includes("experiences")) return "halal"
                        if (lower.includes("eliminations")) return "halal"
                    }
                    if (data.ticker.toUpperCase() === "V") {
                        return "halal"
                    }
                    if (data.ticker.toUpperCase() === "WMT") {
                        return "halal"
                    }
                    if (data.ticker.toUpperCase() === "JPM") {
                        const lower = name.toLowerCase()
                        if (lower.includes("net interest")) return "haram"
                        if (lower.includes("noninterest")) return "questionable"
                    }
                    if (data.ticker.toUpperCase() === "ABBV") {
                        const lower = name.toLowerCase()
                        // Immunology: Skyrizi, Humira, Rinvoq - halal pharmaceuticals
                        if (lower.includes("immunology") || lower.includes("skyrizi") || lower.includes("humira") || lower.includes("rinvoq")) return "halal"
                        // Oncology: Imbruvica, Venclexta, Elahere, Epkinly - halal pharmaceuticals
                        if (lower.includes("oncology") || lower.includes("imbruvica") || lower.includes("venclexta") || lower.includes("elahere") || lower.includes("epkinly")) return "halal"
                        // Neuroscience: Botox Therapeutic, Vraylar, Ubrelvy, Qulipta, Duodopa - halal (therapeutic use)
                        if (lower.includes("neuroscience") || lower.includes("vraylar") || lower.includes("ubrelvy") || lower.includes("qulipta") || lower.includes("duodopa")) return "halal"
                        if (lower.includes("botox therapeutic") || lower.includes("botox") && lower.includes("therapeutic")) return "halal"
                        // Aesthetics: Botox Cosmetic, Juvederm - questionable (cosmetic/vanity)
                        if (lower.includes("aesthetics") || lower.includes("cosmetic") || lower.includes("juvederm")) return "questionable"
                        // Eye Care: Ozurdex, Lumigan, Alphagan, Restasis - halal pharmaceuticals
                        if (lower.includes("eye care") || lower.includes("ozurdex") || lower.includes("lumigan") || lower.includes("ganfort") || lower.includes("alphagan") || lower.includes("combigan") || lower.includes("restasis")) return "halal"
                        // Other products: Creon, Mavyret, Linzess - halal pharmaceuticals
                        if (lower.includes("creon") || lower.includes("mavyret") || lower.includes("linzess") || lower.includes("constella")) return "halal"
                        // Default for other pharma segments
                        if (lower.includes("other") || lower.includes("all other")) return "questionable"
                        return "halal"
                    }
                    if (data.ticker.toUpperCase() === "ABNB") {
                        // Airbnb operates as a unified marketplace platform connecting hosts and guests - halal
                        return "halal"
                    }
                    if (data.ticker.toUpperCase() === "COST") {
                        // Costco - wholesale retail and membership fees - all halal
                        return "halal"
                    }
                    if (data.ticker.toUpperCase() === "XOM") {
                        // Exxon Mobil - oil & gas, refining, chemicals, specialty products - all halal
                        return "halal"
                    }
                    if (isHaramSegment(name)) return "haram"
                    if (isQuestionableSegment(name)) return "questionable"
                    return "halal"
                }
                const totalSegmentRevenue = secQualitative.segments
                    .reduce((sum: number, seg: any) => sum + (seg.value || 0), 0)
                if (totalSegmentRevenue > 0) {
                    secQualitative.segments = secQualitative.segments.map((seg: any) => ({
                        ...seg,
                        compliance: classifySegment(seg.name || "")
                    }))
                    const haramRevenue = secQualitative.segments
                        .filter((seg: any) => seg.compliance === "haram")
                        .reduce((sum: number, seg: any) => sum + (seg.value || 0), 0)
                    const questionableRevenue = secQualitative.segments
                        .filter((seg: any) => seg.compliance === "questionable")
                        .reduce((sum: number, seg: any) => sum + (seg.value || 0), 0)
                    nonCompliantPercent = Math.min(100, (haramRevenue / totalSegmentRevenue) * 100)
                    questionablePercent = Math.min(100, (questionableRevenue / totalSegmentRevenue) * 100)
                    compliantPercent = Math.max(0, 100 - nonCompliantPercent - questionablePercent)
                    qualitativeSources = {
                        ...qualitativeSources,
                        segmentRevenue: "SEC 10-K (segment breakdown)"
                    }
                    if (secQualitative.segmentTotal && secQualitative.segmentTotal > 0) {
                        qualitativeSources = {
                            ...qualitativeSources,
                            totalRevenue: "SEC 10-K (sum of segment revenue)"
                        }
                        data.totalRevenue = secQualitative.segmentTotal / 1_000_000
                    }
                    if (haramRevenue > 0) {
                        issues.push("Haram segment revenue detected (e.g. gaming)")
                    }
                    if (questionableRevenue > 0) {
                        issues.push("Questionable segment revenue detected (e.g. streaming/ads)")
                    }
                }
            }
            // Prefer SEC-based revenue data when available
            revenueDataAvailable = true
            if (!cached) {
                await setSecCache(data.ticker, { ...secQualitative, cacheVersion: SEC_CACHE_VERSION })
            }
        }
    } catch (e: any) {
        // Fall back to estimates if SEC pipeline fails
        secError = true
        secErrorMessage = e?.message || "SEC fetch failed"
    }

    const sectorEstimates: Record<string, { compliant: number, questionable: number, nonCompliant: number }> = {
        "technology": { compliant: 92, questionable: 5, nonCompliant: 3 },
        "communication services": { compliant: 90, questionable: 6, nonCompliant: 4 },
        "consumer discretionary": { compliant: 88, questionable: 7, nonCompliant: 5 },
        "consumer staples": { compliant: 94, questionable: 4, nonCompliant: 2 },
        "healthcare": { compliant: 93, questionable: 4, nonCompliant: 3 },
        "industrials": { compliant: 91, questionable: 5, nonCompliant: 4 },
        "materials": { compliant: 90, questionable: 6, nonCompliant: 4 },
        "energy": { compliant: 87, questionable: 6, nonCompliant: 7 },
        "utilities": { compliant: 89, questionable: 6, nonCompliant: 5 },
        "real estate": { compliant: 85, questionable: 7, nonCompliant: 8 }
    }

    const industryHasGold = /gold/i.test(industryLower)
    const descriptionHasGold = /gold/i.test((data.description || "").toLowerCase())
    const isGoldMining = industryHasGold || descriptionHasGold

    if (qualitativeMethod === "insufficient_data" && isGoldMining) {
        compliantPercent = 100
        questionablePercent = 0
        nonCompliantPercent = 0
        qualitativeMethod = "industry_estimate"
    } else if (qualitativeMethod === "insufficient_data" && isHaramBusiness) {
        compliantPercent = 0
        questionablePercent = 0
        nonCompliantPercent = 100
        qualitativeMethod = "industry_estimate"
    } else if (qualitativeMethod === "insufficient_data" && (sectorLower === "financial services" || sectorLower === "financials")) {
        compliantPercent = 0
        questionablePercent = 0
        nonCompliantPercent = 100
        qualitativeMethod = "industry_estimate"
    } else if (qualitativeMethod === "insufficient_data") {
        const sectorKey = sectorLower.trim()
        const estimate = sectorEstimates[sectorKey] || { compliant: 92, questionable: 5, nonCompliant: 3 }
        compliantPercent = estimate.compliant
        questionablePercent = estimate.questionable
        nonCompliantPercent = estimate.nonCompliant
        qualitativeMethod = "industry_estimate"
    }

    const qualitativePassed = typeof nonCompliantPercent === "number"
        ? nonCompliantPercent < 5
        && !isHaramBusiness
        && (typeof questionablePercent === "number" ? questionablePercent < 5 : true)
        : false

    if (secError) {
        issues.push("SEC data unavailable; qualitative screening uses sector-based estimates")
    }
    if (data.isBDSListed) {
        issues.push("Listed on BDS Boycott List - boycott status makes this stock questionable")
    }
    if (isHaramBusiness) {
        issues.push(`Operates in non-compliant industry: ${data.industry}`)
    }
    if (sectorLower === "financial services" || sectorLower === "financials" || industryLower.includes("bank")) {
        issues.push("Banking/financial industry treated as non-compliant")
    }
    if (qualitativeMethod === "segment_based" && qualitativeSources?.xbrlTags?.interestIncome === "Unavailable") {
        issues.push("Interest income not found in SEC XBRL; assumed 0%")
    }
    if (qualitativeMethod === "industry_estimate") {
        issues.push("Revenue data unavailable; qualitative screening uses sector-based estimates")
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
        overallStatus = "Questionable"
    } else if (isHaramBusiness) {
        overallStatus = "Non-Compliant"
    } else if (sectorLower === "financial services" || sectorLower === "financials" || industryLower.includes("bank")) {
        overallStatus = "Non-Compliant"
    } else if (typeof nonCompliantPercent === "number" && nonCompliantPercent >= 5) {
        overallStatus = "Non-Compliant"
    } else if (typeof questionablePercent === "number" && questionablePercent >= 5) {
        overallStatus = "Questionable"
    } else if (!qualitativePassed) {
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
            financialCurrency: data.currency,
        qualitative: {
            passed: qualitativePassed && !data.isBDSListed,
            compliantPercent,
            questionablePercent,
            nonCompliantPercent,
            issues,
            revenueDataAvailable,
            dataSources: qualitativeSources,
            segmentBreakdown: secQualitative?.segments || [],
            segmentTotal: secQualitative?.segmentTotal || undefined,
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
        secFiling: secFiling ?? undefined,
        secDebug: process.env.NODE_ENV !== "production" && secErrorMessage
            ? { error: secErrorMessage }
            : undefined,
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

        const screening = await calculateScreening(stockData)

        return NextResponse.json(screening)
    } catch (error) {
        console.error("API Error:", error)
        return NextResponse.json({ error: "Failed to fetch stock data" }, { status: 500 })
    }
}
