"use client"

import { useState, useEffect, Suspense } from "react"
import { Search, CheckCircle2, XCircle, AlertTriangle, Info, ExternalLink, Building, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { screenStock, searchStocks, getAvailableStocks, type ScreeningResult } from "@/lib/stock-data"
import { usePaywall } from "@/hooks/use-paywall"
import { usePortfolio } from "@/hooks/use-portfolio"

function CircularProgress({
    percentage,
    color,
    label,
    size = 120
}: {
    percentage: number
    color: string
    label: string
    size?: number
}) {
    const strokeWidth = 8
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (percentage / 100) * circumference

    return (
        <div className="flex flex-col items-center">
            <div className="relative" style={{ width: size, height: size }}>
                <svg className="transform -rotate-90" width={size} height={size}>
                    <circle
                        className="text-muted"
                        strokeWidth={strokeWidth}
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                    />
                    <circle
                        className={color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">{percentage.toFixed(0)}%</span>
                </div>
            </div>
            <span className="mt-2 text-sm text-muted-foreground uppercase tracking-wide">{label}</span>
        </div>
    )
}

function RatioCard({
    value,
    label,
    description,
    passed
}: {
    value: number
    label: string
    description: string
    passed: boolean
}) {
    return (
        <div className="bg-background rounded-xl p-6 border border-border">
            <div className="flex flex-col items-center">
                <div className="relative w-28 h-28 mb-4">
                    <svg className="transform -rotate-90 w-full h-full">
                        <circle
                            className="text-muted"
                            strokeWidth={6}
                            stroke="currentColor"
                            fill="transparent"
                            r={50}
                            cx={56}
                            cy={56}
                        />
                        <circle
                            className={passed ? "text-green-500" : "text-red-500"}
                            strokeWidth={6}
                            strokeDasharray={314}
                            strokeDashoffset={314 - (Math.min(value, 100) / 100) * 314}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r={50}
                            cx={56}
                            cy={56}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold">{value.toFixed(2)}%</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                    {passed ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="font-medium text-sm">{label}</span>
                </div>
                <p className="text-xs text-muted-foreground text-center">{description}</p>
                <p className="text-xs text-muted-foreground mt-1">Must be less than 30%</p>
            </div>
        </div>
    )
}

import { useSearchParams } from "next/navigation"

export default function ScreenerPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ScreenerContent />
        </Suspense>
    )
}

function ScreenerContent() {
    const searchParams = useSearchParams()
    const initialQuery = searchParams.get("q") || ""

    const [searchQuery, setSearchQuery] = useState(initialQuery)
    const [result, setResult] = useState<ScreeningResult | null>(null)
    const [suggestions, setSuggestions] = useState<{ symbol: string, name: string, type: string }[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [showQualitativeDetails, setShowQualitativeDetails] = useState(false)
    const [showQuantitativeDetails, setShowQuantitativeDetails] = useState(false)
    const [notFound, setNotFound] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isSearching, setIsSearching] = useState(false)

    // Popular stocks for quick access
    const popularStocks = ["TSLA", "AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "AMD", "NFLX", "DIS"]

    // Handle Initial URL Query
    useEffect(() => {
        if (initialQuery) {
            handleSearch(initialQuery)
        }
    }, [])

    // Debounced search from Yahoo Finance
    useEffect(() => {
        if (searchQuery.length >= 2 && searchQuery !== initialQuery) { // Update condition to avoid double triggers
            setIsSearching(true)
            const timeoutId = setTimeout(async () => {
                try {
                    const response = await fetch(`/api/search-stocks?q=${encodeURIComponent(searchQuery)}`)
                    if (response.ok) {
                        const data = await response.json()
                        setSuggestions(data.results || [])
                        setShowSuggestions(data.results?.length > 0)
                    }
                } catch (error) {
                    console.error("Search error:", error)
                    // Fall back to local search
                    const matches = searchStocks(searchQuery)
                    setSuggestions(matches.slice(0, 5).map(s => ({ symbol: s, name: s, type: "EQUITY" })))
                    setShowSuggestions(matches.length > 0)
                } finally {
                    setIsSearching(false)
                }
            }, 300) // 300ms debounce

            return () => clearTimeout(timeoutId)
        } else {
            setSuggestions([])
            setShowSuggestions(false)
        }
    }, [searchQuery])

    const { incrementSearch, isLimitReached, setPaywallOpen } = usePaywall()
    const { addToPortfolio } = usePortfolio()

    const handleSearch = async (ticker: string) => {
        if (isLimitReached) {
            setPaywallOpen(true)
            return
        }
        incrementSearch()

        setShowSuggestions(false)
        setSearchQuery(ticker.toUpperCase())
        setIsLoading(true)
        setNotFound(false)
        setResult(null)
        setShowQualitativeDetails(false)
        setShowQuantitativeDetails(false)

        try {
            // First try the API for real-time data
            const response = await fetch(`/api/screen-stock?ticker=${ticker.toUpperCase()}`)

            if (response.ok) {
                const data = await response.json()
                setResult(data)
                setNotFound(false)
            } else {
                // Fall back to local data if API fails
                const localResult = screenStock(ticker)
                if (localResult) {
                    setResult(localResult)
                    setNotFound(false)
                } else {
                    setNotFound(true)
                }
            }
        } catch (error) {
            console.error("API Error:", error)
            // Fall back to local data
            const localResult = screenStock(ticker)
            if (localResult) {
                setResult(localResult)
                setNotFound(false)
            } else {
                setNotFound(true)
            }
        } finally {
            setIsLoading(false)
        }
    }

    const availableStocks = getAvailableStocks()

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            {/* Disclaimer Banner */}
            <div className="bg-muted/50 border-b border-border py-3 px-4">
                <p className="text-sm text-muted-foreground text-center max-w-4xl mx-auto">
                    <strong>Disclaimer:</strong> As-salamu alaykum, this stock screener is made to the best of our ability, there may be errors. Please use this as a source of information. May Allah make it easy for us!
                </p>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">Stock Screener</h1>
                    <p className="text-muted-foreground">Check if a stock is Shariah compliant based on AAOIFI standards</p>
                </div>

                {/* Search Box */}
                <div className="max-w-xl mx-auto mb-8 relative">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                        <Input
                            type="text"
                            placeholder="Search by ticker (e.g., TSLA, AAPL, MSFT)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch(searchQuery)}
                            className="pl-10 pr-4 py-6 text-lg"
                        />
                        <Button
                            onClick={() => handleSearch(searchQuery)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        >
                            Screen
                        </Button>
                    </div>

                    {/* Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-80 overflow-y-auto">
                            {isSearching && (
                                <div className="px-4 py-2 text-sm text-muted-foreground">
                                    Searching...
                                </div>
                            )}
                            {suggestions.map((stock) => (
                                <button
                                    key={stock.symbol}
                                    onClick={() => handleSearch(stock.symbol)}
                                    className="w-full px-4 py-3 text-left hover:bg-muted flex items-center justify-between first:rounded-t-lg last:rounded-b-lg border-b border-border last:border-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono font-bold text-primary">{stock.symbol}</span>
                                        <span className="text-sm text-muted-foreground truncate max-w-[200px]">{stock.name}</span>
                                    </div>
                                    <span className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground">{stock.type}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Loading State */}
                {isLoading && (
                    <Card className="max-w-xl mx-auto">
                        <CardContent className="p-8 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                            <h3 className="text-xl font-semibold mb-2">Fetching Real-Time Data...</h3>
                            <p className="text-muted-foreground">
                                Getting financial data from Yahoo Finance for {searchQuery}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Available Stocks */}
                {!result && !notFound && !isLoading && (
                    <div className="text-center mb-8">
                        <p className="text-sm text-muted-foreground mb-3">Try any stock ticker (powered by Yahoo Finance):</p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {popularStocks.map((ticker) => (
                                <Button
                                    key={ticker}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSearch(ticker)}
                                >
                                    {ticker}
                                </Button>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">
                            Or type any valid stock ticker in the search box above
                        </p>
                    </div>
                )}

                {/* Not Found */}
                {notFound && (
                    <Card className="max-w-xl mx-auto">
                        <CardContent className="p-8 text-center">
                            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Stock Not Found</h3>
                            <p className="text-muted-foreground mb-4">
                                We don&apos;t have data for &quot;{searchQuery}&quot; yet. Try one of our available stocks.
                            </p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {availableStocks.slice(0, 6).map((ticker) => (
                                    <Button
                                        key={ticker}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSearch(ticker)}
                                    >
                                        {ticker}
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Results */}
                {result && (
                    <div className="space-y-6">
                        {/* Status Header */}
                        <Card className={`overflow-hidden ${result.overallStatus === "Compliant"
                            ? "border-green-500 bg-gradient-to-r from-green-500/10 to-transparent"
                            : result.overallStatus === "Questionable"
                                ? "border-yellow-500 bg-gradient-to-r from-yellow-500/10 to-transparent"
                                : "border-red-500 bg-gradient-to-r from-red-500/10 to-transparent"
                            }`}>
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-full ${result.overallStatus === "Compliant" ? "bg-green-500" :
                                            result.overallStatus === "Questionable" ? "bg-yellow-500" : "bg-red-500"
                                            }`}>
                                            {result.overallStatus === "Compliant" ? (
                                                <CheckCircle2 className="w-8 h-8 text-white" />
                                            ) : result.overallStatus === "Questionable" ? (
                                                <AlertTriangle className="w-8 h-8 text-white" />
                                            ) : (
                                                <XCircle className="w-8 h-8 text-white" />
                                            )}
                                        </div>
                                        <div>
                                            <Badge className={`mb-1 ${result.overallStatus === "Compliant" ? "bg-green-500 hover:bg-green-600" :
                                                result.overallStatus === "Questionable" ? "bg-yellow-500 hover:bg-yellow-600" :
                                                    "bg-red-500 hover:bg-red-600"
                                                }`}>
                                                Shariah {result.overallStatus}
                                            </Badge>
                                            <h2 className="text-2xl font-bold">{result.name}</h2>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-end gap-2">
                                            {result.logo && (
                                                <img
                                                    src={result.logo}
                                                    alt={result.name}
                                                    className="w-16 h-16 rounded-lg bg-white p-2 mb-2"
                                                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                                                />
                                            )}
                                            <div className="text-right">
                                                <p className="font-mono text-2xl font-bold">{result.ticker}</p>
                                                <p className="text-sm text-muted-foreground">Following AAOIFI standards</p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-2 mt-1"
                                                onClick={() => addToPortfolio(result.ticker, result.name, 'Stock', { sector: result.sector })}
                                            >
                                                <Plus className="w-4 h-4" /> Save to Portfolio
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* BDS Warning */}
                                {result.isBDSListed && (
                                    <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-300 dark:border-red-800">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                                            <div>
                                                <h4 className="font-semibold text-red-800 dark:text-red-300">BDS Boycott Listed</h4>
                                                <p className="text-sm text-red-700 dark:text-red-400">
                                                    This company is on the BDS boycott list for supporting or being complicit with Israeli occupation.{" "}
                                                    <a
                                                        href="https://bdsmovement.net/Guide-to-BDS-Boycott"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="underline inline-flex items-center gap-1"
                                                    >
                                                        Learn more <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Company Profile Section */}
                        {result.profile && result.profile.description && (
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold flex items-center gap-2">
                                            <Building className="w-5 h-5" />
                                            Company Profile
                                        </h3>
                                        {result.profile.website && (
                                            <a
                                                href={result.profile.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-primary hover:underline flex items-center gap-1"
                                            >
                                                Visit Website <ExternalLink className="w-3 h-3" />
                                            </a>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                                        {result.profile.description.length > 800
                                            ? result.profile.description.substring(0, 800) + "..."
                                            : result.profile.description}
                                    </p>

                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Industry</p>
                                            <p className="font-medium">{result.industry}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Sector</p>
                                            <p className="font-medium">{result.sector}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Location</p>
                                            <p className="font-medium">
                                                {result.profile.city && result.profile.country
                                                    ? `${result.profile.city}, ${result.profile.country}`
                                                    : result.profile.country || "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Employees</p>
                                            <p className="font-medium">
                                                {result.profile.employees > 0
                                                    ? result.profile.employees.toLocaleString()
                                                    : "N/A"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Exchange Info */}
                                    <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
                                        <span>
                                            <strong>Exchange:</strong> {result.profile.exchange || "N/A"}
                                        </span>
                                        <span>
                                            <strong>Currency:</strong> {result.profile.currency || "USD"}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Qualitative Screening */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <CardTitle>Qualitative Screening</CardTitle>
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Info className="w-4 h-4 mr-1" />
                                        Revenue Analysis
                                    </div>
                                </div>
                                <Badge className={result.qualitative.passed ? "bg-green-500" : "bg-red-500"}>
                                    {result.qualitative.passed ? "Pass" : "Fail"}
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-muted/50 rounded-lg p-6">
                                    <div className="grid grid-cols-3 gap-8">
                                        <CircularProgress
                                            percentage={result.qualitative.compliantPercent}
                                            color="text-green-500"
                                            label="Compliant"
                                        />
                                        <CircularProgress
                                            percentage={result.qualitative.questionablePercent}
                                            color="text-yellow-500"
                                            label="Questionable"
                                        />
                                        <CircularProgress
                                            percentage={result.qualitative.nonCompliantPercent}
                                            color="text-red-500"
                                            label="Non-Compliant"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                                    <p className="text-sm text-muted-foreground">
                                        Organizations are only to be considered compliant for the <strong>Qualitative Screening</strong>{" "}
                                        if the cumulative revenue from non-compliant activities and non-operating interest income
                                        does not exceed 5% of their total income.
                                    </p>
                                </div>

                                {/* View Detailed Results Button */}
                                <div className="mt-4">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-between"
                                        onClick={() => setShowQualitativeDetails(!showQualitativeDetails)}
                                    >
                                        {showQualitativeDetails ? "Hide detailed results" : "View detailed results"}
                                        <span>{showQualitativeDetails ? "▲" : "▼"}</span>
                                    </Button>
                                    {showQualitativeDetails && (
                                        <div className="mt-4 space-y-4">
                                            {/* Business Activities */}
                                            <div className="p-4 bg-background rounded-lg border border-border">
                                                <h4 className="font-semibold mb-3">Business Activities</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {result.businessActivities.map((activity, i) => (
                                                        <span key={i} className="px-3 py-1 bg-muted rounded-full text-sm">
                                                            {activity}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Sector & Date */}
                                            <div className="p-4 bg-background rounded-lg border border-border">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Sector</p>
                                                        <p className="font-medium">{result.sector}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Last Updated</p>
                                                        <p className="font-medium">{result.lastUpdated}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Compliance Explanation */}
                                            <div className={`p-4 rounded-lg border ${result.qualitative.passed
                                                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                                                }`}>
                                                <h4 className={`font-semibold mb-2 ${result.qualitative.passed
                                                    ? "text-green-800 dark:text-green-300"
                                                    : "text-red-800 dark:text-red-300"
                                                    }`}>
                                                    {result.qualitative.passed ? "Why This Stock Passes Qualitative Screening" : "Issues Found"}
                                                </h4>
                                                {result.qualitative.passed ? (
                                                    <ul className="space-y-2 text-sm text-green-700 dark:text-green-400">
                                                        <li className="flex items-start gap-2">
                                                            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                            Non-compliant revenue ({result.qualitative.nonCompliantPercent}%) is below 5% threshold
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                            Questionable revenue ({result.qualitative.questionablePercent}%) is within acceptable limits
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                            Primary business activities are Halal
                                                        </li>
                                                        {!result.isBDSListed && (
                                                            <li className="flex items-start gap-2">
                                                                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                                Not on BDS boycott list
                                                            </li>
                                                        )}
                                                    </ul>
                                                ) : (
                                                    <ul className="space-y-2">
                                                        {result.qualitative.issues.map((issue, i) => (
                                                            <li key={i} className="text-sm text-red-700 dark:text-red-400 flex items-start gap-2">
                                                                <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                                {issue}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quantitative Screening */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <CardTitle>Quantitative Screening</CardTitle>
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Info className="w-4 h-4 mr-1" />
                                        Financial Ratios
                                    </div>
                                </div>
                                <Badge className={result.quantitative.passed ? "bg-green-500" : "bg-red-500"}>
                                    {result.quantitative.passed ? "Pass" : "Fail"}
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-muted/50 rounded-lg p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <RatioCard
                                            value={result.quantitative.debtRatio}
                                            label="Interest-bearing Debt Ratio"
                                            description="Total Debt / Market Cap"
                                            passed={result.quantitative.debtPassed}
                                        />
                                        <RatioCard
                                            value={result.quantitative.securitiesRatio}
                                            label="Interest-bearing Securities"
                                            description="(Cash + Equivalents + Deposits) / Market Cap"
                                            passed={result.quantitative.securitiesPassed}
                                        />
                                        <RatioCard
                                            value={result.quantitative.liquidityRatio ?? 0}
                                            label="Liquidity Ratio"
                                            description="(Cash + Equivalents + Receivables) / Total Assets"
                                            passed={result.quantitative.liquidityPassed}
                                        />
                                    </div>
                                </div>

                                {/* View Detailed Results Button */}
                                <div className="mt-4">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-between"
                                        onClick={() => setShowQuantitativeDetails(!showQuantitativeDetails)}
                                    >
                                        {showQuantitativeDetails ? "Hide detailed results" : "View detailed results"}
                                        <span>{showQuantitativeDetails ? "▲" : "▼"}</span>
                                    </Button>
                                    {showQuantitativeDetails && (
                                        <div className="mt-4 space-y-4">
                                            {/* Raw Financial Data */}
                                            <div className="p-4 bg-background rounded-lg border border-border">
                                                <h4 className="font-semibold mb-4">Financial Data (in millions USD)</h4>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                    <div className="p-3 bg-muted/50 rounded-lg">
                                                        <p className="text-xs text-muted-foreground">Market Cap</p>
                                                        <p className="font-bold text-lg">${(result.rawData.marketCap).toLocaleString()}M</p>
                                                    </div>
                                                    <div className="p-3 bg-muted/50 rounded-lg">
                                                        <p className="text-xs text-muted-foreground">Total Debt</p>
                                                        <p className="font-bold text-lg">${(result.rawData.totalDebt).toLocaleString()}M</p>
                                                    </div>
                                                    <div className="p-3 bg-muted/50 rounded-lg">
                                                        <p className="text-xs text-muted-foreground">Cash & Equivalents</p>
                                                        <p className="font-bold text-lg">${(result.rawData.cashAndEquivalents).toLocaleString()}M</p>
                                                    </div>
                                                    <div className="p-3 bg-muted/50 rounded-lg">
                                                        <p className="text-xs text-muted-foreground">Deposits</p>
                                                        <p className="font-bold text-lg">
                                                            {result.rawData.deposits > 0
                                                                ? `$${result.rawData.deposits.toLocaleString()}M`
                                                                : <span className="text-muted-foreground text-sm">N/A</span>}
                                                        </p>
                                                    </div>
                                                    <div className="p-3 bg-muted/50 rounded-lg">
                                                        <p className="text-xs text-muted-foreground">Accounts Receivable</p>
                                                        <p className="font-bold text-lg">
                                                            {result.rawData.accountsReceivable > 0
                                                                ? `$${result.rawData.accountsReceivable.toLocaleString()}M`
                                                                : <span className="text-muted-foreground text-sm">N/A</span>}
                                                        </p>
                                                    </div>
                                                    <div className="p-3 bg-muted/50 rounded-lg">
                                                        <p className="text-xs text-muted-foreground">Total Assets</p>
                                                        <p className="font-bold text-lg">${(result.rawData.totalAssets).toLocaleString()}M</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Ratio Calculations */}
                                            <div className="p-4 bg-background rounded-lg border border-border">
                                                <h4 className="font-semibold mb-4">Ratio Calculations</h4>
                                                <div className="space-y-4">
                                                    {/* Debt Ratio */}
                                                    <div className={`p-3 rounded-lg ${result.quantitative.debtPassed ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="font-medium">Interest-bearing Debt Ratio</span>
                                                            <span className={`font-bold ${result.quantitative.debtPassed ? "text-green-600" : "text-red-600"}`}>
                                                                {result.quantitative.debtRatio.toFixed(2)}%
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground font-mono">
                                                            = Total Debt / Market Cap = ${result.rawData.totalDebt.toLocaleString()}M / ${result.rawData.marketCap.toLocaleString()}M
                                                        </p>
                                                        <p className="text-xs mt-1 text-muted-foreground">
                                                            {result.quantitative.debtPassed ? "✓ Passes (below 30% threshold)" : "✗ Fails (exceeds 30% threshold)"}
                                                        </p>
                                                    </div>

                                                    {/* Securities Ratio */}
                                                    <div className={`p-3 rounded-lg ${result.quantitative.securitiesPassed ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="font-medium">Interest-bearing Securities Ratio</span>
                                                            <span className={`font-bold ${result.quantitative.securitiesPassed ? "text-green-600" : "text-red-600"}`}>
                                                                {result.quantitative.securitiesRatio.toFixed(2)}%
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground font-mono">
                                                            = (Cash + Deposits) / Market Cap = (${result.rawData.cashAndEquivalents.toLocaleString()}M + ${result.rawData.deposits.toLocaleString()}M) / ${result.rawData.marketCap.toLocaleString()}M
                                                        </p>
                                                        <p className="text-xs mt-1 text-muted-foreground">
                                                            {result.quantitative.securitiesPassed ? "✓ Passes (below 30% threshold)" : "✗ Fails (exceeds 30% threshold)"}
                                                        </p>
                                                    </div>

                                                    {/* Liquidity Ratio */}
                                                    <div className={`p-3 rounded-lg ${result.quantitative.liquidityPassed ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="font-medium">Liquidity Ratio</span>
                                                            <span className={`font-bold ${result.quantitative.liquidityPassed ? "text-green-600" : "text-red-600"}`}>
                                                                {result.quantitative.liquidityRatio !== null
                                                                    ? `${result.quantitative.liquidityRatio.toFixed(2)}%`
                                                                    : "N/A"}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground font-mono">
                                                            = (Cash + Receivables) / Total Assets = (${result.rawData.cashAndEquivalents.toLocaleString()}M + {result.rawData.accountsReceivable > 0 ? `$${result.rawData.accountsReceivable.toLocaleString()}M` : 'N/A'}) / ${result.rawData.totalAssets.toLocaleString()}M
                                                        </p>
                                                        <p className="text-xs mt-1 text-muted-foreground">
                                                            {result.quantitative.liquidityRatio !== null
                                                                ? (result.quantitative.liquidityPassed ? "✓ Passes (below 30% threshold)" : "✗ Fails (exceeds 30% threshold)")
                                                                : "⚠ Data unavailable - assumes pass"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Overall Explanation */}
                                            <div className={`p-4 rounded-lg border ${result.quantitative.passed
                                                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                                                }`}>
                                                <h4 className={`font-semibold mb-2 ${result.quantitative.passed
                                                    ? "text-green-800 dark:text-green-300"
                                                    : "text-red-800 dark:text-red-300"
                                                    }`}>
                                                    {result.quantitative.passed ? "Why This Stock Passes Quantitative Screening" : "Why This Stock Fails Quantitative Screening"}
                                                </h4>
                                                <p className={`text-sm ${result.quantitative.passed ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                                                    {result.quantitative.passed
                                                        ? "All three financial ratios are below the 30% threshold set by AAOIFI standards. This indicates that the company's debt levels and interest-bearing investments are within acceptable limits for Shariah-compliant investing."
                                                        : "One or more financial ratios exceed the 30% threshold set by AAOIFI standards. This indicates that the company may have excessive debt or interest-bearing investments that do not meet Shariah compliance requirements."
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Disclaimer */}
                        <div className="p-4 bg-muted/30 rounded-lg text-center">
                            <p className="text-xs text-muted-foreground">
                                This screening is for informational purposes only. Always consult with qualified financial advisors
                                and Shariah scholars before making investment decisions. Data may not reflect real-time values.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
