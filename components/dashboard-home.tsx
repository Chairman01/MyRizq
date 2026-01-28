"use client"

import { useState, useEffect, useMemo } from "react"
import { usePortfolio } from "@/hooks/use-portfolio"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePaywall } from "@/hooks/use-paywall"
import { TrendingUp, DollarSign, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight, Activity, Search, PlusCircle, X, ShieldCheck } from "lucide-react"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { etfData } from "@/lib/etf-data"

const generateMockHistory = (baseValue: number) => {
    const data = []
    let value = baseValue
    const volatility = 0.02 // 2% daily volatility

    for (let i = 30; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)

        // Random daily change
        const change = 1 + (Math.random() * volatility * 2 - volatility)
        value = value * change

        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: parseFloat(value.toFixed(2))
        })
    }
    return data
}

export function DashboardHome() {
    const { getCurrentPortfolio, getAllPortfolios, createPortfolio, selectPortfolio, currentPortfolioId, addToPortfolio, updateHolding } = usePortfolio()
    const { isPremium } = usePaywall()

    // Quick Add State
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedAsset, setSelectedAsset] = useState<any>(null)
    const [shares, setShares] = useState("")
    const [price, setPrice] = useState("")
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)

    // Real-time Data
    const [marketData, setMarketData] = useState<Record<string, { price: number, change: number, changePercent: number }>>({})
    const [isLoadingData, setIsLoadingData] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    // Get current active portfolio
    const currentPortfolio = getCurrentPortfolio()
    const allPortfolios = getAllPortfolios()
    const portfolioItems = currentPortfolio?.items || []

    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Fetch Prices Effect
    useEffect(() => {
        const fetchPrices = async () => {
            if (portfolioItems.length === 0) return
            setIsLoadingData(true)

            const newData: Record<string, any> = {}
            await Promise.all(portfolioItems.map(async (item) => {
                try {
                    const res = await fetch(`/api/quote?ticker=${item.ticker}`)
                    if (res.ok) {
                        const data = await res.json()
                        newData[item.ticker] = data
                    }
                } catch (e) {
                    console.error("Failed to fetch price for", item.ticker)
                }
            }))

            setMarketData(prev => ({ ...prev, ...newData }))
            setIsLoadingData(false)
        }

        // Fetch initially
        fetchPrices()
    }, [currentPortfolioId, portfolioItems.length])

    // Handle Creating New Portfolio
    const handleCreatePortfolio = () => {
        const name = prompt("Enter Portfolio Name (e.g. TFSA, RRSP, Crypto):")
        if (name) createPortfolio(name)
    }

    // Filter suggestions
    const searchResults = searchQuery.length > 1 ? etfData.filter(e =>
        e.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5) : []

    const handleSelectAsset = (asset: any) => {
        setSelectedAsset(asset)
        setPrice("120.50") // Mock current price pre-fill
        setShares("")
        setIsAddModalOpen(true)
        setSearchQuery("")
    }

    const handleConfirmAdd = () => {
        if (!selectedAsset) return

        // Add to portfolio
        addToPortfolio(selectedAsset.ticker, selectedAsset.name, 'ETF', {
            expenseRatio: selectedAsset.expenseRatio,
            shares: parseFloat(shares) || 0,
            avgPrice: parseFloat(price) || 0
        })

        // Also update holding explicitly if it existed (edge case, but safe)
        if (shares && price) {
            updateHolding(selectedAsset.ticker, parseFloat(shares), parseFloat(price))
        }

        setIsAddModalOpen(false)
    }

    // CALCULATE REAL VALUE
    const hasPortfolio = portfolioItems.length > 0
    let totalValue = 0
    let totalCost = 0
    let dayChangeValue = 0

    portfolioItems.forEach(item => {
        const livePrice = marketData[item.ticker]?.price
        const liveChange = marketData[item.ticker]?.change || 0

        // If tracker mode (shares > 0), use that.
        if (item.shares && item.shares > 0) {
            const currentPrice = livePrice || (item.avgPrice || 100)
            totalValue += item.shares * currentPrice
            totalCost += item.shares * (item.avgPrice || 0)
            dayChangeValue += item.shares * liveChange
        } else {
            // Fallback for Simulator mode (Allocation %)
            const simulatedValue = 10000 * (item.allocation / 100)
            totalValue += simulatedValue
            totalCost += simulatedValue
            const changePct = marketData[item.ticker]?.changePercent || 0
            dayChangeValue += simulatedValue * (changePct / 100)
        }
    })

    if (totalValue === 0 && hasPortfolio) totalValue = 10000

    const totalGain = totalValue - totalCost
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0
    const dayChangePercent = totalValue > 0 ? (dayChangeValue / totalValue) * 100 : 0

    const chartData = hasPortfolio ? generateMockHistory(totalValue) : []

    // Derived Stats
    const portfolioStats = useMemo(() => {
        if (!hasPortfolio) return null

        let totalVal = 0
        const itemsWithValue = portfolioItems.map(item => {
            const price = marketData[item.ticker]?.price || item.avgPrice || 100
            const val = (item.shares || 0) > 0 ? (item.shares! * price) : (10000 * (item.allocation || 0) / 100)
            totalVal += val
            return { ...item, currentValue: val }
        })

        if (totalVal === 0) return null

        let weightedExpense = 0
        let weightedYTD = 0
        const sectorMap = new Map<string, number>()

        itemsWithValue.forEach(item => {
            const weight = item.currentValue / totalVal

            if (item.expenseRatio) weightedExpense += item.expenseRatio * weight

            const etf = etfData.find(e => e.ticker === item.ticker)
            if (etf && etf.performance.ytd) weightedYTD += etf.performance.ytd * weight

            if (etf?.sectorAllocation) {
                etf.sectorAllocation.forEach(s => {
                    const sectorWeight = s.weight / 100 * weight
                    sectorMap.set(s.sector, (sectorMap.get(s.sector) || 0) + sectorWeight)
                })
            } else {
                const sector = "Other"
                sectorMap.set(sector, (sectorMap.get(sector) || 0) + weight)
            }
        })

        const sectors = Array.from(sectorMap.entries())
            .map(([sector, rawWeight]) => ({ sector, weight: rawWeight * 100 }))
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 5)

        // Top Holdings
        // Determine top holdings by weight
        const holdingsMap = new Map<string, { name: string, weight: number }>()
        itemsWithValue.forEach(item => {
            const weight = item.currentValue / totalVal * 100
            holdingsMap.set(item.ticker, { name: item.name, weight })
        })

        const holdings = Array.from(holdingsMap.values())
            .map(h => ({ ...h, ticker: Array.from(holdingsMap.keys()).find(k => holdingsMap.get(k) === h)! }))
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 5)

        return {
            expenseRatio: weightedExpense,
            ytd: weightedYTD,
            sectors,
            holdings
        }
    }, [portfolioItems, marketData, hasPortfolio])


    return (
        !isMounted ? null :
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Header with Search */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    </div>

                    {/* Search Bar - Center/Right */}
                    <div className="relative w-full md:w-96 max-w-lg">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Quick add asset (e.g. SPUS, HLAL)..."
                                className="pl-9 bg-white shadow-sm border-gray-200 focus-visible:ring-green-500 rounded-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 hidden md:flex">
                        <Badge variant="outline" className={`bg-opacity-50 border gap-1 transition-colors ${isLoadingData ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isLoadingData ? 'bg-yellow-500 animate-bounce' : 'bg-green-500 animate-pulse'}`} />
                            {isLoadingData ? 'Updating Prices...' : 'Market Live'}
                        </Badge>
                    </div>
                </div>

                {/* Top Cards Grid */}
                <div className="grid md:grid-cols-4 gap-6">
                    {/* Value Card - Spans 2 cols */}
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-green-600 to-green-700 text-white col-span-2">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium opacity-90 flex items-center justify-between">
                                {currentPortfolio?.name || 'Total Portfolio'} Value
                                <DollarSign className="w-4 h-4 opacity-75" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <div className="flex flex-col gap-1 mt-1 text-sm opacity-90">
                                <div className="flex items-center gap-2">
                                    {totalGain >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                    <span className="font-bold">
                                        {totalGain >= 0 ? "+" : ""}{totalGainPercent.toFixed(2)}%
                                    </span>
                                    <span>all time (${Math.abs(totalGain).toFixed(2)})</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs opacity-75">
                                    <span>Day: {dayChangeValue >= 0 ? "+" : ""}{dayChangeValue.toFixed(2)} ({dayChangePercent.toFixed(2)}%)</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Portfolio Stats */}
                    <Card className="border-0 shadow-sm bg-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between">
                                Key Metrics
                                <Activity className="w-4 h-4 text-gray-400" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {portfolioStats ? (
                                <>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 text-xs uppercase tracking-wide">Expense Ratio</span>
                                        <span className="font-bold text-gray-900">{portfolioStats.expenseRatio.toFixed(2)}%</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 text-xs uppercase tracking-wide">Est. YTD</span>
                                        <span className={`font-bold ${portfolioStats.ytd >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            {portfolioStats.ytd >= 0 ? '+' : ''}{portfolioStats.ytd.toFixed(2)}%
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-sm text-gray-400 text-center py-2">Add assets for metrics</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Cost Basis */}
                    <Card className="border-0 shadow-sm bg-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between">
                                Cost Basis
                                <Activity className="w-4 h-4 text-gray-400" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-900">${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                            <div className="text-sm text-gray-500 mt-1">Invested Capital</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Middle Section: Top Sectors & Holdings (Larger) */}
                <div className="grid md:grid-cols-2 gap-8">
                    <Card className="border border-gray-100 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <PieChartIcon className="w-5 h-5 text-gray-500" /> Top Sectors
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {portfolioStats ? (
                                <div className="space-y-4">
                                    {portfolioStats.sectors.map(s => (
                                        <div key={s.sector} className="flex items-center gap-3">
                                            <div className="flex-1">
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="font-medium text-gray-700">{s.sector}</span>
                                                    <span className="text-gray-500">{s.weight.toFixed(1)}%</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                    <div className="h-full bg-green-500" style={{ width: `${s.weight}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">No data available</div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border border-gray-100 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Activity className="w-5 h-5 text-gray-500" /> Top Holdings
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {portfolioStats ? (
                                <div className="divide-y divide-gray-50">
                                    {portfolioStats.holdings.map((h, i) => (
                                        <div key={h.ticker} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-green-50 text-green-700 font-bold text-xs flex items-center justify-center border border-green-100">
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{h.ticker}</p>
                                                    <p className="text-xs text-gray-500 truncate w-32">{h.name}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-mono font-medium text-gray-900">{h.weight.toFixed(2)}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">No holdings yet</div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Grid - Charts & List */}
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Chart Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border border-gray-100 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg">Performance</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                {hasPortfolio ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis
                                                dataKey="date"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 12, fill: '#6B7280' }}
                                                minTickGap={30}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 12, fill: '#6B7280' }}
                                                tickFormatter={(value) => `$${value}`}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Value']}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#16a34a"
                                                strokeWidth={2}
                                                fillOpacity={1}
                                                fill="url(#colorValue)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-lg border border-dashed text-center p-4">
                                        <TrendingUp className="w-8 h-8 mb-2 opacity-50" />
                                        <p>Your chart will appear here once you add assets.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Holdings List */}
                        <Card className="border border-gray-100 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Holdings in {currentPortfolio?.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {portfolioItems.length > 0 ? portfolioItems.map((item, i) => {
                                        const liveData = marketData[item.ticker]
                                        const currentPrice = liveData?.price || item.avgPrice || 100
                                        const value = item.shares ? (item.shares * currentPrice) : (totalValue * item.allocation / 100)
                                        const gain = item.shares ? (value - (item.shares * (item.avgPrice || 0))) : 0
                                        const gainPct = item.shares && item.avgPrice ? (gain / (item.shares * item.avgPrice)) * 100 : 0

                                        return (
                                            <div key={item.ticker} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-white border flex items-center justify-center text-xs font-bold text-gray-700 shadow-sm">
                                                        {item.ticker}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900">{item.name}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {item.shares ? `${item.shares} Shares` : `${item.allocation}% Allocation`}
                                                            {liveData && <span className="ml-1 text-gray-600 font-medium">• Mkt: ${liveData.price.toFixed(2)}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-medium text-gray-900">
                                                        ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                    </div>
                                                    <div className={`text-xs flex items-center justify-end gap-1 ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {gain >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                                        {item.shares ? (liveData ? `${gainPct.toFixed(2)}%` : '---') : `+${(Math.random() * 5).toFixed(2)}%`}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }) : (
                                        <p className="text-center text-gray-500 py-4">No holdings yet. Search above to add!</p>
                                    )}
                                </div>
                                {portfolioItems.length > 0 && (
                                    <div className="mt-4 text-center">
                                        <Link href="/portfolio">
                                            <Button variant="outline" className="w-full">Edit Portfolio</Button>
                                        </Link>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar / Recommendations */}
                    <div className="space-y-6">
                        {/* Your Portfolios Card (Like Google Finance) */}
                        <Card className="border border-gray-100 shadow-sm bg-white">
                            <CardHeader className="pb-3 border-b border-gray-50">
                                <CardTitle className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                    <PieChartIcon className="w-4 h-4 text-gray-500" /> Your Portfolios
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-gray-50">
                                    {allPortfolios.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => selectPortfolio(p.id)}
                                            className={`flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors ${currentPortfolioId === p.id ? 'bg-green-50/50 border-l-4 border-green-500' : ''}`}
                                        >
                                            <div>
                                                <div className="font-medium text-gray-900 text-sm">{p.name}</div>
                                                <div className="text-xs text-gray-500">{p.items.length} items</div>
                                            </div>
                                            {currentPortfolioId === p.id && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 border-t border-gray-50">
                                    <Button onClick={handleCreatePortfolio} variant="outline" className="w-full text-green-600 hover:text-green-700 hover:bg-green-50 border-dashed border-green-200">
                                        + New Portfolio
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Quick Add Modal */}
                <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add {selectedAsset?.ticker} to {currentPortfolio?.name}</DialogTitle>
                            <DialogDescription>
                                Enter your holding details to track performance.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="shares">Shares Owned</Label>
                                    <Input
                                        id="shares"
                                        placeholder="e.g. 10"
                                        type="number"
                                        value={shares}
                                        onChange={(e) => setShares(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="price">Avg. Buy Price ($)</Label>
                                    <Input
                                        id="price"
                                        placeholder="e.g. 150.00"
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded text-xs text-gray-600">
                                Current Market Price estimated at: <strong>${(parseFloat(price) * 1.05 || 100).toFixed(2)}</strong>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleConfirmAdd} disabled={!shares} className="bg-green-600 hover:bg-green-700">Add Holding</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
    )
}
