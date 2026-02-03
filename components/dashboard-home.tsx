"use client"

import { useState, useEffect, useMemo } from "react"
import { usePortfolio } from "@/hooks/use-portfolio"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePaywall } from "@/hooks/use-paywall"
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight, Activity, ShieldCheck, Pencil, Hash, Wallet, BarChart3, Target, Zap, ExternalLink } from "lucide-react"
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { etfData } from "@/lib/etf-data"
import { stockDatabase, checkCompliance } from "@/lib/stock-data"

// Charts
import { FeeAnalyzer } from "@/components/charts/fee-analyzer"
import { GeographicBreakdown } from "@/components/charts/geographic-breakdown"
import { ComplianceBreakdown } from "@/components/charts/compliance-breakdown"
import { AssetAllocation } from "@/components/charts/asset-allocation"
import { PortfolioPerformanceChart } from "@/components/charts/portfolio-performance-chart"
import { PortfolioMetricsCards } from "@/components/charts/portfolio-metrics-cards"
import { GainLossBreakdown } from "@/components/charts/gain-loss-breakdown"

const COLORS = ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#059669', '#10b981', '#34d399']
const TYPE_COLORS: Record<string, string> = {
    'ETF': '#8b5cf6',
    'Stock': '#3b82f6',
    'Crypto': '#f97316',
    'Cash': '#22c55e'
}

export function DashboardHome() {
    const { getCurrentPortfolio, getAllPortfolios, getAggregatedPortfolio, createPortfolio, selectPortfolio, currentPortfolioId, addToPortfolio, updateHolding, portfolios } = usePortfolio()
    const { isPremium } = usePaywall()

    // Quick Add State
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedAsset, setSelectedAsset] = useState<any>(null)
    const [shares, setShares] = useState("")
    const [price, setPrice] = useState("")
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)

    // Rename Portfolio State
    const [isRenameOpen, setIsRenameOpen] = useState(false)
    const [newName, setNewName] = useState("")

    // Real-time Data
    const [marketData, setMarketData] = useState<Record<string, { price: number, change: number, changePercent: number, currency?: string, usdPrice?: number, usdChange?: number }>>({})
    const [fxRates, setFxRates] = useState<Record<string, number>>({})
    const [isLoadingData, setIsLoadingData] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    // Get current active portfolio
    const allPortfolios = getAllPortfolios()
    const isAllSelected = currentPortfolioId === 'all'
    const currentPortfolio = isAllSelected ? getAggregatedPortfolio() : getCurrentPortfolio()
    const portfolioItems = currentPortfolio?.items || []
    const nonCashItems = portfolioItems.filter(item => item.type !== 'Cash')

    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Fetch Prices Effect (stocks, ETFs, and crypto)
    useEffect(() => {
        const fetchPrices = async () => {
            if (portfolioItems.length === 0) return
            setIsLoadingData(true)

            const newData: Record<string, any> = {}

            // Fetch stock/ETF prices
            const stockItems = portfolioItems.filter(item => item.type === 'Stock' || item.type === 'ETF')
            await Promise.all(stockItems.map(async (item) => {
                try {
                    const queryTicker = item.ticker
                    const res = await fetch(`/api/quote?ticker=${queryTicker}`)
                    if (res.ok) {
                        const data = await res.json()
                        newData[item.ticker] = data
                    }
                } catch (e) {
                    console.error("Failed to fetch price for", item.ticker)
                }
            }))

            // Fetch crypto prices
            const cryptoItemsList = portfolioItems.filter(item => item.type === 'Crypto' && item.cryptoId)
            if (cryptoItemsList.length > 0) {
                try {
                    const cryptoIds = cryptoItemsList.map(item => item.cryptoId).join(",")
                    const res = await fetch(`/api/crypto-price?ids=${cryptoIds}`)
                    if (res.ok) {
                        const data = await res.json()
                        cryptoItemsList.forEach(item => {
                            if (item.cryptoId && data[item.cryptoId]) {
                                newData[item.ticker] = {
                                    price: data[item.cryptoId].price,
                                    usdPrice: data[item.cryptoId].price,
                                    change: data[item.cryptoId].change24h || 0,
                                    changePercent: data[item.cryptoId].change24h || 0,
                                    currency: 'USD'
                                }
                            }
                        })
                    }
                } catch (e) {
                    console.error("Failed to fetch crypto prices")
                }
            }

            setMarketData(prev => ({ ...prev, ...newData }))
            setIsLoadingData(false)
        }

        fetchPrices()
        // Re-fetch every 60 seconds
        const interval = setInterval(fetchPrices, 60000)
        return () => clearInterval(interval)
    }, [currentPortfolioId, JSON.stringify(portfolioItems.map(i => i.ticker + i.shares))])

    const cashCurrencies = useMemo(() => {
        const set = new Set<string>()
        portfolioItems.forEach(item => {
            if (item.type === 'Cash' && item.currency) {
                set.add(item.currency.toUpperCase())
            }
        })
        return Array.from(set)
    }, [portfolioItems])

    useEffect(() => {
        const fetchFxRates = async () => {
            const toFetch = cashCurrencies.filter(c => c !== 'USD' && !fxRates[c])
            if (toFetch.length === 0) return
            const updates: Record<string, number> = {}
            await Promise.all(toFetch.map(async (currency) => {
                try {
                    const res = await fetch(`/api/fx?from=${currency}&to=USD`)
                    if (res.ok) {
                        const data = await res.json()
                        if (typeof data.rate === 'number') {
                            updates[currency] = data.rate
                        }
                    }
                } catch (e) { }
            }))
            if (Object.keys(updates).length > 0) {
                setFxRates(prev => ({ ...prev, ...updates }))
            }
        }
        fetchFxRates()
    }, [cashCurrencies, fxRates])

    const getFxRateForCurrency = (currency?: string) => {
        const code = (currency || 'USD').toUpperCase()
        if (code === 'USD') return 1
        return fxRates[code]
    }

    const getItemUsdPrice = (item: any) => {
        if (item.type === 'Cash') {
            const rate = getFxRateForCurrency(item.currency)
            return typeof rate === 'number' ? rate : 1
        }
        const data = marketData[item.ticker]
        if (typeof data?.usdPrice === 'number') return data.usdPrice
        return data?.price || item.avgPrice || 0
    }

    const getItemUsdValue = (item: any) => {
        if (item.type === 'Cash') {
            const rate = getFxRateForCurrency(item.currency)
            const amount = item.amount || 0
            return typeof rate === 'number' ? amount * rate : amount
        }
        const price = getItemUsdPrice(item)
        return (item.shares || 0) * price
    }

    // Handle Rename Portfolio
    const openRenameDialog = () => {
        if (currentPortfolio && !isAllSelected) {
            setNewName(currentPortfolio.name)
            setIsRenameOpen(true)
        }
    }

    const handleRenamePortfolio = async () => {
        if (!newName.trim() || !currentPortfolio || isAllSelected) return

        const { portfolios } = usePortfolio.getState()
        const updated = { ...portfolios[currentPortfolioId], name: newName.trim() }
        usePortfolio.setState({
            portfolios: { ...portfolios, [currentPortfolioId]: updated }
        })

        const { userId } = usePortfolio.getState()
        if (userId) {
            const { createClient } = await import("@/utils/supabase/client")
            const supabase = createClient()
            await supabase.from('portfolios').update({ name: newName.trim() }).eq('id', currentPortfolioId)
        }

        setIsRenameOpen(false)
    }

    // CALCULATE REAL VALUES - with detailed item data
    const hasPortfolio = portfolioItems.length > 0

    const calculatedItems = useMemo(() => {
        return portfolioItems.map(item => {
            const liveData = marketData[item.ticker]
            const currentPrice = getItemUsdPrice(item)
            const currentValue = getItemUsdValue(item)
            const costBasis = item.type === 'Cash'
                ? currentValue
                : (item.shares || 0) * (item.avgPrice || 0)
            const gain = currentValue - costBasis
            const gainPercent = costBasis > 0 ? (gain / costBasis) * 100 : 0
            const dayChange = item.type === 'Cash' ? 0 : (item.shares || 0) * (liveData?.usdChange ?? liveData?.change ?? 0)
            const dayChangePercent = liveData?.changePercent || 0

            return {
                ...item,
                currentPrice,
                currentValue,
                costBasis,
                gain,
                gainPercent,
                dayChange,
                dayChangePercent
            }
        }).sort((a, b) => b.currentValue - a.currentValue)
    }, [portfolioItems, marketData, fxRates])

    const totalValue = calculatedItems.reduce((sum, item) => sum + item.currentValue, 0)
    const totalCost = calculatedItems.reduce((sum, item) => sum + item.costBasis, 0)
    const totalGain = totalValue - totalCost
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0
    const dayChangeValue = calculatedItems.reduce((sum, item) => sum + item.dayChange, 0)
    const dayChangePercent = totalValue > 0 ? (dayChangeValue / totalValue) * 100 : 0

    // Portfolio Stats
    const portfolioStats = useMemo(() => {
        if (!hasPortfolio || totalValue === 0) return null

        let compliantValue = 0
        let weightedExpense = 0
        const typeBreakdown: Record<string, number> = {}
        const sectorMap = new Map<string, number>()

        calculatedItems.forEach(item => {
            const weight = item.currentValue / totalValue

            // Type breakdown
            typeBreakdown[item.type] = (typeBreakdown[item.type] || 0) + item.currentValue

            if (item.type === 'Cash') {
                sectorMap.set('Cash', (sectorMap.get('Cash') || 0) + weight)
                compliantValue += item.currentValue
                return
            }

            if (item.type === 'Crypto') {
                sectorMap.set('Crypto', (sectorMap.get('Crypto') || 0) + weight)
                compliantValue += item.currentValue
                return
            }

            const isCompliant = checkCompliance(item.ticker, item.type)
            if (isCompliant) compliantValue += item.currentValue

            if (item.expenseRatio) weightedExpense += item.expenseRatio * weight

            const etf = etfData.find(e => e.ticker === item.ticker)
            if (etf?.sectorAllocation) {
                etf.sectorAllocation.forEach(s => {
                    const sectorWeight = s.weight / 100 * weight
                    sectorMap.set(s.sector, (sectorMap.get(s.sector) || 0) + sectorWeight)
                })
            } else {
                const stock = stockDatabase[item.ticker]
                const sector = stock?.sector || "Other"
                sectorMap.set(sector, (sectorMap.get(sector) || 0) + weight)
            }
        })

        const sectors = Array.from(sectorMap.entries())
            .map(([sector, rawWeight]) => ({ sector, weight: rawWeight * 100 }))
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 6)

        // Top holdings by value
        const holdings = calculatedItems
            .slice(0, 5)
            .map(item => ({
                ticker: item.ticker,
                name: item.name,
                type: item.type,
                value: item.currentValue,
                weight: (item.currentValue / totalValue) * 100,
                gain: item.gain,
                gainPercent: item.gainPercent,
                dayChange: item.dayChange,
                dayChangePercent: item.dayChangePercent
            }))

        // Best and worst performers today
        const performersToday = [...calculatedItems]
            .filter(i => i.type !== 'Cash')
            .sort((a, b) => b.dayChangePercent - a.dayChangePercent)

        const bestToday = performersToday.slice(0, 3)
        const worstToday = performersToday.slice(-3).reverse()

        // Type breakdown for pie chart
        const typeData = Object.entries(typeBreakdown).map(([type, value]) => ({
            name: type,
            value,
            color: TYPE_COLORS[type] || '#94a3b8'
        }))

        return {
            expenseRatio: weightedExpense,
            compliancePercent: (compliantValue / totalValue) * 100,
            sectors,
            holdings,
            typeData,
            bestToday,
            worstToday,
            totalHoldings: portfolioItems.length,
            stockCount: portfolioItems.filter(i => i.type === 'Stock').length,
            etfCount: portfolioItems.filter(i => i.type === 'ETF').length,
            cryptoCount: portfolioItems.filter(i => i.type === 'Crypto').length,
            cashCount: portfolioItems.filter(i => i.type === 'Cash').length,
            avgPositionSize: totalValue / portfolioItems.length,
            largestPosition: calculatedItems[0]?.currentValue || 0,
            largestPositionTicker: calculatedItems[0]?.ticker || ''
        }
    }, [calculatedItems, totalValue, hasPortfolio])


    return (
        !isMounted ? null :
            <div className="space-y-6 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-muted-foreground">Welcome back to your financial overview.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="bg-white p-1 rounded-lg border shadow-sm flex items-center">
                            <Select value={currentPortfolioId} onValueChange={(val) => selectPortfolio(val)}>
                                <SelectTrigger className="w-full sm:w-[180px] border-none shadow-none focus:ring-0">
                                    <SelectValue placeholder="Select Portfolio" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Portfolios</SelectItem>
                                    <div className="h-px bg-gray-100 my-1" />
                                    {Object.values(allPortfolios)
                                        .filter(p => p.id !== 'all' && p.id !== 'default')
                                        .map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            {!isAllSelected && currentPortfolio && currentPortfolio.id !== 'default' && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600" onClick={openRenameDialog}>
                                    <Pencil className="w-3.5 h-3.5" />
                                </Button>
                            )}
                        </div>

                        <Badge variant="outline" className={`gap-1 ${isLoadingData ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isLoadingData ? 'bg-yellow-500 animate-pulse' : 'bg-green-500 animate-pulse'}`} />
                            {isLoadingData ? 'Updating...' : 'Live'}
                        </Badge>
                    </div>
                </div>

                {/* Main Value Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Portfolio Value */}
                    <Card className="border-0 shadow-md bg-gradient-to-br from-green-600 to-green-700 text-white md:col-span-2">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium opacity-90 flex items-center justify-between">
                                {currentPortfolio?.name || 'Portfolio'} Value
                                <DollarSign className="w-4 h-4 opacity-75" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl sm:text-4xl font-bold">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm opacity-90">
                                <div className="flex items-center gap-1">
                                    {totalGain >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                    <span className="font-semibold">{totalGain >= 0 ? "+" : ""}{totalGainPercent.toFixed(2)}%</span>
                                    <span className="opacity-75">(${Math.abs(totalGain).toLocaleString(undefined, { maximumFractionDigits: 0 })})</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs opacity-75">
                                    Today: <span className={dayChangeValue >= 0 ? '' : 'text-red-200'}>{dayChangeValue >= 0 ? "+" : ""}{dayChangeValue.toFixed(2)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Key Metrics */}
                    <Card className="border shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between">
                                Key Metrics
                                <Activity className="w-4 h-4 text-gray-400" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {portfolioStats ? (
                                <>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500">Shariah</span>
                                        <span className={`font-bold text-sm ${portfolioStats.compliancePercent >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                                            {portfolioStats.compliancePercent.toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500">Holdings</span>
                                        <span className="font-bold text-sm">{portfolioStats.totalHoldings}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500">Avg. Size</span>
                                        <span className="font-bold text-sm">${portfolioStats.avgPositionSize.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-gray-400 text-center py-2">Add assets</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Cost Basis */}
                    <Card className="border shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between">
                                Cost Basis
                                <Wallet className="w-4 h-4 text-gray-400" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                            <div className={`text-sm mt-1 ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {totalGain >= 0 ? '+' : ''}{totalGainPercent.toFixed(2)}% return
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Holdings Badge Bar */}
                {portfolioStats && (
                    <div className="flex flex-wrap gap-2">
                        {portfolioStats.etfCount > 0 && <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200"><Hash className="w-3 h-3 mr-1" />{portfolioStats.etfCount} ETF{portfolioStats.etfCount > 1 ? 's' : ''}</Badge>}
                        {portfolioStats.stockCount > 0 && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Hash className="w-3 h-3 mr-1" />{portfolioStats.stockCount} Stock{portfolioStats.stockCount > 1 ? 's' : ''}</Badge>}
                        {portfolioStats.cryptoCount > 0 && <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200"><Hash className="w-3 h-3 mr-1" />{portfolioStats.cryptoCount} Crypto</Badge>}
                        {portfolioStats.cashCount > 0 && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><DollarSign className="w-3 h-3 mr-1" />{portfolioStats.cashCount} Cash</Badge>}
                        <Badge variant="outline" className={portfolioStats.compliancePercent >= 80 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}>
                            <ShieldCheck className="w-3 h-3 mr-1" />{portfolioStats.compliancePercent.toFixed(0)}% Halal
                        </Badge>
                    </div>
                )}

                {/* Charts Row */}
                {portfolioStats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Asset Type Pie */}
                        <Card className="border shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <PieChartIcon className="w-4 h-4 text-gray-500" /> By Type
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[180px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={portfolioStats.typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                                            {portfolioStats.typeData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex flex-wrap justify-center gap-2 mt-2">
                                    {portfolioStats.typeData.map((t) => (
                                        <div key={t.name} className="flex items-center gap-1 text-xs">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                                            <span>{t.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Today's Movers */}
                        <Card className="border shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-green-500" /> Today&apos;s Best
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {portfolioStats.bestToday.slice(0, 3).map((item) => (
                                        <Link key={item.ticker} href={item.type === 'Stock' || item.type === 'ETF' ? `/screener?q=${item.ticker}` : '/portfolio'} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                                </div>
                                                <span className="font-medium text-sm">{item.ticker}</span>
                                            </div>
                                            <span className="text-green-600 font-semibold text-sm">+{item.dayChangePercent.toFixed(2)}%</span>
                                        </Link>
                                    ))}
                                    {portfolioStats.bestToday.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No data yet</p>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Worst Today */}
                        <Card className="border shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <TrendingDown className="w-4 h-4 text-red-500" /> Today&apos;s Laggards
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {portfolioStats.worstToday.slice(0, 3).map((item) => (
                                        <Link key={item.ticker} href={item.type === 'Stock' || item.type === 'ETF' ? `/screener?q=${item.ticker}` : '/portfolio'} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                                                    <TrendingDown className="w-4 h-4 text-red-600" />
                                                </div>
                                                <span className="font-medium text-sm">{item.ticker}</span>
                                            </div>
                                            <span className="text-red-600 font-semibold text-sm">{item.dayChangePercent.toFixed(2)}%</span>
                                        </Link>
                                    ))}
                                    {portfolioStats.worstToday.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No data yet</p>}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Top Holdings & Sectors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Top Holdings - Clickable */}
                    <Card className="border shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-gray-500" /> Top Holdings
                            </CardTitle>
                            <Link href="/portfolio">
                                <Button variant="ghost" size="sm" className="text-xs">View All <ExternalLink className="w-3 h-3 ml-1" /></Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {portfolioStats ? (
                                <div className="space-y-3">
                                    {portfolioStats.holdings.map((h, i) => (
                                        <Link
                                            key={h.ticker}
                                            href={h.type === 'Cash' ? '/portfolio' : (h.type === 'Crypto' ? '/portfolio' : `/screener?q=${h.ticker}`)}
                                            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center text-xs font-bold shadow-sm" style={{ borderColor: TYPE_COLORS[h.type] || '#e5e7eb' }}>
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-gray-900">{h.ticker}</span>
                                                        <Badge variant="outline" className="text-[10px] px-1 py-0" style={{ borderColor: TYPE_COLORS[h.type], color: TYPE_COLORS[h.type] }}>{h.type}</Badge>
                                                    </div>
                                                    <p className="text-xs text-gray-500 truncate max-w-[150px]">{h.name}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900">${h.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                                <p className={`text-xs font-medium ${h.gainPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {h.gainPercent >= 0 ? '+' : ''}{h.gainPercent.toFixed(1)}%
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-400 py-8">No holdings yet</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Sectors */}
                    <Card className="border shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Target className="w-5 h-5 text-gray-500" /> Sector Exposure
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {portfolioStats ? (
                                <div className="space-y-3">
                                    {portfolioStats.sectors.map((s, i) => (
                                        <div key={s.sector}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-medium text-gray-700">{s.sector}</span>
                                                <span className="text-gray-500">{s.weight.toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(s.weight, 100)}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-400 py-8">No data</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Analytics Section */}
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5" /> Detailed Analytics
                    </h2>
                    {nonCashItems.length === 0 ? (
                        <div className="bg-muted/30 border border-dashed rounded-lg p-12 text-center text-muted-foreground">
                            <PieChartIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-medium">No Data for Analytics</h3>
                            <p>Add ETFs or stocks to see detailed breakdowns.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Performance Tracking Section */}
                            <PortfolioPerformanceChart
                                currentValue={totalValue}
                                currentCost={totalCost}
                                items={portfolioItems}
                            />

                            <PortfolioMetricsCards
                                totalReturn={totalGain}
                                totalReturnPercent={totalGainPercent}
                                items={portfolioItems}
                                marketData={marketData}
                            />

                            <GainLossBreakdown
                                items={portfolioItems}
                                marketData={marketData}
                            />

                            {/* Existing Analytics */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <AssetAllocation items={nonCashItems} />
                                <ComplianceBreakdown items={nonCashItems} />
                                <GeographicBreakdown items={nonCashItems} />
                                <FeeAnalyzer items={nonCashItems} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Rename Modal */}
                <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Rename Portfolio</DialogTitle>
                            <DialogDescription>Enter a new name for your portfolio.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Label htmlFor="portfolioName">Portfolio Name</Label>
                            <Input id="portfolioName" placeholder="e.g. TFSA, RRSP" value={newName} onChange={(e) => setNewName(e.target.value)} className="mt-2" />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsRenameOpen(false)}>Cancel</Button>
                            <Button onClick={handleRenamePortfolio} disabled={!newName.trim()}>Save</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
    )
}
