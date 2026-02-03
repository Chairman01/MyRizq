"use client"

import { useState, useEffect, useMemo } from "react"
import { usePortfolio } from "@/hooks/use-portfolio"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePaywall } from "@/hooks/use-paywall"
import { TrendingUp, DollarSign, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight, Activity, Search, PlusCircle, X, ShieldCheck, Pencil, Hash, Percent, Wallet } from "lucide-react"
// Chart imports removed - using summary instead of fake historical data
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
    const cryptoItems = portfolioItems.filter(item => item.type === 'Crypto')

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
                    const queryTicker = item.ticker === 'WSHR' ? 'WSHR.NE' : item.ticker
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

        // Fetch initially
        fetchPrices()
    }, [currentPortfolioId, portfolioItems.length])

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
        return data?.price || item.avgPrice || 100
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

    // Handle Creating New Portfolio
    const handleCreatePortfolio = () => {
        const name = prompt("Enter Portfolio Name (e.g. TFSA, RRSP, Crypto):")
        if (name) createPortfolio(name)
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
        
        // Update in Zustand store
        const { portfolios } = usePortfolio.getState()
        const updated = { ...portfolios[currentPortfolioId], name: newName.trim() }
        usePortfolio.setState({
            portfolios: { ...portfolios, [currentPortfolioId]: updated }
        })
        
        // Update in database if user is logged in
        const { userId } = usePortfolio.getState()
        if (userId) {
            const { createClient } = await import("@/utils/supabase/client")
            const supabase = createClient()
            await supabase.from('portfolios').update({ name: newName.trim() }).eq('id', currentPortfolioId)
        }
        
        setIsRenameOpen(false)
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
        if (item.type === 'Cash') {
            const cashValue = getItemUsdValue(item)
            totalValue += cashValue
            totalCost += cashValue
            return
        }

        const liveData = marketData[item.ticker]
        const livePrice = getItemUsdPrice(item)
        const liveChange = liveData?.usdChange ?? liveData?.change ?? 0

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
            const changePct = liveData?.changePercent || 0
            dayChangeValue += simulatedValue * (changePct / 100)
        }
    })

    if (totalValue === 0 && hasPortfolio) totalValue = 10000

    const totalGain = totalValue - totalCost
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0
    const dayChangePercent = totalValue > 0 ? (dayChangeValue / totalValue) * 100 : 0

    // Derived Stats
    const portfolioStats = useMemo(() => {
        if (!hasPortfolio) return null

        let totalVal = 0
        const itemsWithValue = portfolioItems.map(item => {
            if (item.type === 'Cash') {
                const val = getItemUsdValue(item)
                totalVal += val
                return { ...item, currentValue: val }
            }
            const price = getItemUsdPrice(item)
            const val = (item.shares || 0) > 0 ? (item.shares! * price) : (10000 * (item.allocation || 0) / 100)
            totalVal += val
            return { ...item, currentValue: val }
        })

        if (totalVal === 0) return null

        let weightedExpense = 0
        let weightedYTD = 0
        let compliantValue = 0
        let nonCompliantValue = 0
        const sectorMap = new Map<string, number>()

        itemsWithValue.forEach(item => {
            const weight = item.currentValue / totalVal

            if (item.type === 'Cash') {
                sectorMap.set('Cash', (sectorMap.get('Cash') || 0) + weight)
                compliantValue += item.currentValue // Cash is always compliant
                return
            }

            if (item.type === 'Crypto') {
                sectorMap.set('Crypto', (sectorMap.get('Crypto') || 0) + weight)
                compliantValue += item.currentValue // Crypto treated as compliant for simplicity
                return
            }

            // Check Shariah compliance
            const isCompliant = checkCompliance(item.ticker, item.type)
            if (isCompliant) {
                compliantValue += item.currentValue
            } else {
                nonCompliantValue += item.currentValue
            }

            if (item.expenseRatio) weightedExpense += item.expenseRatio * weight

            const etf = etfData.find(e => e.ticker === item.ticker)
            if (etf && etf.performance.ytd) weightedYTD += etf.performance.ytd * weight

            if (etf?.sectorAllocation) {
                etf.sectorAllocation.forEach(s => {
                    const sectorWeight = s.weight / 100 * weight
                    sectorMap.set(s.sector, (sectorMap.get(s.sector) || 0) + sectorWeight)
                })
            } else {
                // Check if it's a stock with known sector
                const stock = stockDatabase[item.ticker]
                if (stock && stock.sector) {
                    sectorMap.set(stock.sector, (sectorMap.get(stock.sector) || 0) + weight)
                } else {
                    const sector = "Other"
                    sectorMap.set(sector, (sectorMap.get(sector) || 0) + weight)
                }
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

        // Calculate compliance percentage
        const compliancePercent = totalVal > 0 ? (compliantValue / totalVal) * 100 : 0

        return {
            expenseRatio: weightedExpense,
            ytd: weightedYTD,
            sectors,
            holdings,
            compliancePercent,
            totalHoldings: portfolioItems.length,
            stockCount: portfolioItems.filter(i => i.type === 'Stock').length,
            etfCount: portfolioItems.filter(i => i.type === 'ETF').length,
            cryptoCount: portfolioItems.filter(i => i.type === 'Crypto').length,
            cashCount: portfolioItems.filter(i => i.type === 'Cash').length
        }
    }, [portfolioItems, marketData, hasPortfolio, fxRates])


    return (
        !isMounted ? null :
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Header with Search */}
                {/* Header with Selector */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-muted-foreground">Welcome back to your financial overview.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                        {/* Portfolio Selector */}
                        <div className="bg-white p-1 rounded-lg border shadow-sm flex items-center">
                            <Select
                                value={currentPortfolioId}
                                onValueChange={(val) => selectPortfolio(val)}
                            >
                            <SelectTrigger className="w-full sm:w-[200px] border-none shadow-none focus:ring-0">
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
                                    {Object.values(allPortfolios).filter(p => p.id !== 'all').length === 0 && (
                                        <SelectItem value="default">Default Portfolio</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            {!isAllSelected && currentPortfolio && currentPortfolio.id !== 'default' && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-400 hover:text-gray-600"
                                    onClick={openRenameDialog}
                                    title="Rename Portfolio"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </Button>
                            )}
                        </div>

                        <Badge variant="outline" className={`bg-opacity-50 border gap-1 transition-colors ${isLoadingData ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isLoadingData ? 'bg-yellow-500 animate-bounce' : 'bg-green-500 animate-pulse'}`} />
                            {isLoadingData ? 'Updating Prices...' : 'Market Live'}
                        </Badge>
                    </div>
                </div>

                {/* Top Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
                    {/* Value Card - Spans 2 cols */}
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-green-600 to-green-700 text-white col-span-1 md:col-span-2">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium opacity-90 flex items-center justify-between">
                                {currentPortfolio?.name || 'Total Portfolio'} Value
                                <DollarSign className="w-4 h-4 opacity-75" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl sm:text-3xl font-bold">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
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
                        <CardContent className="space-y-2">
                            {portfolioStats ? (
                                <>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 text-xs uppercase tracking-wide">Shariah Compliant</span>
                                        <span className={`font-bold ${portfolioStats.compliancePercent >= 80 ? 'text-green-600' : portfolioStats.compliancePercent >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                                            {portfolioStats.compliancePercent.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 text-xs uppercase tracking-wide">Holdings</span>
                                        <span className="font-bold text-gray-900">{portfolioStats.totalHoldings}</span>
                                    </div>
                                    {portfolioStats.expenseRatio > 0 && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500 text-xs uppercase tracking-wide">Avg. Expense</span>
                                            <span className="font-bold text-gray-900">{portfolioStats.expenseRatio.toFixed(2)}%</span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-sm text-gray-400 text-center py-2">Add assets for metrics</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Cost Basis & Gain */}
                    <Card className="border-0 shadow-sm bg-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between">
                                Cost Basis
                                <Wallet className="w-4 h-4 text-gray-400" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl sm:text-3xl font-bold text-gray-900">${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                            <div className="text-sm text-gray-500 mt-1">Invested Capital</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Holdings Summary Bar */}
                {portfolioStats && portfolioStats.totalHoldings > 0 && (
                    <div className="flex flex-wrap gap-3">
                        {portfolioStats.stockCount > 0 && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                <Hash className="w-3 h-3 mr-1" /> {portfolioStats.stockCount} Stock{portfolioStats.stockCount > 1 ? 's' : ''}
                            </Badge>
                        )}
                        {portfolioStats.etfCount > 0 && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                <Hash className="w-3 h-3 mr-1" /> {portfolioStats.etfCount} ETF{portfolioStats.etfCount > 1 ? 's' : ''}
                            </Badge>
                        )}
                        {portfolioStats.cryptoCount > 0 && (
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                <Hash className="w-3 h-3 mr-1" /> {portfolioStats.cryptoCount} Crypto
                            </Badge>
                        )}
                        {portfolioStats.cashCount > 0 && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <DollarSign className="w-3 h-3 mr-1" /> {portfolioStats.cashCount} Cash
                            </Badge>
                        )}
                        <Badge variant="outline" className={`${portfolioStats.compliancePercent >= 80 ? 'bg-green-50 text-green-700 border-green-200' : portfolioStats.compliancePercent >= 50 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                            <ShieldCheck className="w-3 h-3 mr-1" /> {portfolioStats.compliancePercent.toFixed(0)}% Halal
                        </Badge>
                    </div>
                )}

                {/* Middle Section: Top Sectors & Holdings (Larger) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Portfolio Summary Section */}
                    <div className="space-y-6">
                        <Card className="border border-gray-100 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg">Portfolio Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                {hasPortfolio ? (
                                    <div className="h-full flex flex-col justify-center space-y-6">
                                        <div className="text-center">
                                            <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">Total Value</p>
                                            <p className="text-4xl font-bold text-gray-900">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gray-50 rounded-lg p-4 text-center">
                                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Cost Basis</p>
                                                <p className="text-xl font-bold text-gray-700">${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                            </div>
                                            <div className={`rounded-lg p-4 text-center ${totalGain >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Gain/Loss</p>
                                                <p className={`text-xl font-bold ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {totalGain >= 0 ? '+' : ''}{totalGainPercent.toFixed(2)}%
                                                </p>
                                                <p className={`text-sm ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {totalGain >= 0 ? '+' : ''}${Math.abs(totalGain).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </div>
                                        {dayChangeValue !== 0 && (
                                            <div className="text-center text-sm text-gray-500">
                                                Today: <span className={dayChangeValue >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                    {dayChangeValue >= 0 ? '+' : ''}{dayChangeValue.toFixed(2)} ({dayChangePercent.toFixed(2)}%)
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-lg border border-dashed text-center p-4">
                                        <TrendingUp className="w-8 h-8 mb-2 opacity-50" />
                                        <p>Your summary will appear here once you add assets.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Holdings List */}
                    <div className="space-y-6">
                        <Card className="border border-gray-100 shadow-sm h-full">
                            <CardHeader>
                                <CardTitle className="text-lg">Top Holdings</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {portfolioItems.slice(0, 5).map((item, i) => {
                                        if (item.type === 'Cash') {
                                            const value = getItemUsdValue(item)
                                            return (
                                                <div key={item.ticker} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-white border flex items-center justify-center text-xs font-bold text-gray-700 shadow-sm">
                                                            $
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900">Cash</div>
                                                            <div className="text-xs text-gray-500">
                                                                {(item.amount || 0).toLocaleString()} {item.currency || 'USD'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-medium text-gray-900">
                                                            ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                        </div>
                                                        <div className="text-xs text-gray-500">USD</div>
                                                    </div>
                                                </div>
                                            )
                                        }

                                        const liveData = marketData[item.ticker]
                                        const currentPrice = getItemUsdPrice(item)
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
                                    })}
                                    {portfolioItems.length === 0 && (
                                        <p className="text-center text-gray-500 py-4">No holdings yet.</p>
                                    )}
                                </div>
                                <div className="mt-6 text-center">
                                    <Link href="/portfolio">
                                        <Button variant="outline" className="w-full">View Full Portfolio</Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Analytics Section - New */}
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5" /> Analytics Overview
                    </h2>
                    {nonCashItems.length === 0 ? (
                        <div className="bg-muted/30 border border-dashed rounded-lg p-12 text-center text-muted-foreground">
                            <PieChartIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-medium">No Data for Analytics</h3>
                            <p>Add assets to see your portfolio breakdown and compliance status.</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-6">
                            <AssetAllocation items={nonCashItems} />
                            <ComplianceBreakdown items={nonCashItems} />
                            <GeographicBreakdown items={nonCashItems} />
                            <FeeAnalyzer items={nonCashItems} />
                        </div>
                    )}
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
                                    <Label htmlFor="price">Avg. Buy Price (USD)</Label>
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

                {/* Rename Portfolio Modal */}
                <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Rename Portfolio</DialogTitle>
                            <DialogDescription>
                                Enter a new name for your portfolio.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Label htmlFor="portfolioName">Portfolio Name</Label>
                            <Input
                                id="portfolioName"
                                placeholder="e.g. TFSA, RRSP, Personal"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="mt-2"
                            />
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
