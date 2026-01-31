"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { etfData } from "@/lib/etf-data"
import { checkCompliance } from "@/lib/stock-data"
import { usePortfolio } from "@/hooks/use-portfolio"
import { Plus, Trash2, PieChart, Building2, ShieldCheck, TrendingUp, AlertTriangle, DollarSign } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"

// New Imports for Advanced Features
import { FeeAnalyzer } from "@/components/charts/fee-analyzer"
import { GeographicBreakdown } from "@/components/charts/geographic-breakdown"
import { ComplianceBreakdown } from "@/components/charts/compliance-breakdown"
import { AssetAllocation } from "@/components/charts/asset-allocation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

const COMMON_CURRENCIES = [
    "USD", "CAD", "EUR", "GBP", "AUD", "NZD", "JPY", "CNY", "INR", "PKR",
    "SGD", "AED", "SAR", "MYR", "IDR", "TRY", "CHF", "SEK", "NOK", "DKK",
    "HKD", "KRW", "MXN", "BRL", "ZAR"
]

export default function PortfolioPage() {
    const {
        portfolios,
        currentPortfolioId,
        selectPortfolio,
        createPortfolio,
        deletePortfolio,
        getAggregatedPortfolio,
        updateHolding,
        updateCash,
        removeFromPortfolio,
        addToPortfolio,
        addCash,
        setUserId,
        userId
    } = usePortfolio()

    const [searchQuery, setSearchQuery] = useState("")
    const [isMounted, setIsMounted] = useState(false)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newPortfolioName, setNewPortfolioName] = useState("")
    const [apiSuggestions, setApiSuggestions] = useState<{ symbol: string, name: string, type: string }[]>([])
    const [isSearching, setIsSearching] = useState(false)

    // Add to Portfolio Dialog State
    const [isAddToOpen, setIsAddToOpen] = useState(false)
    const [pendingAsset, setPendingAsset] = useState<{ ticker: string, name: string, type: 'Stock' | 'ETF', extras?: any } | null>(null)
    const [targetPortfolioId, setTargetPortfolioId] = useState<string>("")
    const [isCashOpen, setIsCashOpen] = useState(false)
    const [cashAmount, setCashAmount] = useState("")
    const [cashCurrency, setCashCurrency] = useState("USD")
    const [cashCurrencyCustom, setCashCurrencyCustom] = useState("")
    const [cashTargetPortfolioId, setCashTargetPortfolioId] = useState<string>("")

    const supabase = createClient()

    // Real-time Data State
    const [marketData, setMarketData] = useState<Record<string, { price: number, change: number, changePercent: number, currency?: string, usdPrice?: number, usdChange?: number }>>({})
    const [fxRates, setFxRates] = useState<Record<string, number>>({})

    useEffect(() => {
        setIsMounted(true)
        const syncUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUserId(user?.id || null)
        }
        syncUser()
    }, [])

    // Determine Active View
    const isAllSelected = currentPortfolioId === 'all'
    const activePortfolio = isAllSelected ? getAggregatedPortfolio() : (portfolios[currentPortfolioId] || portfolios['default'])
    const portfolioItems = activePortfolio?.items || []
    const nonCashItems = portfolioItems.filter(item => item.type !== 'Cash')

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'mktValue', direction: 'desc' })

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

    const getItemUsdCost = (item: any) => {
        if (item.type === 'Cash') {
            return getItemUsdValue(item)
        }
        return (item.shares || 0) * (item.avgPrice || 0)
    }

    const sortedItems = useMemo(() => {
        let items = [...portfolioItems]
        if (!sortConfig.key) return items

        return items.sort((a, b) => {
            // Get necessary data for sorting
            const aPrice = getItemUsdPrice(a)
            const bPrice = getItemUsdPrice(b)

            // Computed values
            const aValue = getItemUsdValue(a)
            const bValue = getItemUsdValue(b)
            const aCost = getItemUsdCost(a)
            const bCost = getItemUsdCost(b)
            const aGain = aValue - aCost
            const bGain = bValue - bCost
            const aCompliant = checkCompliance(a.ticker, a.type)
            const bCompliant = checkCompliance(b.ticker, b.type)

            let aSortVal: any = ''
            let bSortVal: any = ''

            switch (sortConfig.key) {
                case 'ticker':
                    aSortVal = a.ticker
                    bSortVal = b.ticker
                    break
                case 'portfolio':
                    // Just sort by ticker if all selected for now, complex to map back to portfolio name efficiently in sort
                    aSortVal = a.ticker
                    bSortVal = b.ticker
                    break
                case 'compliance':
                    // Sort by boolean (true first or last)
                    aSortVal = aCompliant ? 1 : 0
                    bSortVal = bCompliant ? 1 : 0
                    break
                case 'shares':
                    aSortVal = a.shares || 0
                    bSortVal = b.shares || 0
                    break
                case 'avgPrice':
                    aSortVal = a.avgPrice || 0
                    bSortVal = b.avgPrice || 0
                    break
                case 'mktPrice':
                    aSortVal = aPrice
                    bSortVal = bPrice
                    break
                case 'costBasis':
                    aSortVal = aCost
                    bSortVal = bCost
                    break
                case 'mktValue':
                    aSortVal = aValue
                    bSortVal = bValue
                    break
                case 'gain':
                    aSortVal = aGain
                    bSortVal = bGain
                    break
                default:
                    return 0
            }

            if (aSortVal < bSortVal) return sortConfig.direction === 'asc' ? -1 : 1
            if (aSortVal > bSortVal) return sortConfig.direction === 'asc' ? 1 : -1
            return 0
        })
    }, [portfolioItems, marketData, sortConfig, fxRates])

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'desc' // Default to desc for financial data
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc'
        }
        setSortConfig({ key, direction })
    }

    // Fetch live prices
    useEffect(() => {
        const fetchPrices = async () => {
            if (portfolioItems.length === 0) return
            const newData: Record<string, any> = {}
            await Promise.all(portfolioItems.map(async (item) => {
                try {
                    const queryTicker = item.ticker === 'WSHR' ? 'WSHR.NE' : item.ticker
                    const res = await fetch(`/api/quote?ticker=${queryTicker}`)
                    if (res.ok) {
                        const data = await res.json()
                        newData[item.ticker] = data
                    }
                } catch (e) { }
            }))
            setMarketData(prev => ({ ...prev, ...newData }))
        }
        fetchPrices()
    }, [portfolioItems.length])

    useEffect(() => {
        const searchApi = async () => {
            if (searchQuery.trim().length < 2) {
                setApiSuggestions([])
                return
            }
            setIsSearching(true)
            try {
                const res = await fetch(`/api/search-stocks?q=${encodeURIComponent(searchQuery.trim())}`)
                if (res.ok) {
                    const data = await res.json()
                    setApiSuggestions(data.results || [])
                } else {
                    setApiSuggestions([])
                }
            } catch (e) {
                setApiSuggestions([])
            } finally {
                setIsSearching(false)
            }
        }
        const timeoutId = setTimeout(searchApi, 300)
        return () => clearTimeout(timeoutId)
    }, [searchQuery])

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

    // Available Assets - Split logic
    const { stocks, etfs } = useMemo(() => {
        const inPortfolio = new Set(portfolioItems.map(p => p.ticker))

        const stockList = [
            { ticker: "MSFT", name: "Microsoft Corporation", type: "Stock" },
            { ticker: "AAPL", name: "Apple Inc", type: "Stock" },
            { ticker: "TSLA", name: "Tesla Inc", type: "Stock" },
            { ticker: "NVDA", name: "NVIDIA Corporation", type: "Stock" },
            { ticker: "GOOGL", name: "Alphabet Inc", type: "Stock" },
            { ticker: "AMZN", name: "Amazon.com Inc", type: "Stock" },
            { ticker: "META", name: "Meta Platforms Inc", type: "Stock" },
            { ticker: "JNJ", name: "Johnson & Johnson", type: "Stock" },
            { ticker: "PG", name: "Procter & Gamble", type: "Stock" },
            { ticker: "XOM", name: "Exxon Mobil Corp", type: "Stock" },
            { ticker: "BBY", name: "Best Buy Co., Inc.", type: "Stock" },
            { ticker: "NTDOY", name: "Nintendo Co., Ltd.", type: "Stock" },
        ]

        const filter = (item: { ticker: string; name: string }) =>
            !inPortfolio.has(item.ticker) &&
            (item.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.name.toLowerCase().includes(searchQuery.toLowerCase()))

        if (searchQuery.trim().length >= 2 && apiSuggestions.length > 0) {
            const normalized = apiSuggestions
                .map(s => {
                    const isEtf = s.type?.toUpperCase().includes('ETF') || s.name?.toUpperCase().includes('ETF')
                    return { ticker: s.symbol, name: s.name, type: isEtf ? 'ETF' : 'Stock' as 'ETF' | 'Stock' }
                })
                .filter(item => !inPortfolio.has(item.ticker))

            return {
                stocks: normalized.filter(i => i.type === 'Stock'),
                etfs: normalized.filter(i => i.type === 'ETF')
            }
        }

        const result = {
            stocks: stockList.filter(filter),
            etfs: etfData.map(e => ({ ...e, type: 'ETF' })).filter(filter)
        }

        if ("wshr".includes(searchQuery.toLowerCase()) && !inPortfolio.has("WSHR.NE")) {
            result.etfs.push({
                ticker: "WSHR.NE",
                name: "Wealthsimple Shariah World Equity ETF",
                type: "ETF",
                expenseRatio: 0.5
            } as any)
        }

        return result
    }, [portfolioItems, searchQuery, apiSuggestions])

    // Calculate Totals
    const totalValue = portfolioItems.reduce((sum: number, item) => sum + getItemUsdValue(item), 0)
    const totalCost = portfolioItems.reduce((sum, item) => sum + getItemUsdCost(item), 0)
    const totalGain = totalValue - totalCost
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0

    const handleCreate = () => {
        if (newPortfolioName) {
            createPortfolio(newPortfolioName)
            setNewPortfolioName("")
            setIsCreateOpen(false)
        }
    }

    // New Add Logic
    const initAddTo = (ticker: string, name: string, type: 'Stock' | 'ETF', extras?: any) => {
        if (isAllSelected) {
            // Open Dialog
            setPendingAsset({ ticker, name, type, extras })

            // Set default target to first available non-all portfolio
            const available = Object.values(portfolios).filter(p => p.id !== 'all')
            if (available.length > 0) setTargetPortfolioId(available[0].id)

            setIsAddToOpen(true)
        } else {
            // Direct Add
            addToPortfolio(ticker, name, type, extras)
        }
    }

    const confirmAddTo = () => {
        if (pendingAsset && targetPortfolioId) {
            // We need to briefly switch context or just call add on that ID?
            // usePortfolio's addToPortfolio uses `currentPortfolioId`. 
            // We need to switch, add, then switch back? Or update hook.
            // Updating hook is cleaner, but for now let's hack it: Switch, Add, Switch Back usually causes flicker.
            // Better: We really should update `addToPortfolio` to accept an ID.
            // But to save refactor time, we can reuse the store state since we are inside the component.

            // Actually, simplest is to switch context temporarily
            selectPortfolio(targetPortfolioId)
            setTimeout(() => {
                addToPortfolio(pendingAsset.ticker, pendingAsset.name, pendingAsset.type, pendingAsset.extras)
                // Then switch back to 'all' if we were on all
                setTimeout(() => selectPortfolio('all'), 100)
            }, 0)

            setIsAddToOpen(false)
            setPendingAsset(null)
        }
    }

    const openCashDialog = () => {
        if (isAllSelected) {
            const available = Object.values(portfolios).filter(p => p.id !== 'all')
            if (available.length > 0) setCashTargetPortfolioId(available[0].id)
        }
        setIsCashOpen(true)
    }

    const getCashCurrencyCode = () => {
        const raw = cashCurrency === 'OTHER' ? cashCurrencyCustom : cashCurrency
        return raw.trim().toUpperCase()
    }

    const confirmAddCash = () => {
        const currency = getCashCurrencyCode()
        const amount = parseFloat(cashAmount)
        if (!currency || currency.length < 3 || !amount || amount <= 0) return
        addCash(currency, amount, isAllSelected ? cashTargetPortfolioId : undefined)
        setCashAmount("")
        setCashCurrency("USD")
        setCashCurrencyCustom("")
        setIsCashOpen(false)
    }


    if (!isMounted) return null

    return (
        <div className="min-h-screen bg-background">
            <header className="bg-gradient-to-br from-primary/10 to-accent/10 py-8 mb-8 rounded-lg mx-4 mt-4">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <PieChart className="w-8 h-8 text-primary" />
                            <div>
                                <h1 className="text-2xl font-bold">My Portfolio</h1>
                                <p className="text-sm text-muted-foreground">Manage your detailed holdings</p>
                            </div>
                        </div>

                        {/* Portfolio Selector & Controls */}
                        <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm border">
                            <Select
                                value={currentPortfolioId}
                                onValueChange={(val) => selectPortfolio(val)}
                            >
                                <SelectTrigger className="w-[180px] border-none shadow-none focus:ring-0">
                                    <SelectValue placeholder="Select Portfolio" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Portfolios</SelectItem>
                                    <Separator className="my-1" />
                                    {Object.values(portfolios)
                                        .filter(p => p.id !== 'all')
                                        // Hide Guest Portfolio if user is logged in
                                        .filter(p => {
                                            // If userId exists, filter out the 'default' (Guest) portfolio
                                            if (userId && p.id === 'default') return false
                                            return true
                                        })
                                        .map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            <Separator orientation="vertical" className="h-6" />
                            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8"><Plus className="w-4 h-4 text-primary" /></Button>
                                </DialogTrigger>
                                <DialogContent className="w-[90%] sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Create New Portfolio</DialogTitle>
                                        <CardDescription>
                                            Enter a name for your new portfolio.
                                        </CardDescription>
                                    </DialogHeader>
                                    <div className="py-4 space-y-4">
                                        <div className="space-y-2">
                                            <Label>Portfolio Name</Label>
                                            <Input
                                                value={newPortfolioName}
                                                onChange={(e) => setNewPortfolioName(e.target.value)}
                                                placeholder="e.g., RRSP, TFSA, Kids"
                                            />
                                        </div>
                                        <Button onClick={handleCreate} className="w-full">Create Portfolio</Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                            {!isAllSelected && activePortfolio?.id !== 'default' && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-red-50"
                                    onClick={() => {
                                        if (confirm("Are you sure you want to delete this portfolio?")) deletePortfolio(activePortfolio.id)
                                    }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {totalValue > 0 && (
                        <div className="flex flex-col md:flex-row justify-center gap-8 border-t border-primary/20 pt-6">
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">Total Value</p>
                                <p className="text-3xl font-bold text-gray-900">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">Total Gain/Loss</p>
                                <div className={`flex items-baseline justify-center gap-2 ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    <span className="text-3xl font-bold">
                                        {totalGain >= 0 ? '+' : ''}{totalGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-sm font-medium">({totalGainPercent.toFixed(2)}%)</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 pb-12 space-y-8">
                <Tabs defaultValue="holdings" className="w-full">
                    <div className="flex justify-center mb-6">
                        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
                            <TabsTrigger value="holdings">Holdings</TabsTrigger>
                            <TabsTrigger value="analytics">Analytics</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="holdings" className="space-y-4">
                        <div className="grid lg:grid-cols-12 gap-8">
                            {/* Left: Add Assets - Made smaller (3/12 = 25%) */}
                            <div className="lg:col-span-3 space-y-4">
                                <Card className="sticky top-4 h-[calc(100vh-12rem)] overflow-hidden flex flex-col">
                                    <CardHeader className="pb-3 border-b">
                                        <CardTitle className="text-lg flex items-center gap-2"><Plus className="w-5 h-5" /> Add to {isAllSelected ? 'Portfolio' : activePortfolio?.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-1 flex flex-col gap-4 pt-4 overflow-hidden p-0">
                                        <div className="px-4 pt-4">
                                            <Input
                                                placeholder="Search Ticker..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="mb-2"
                                            />
                                            {isSearching && (
                                                <p className="text-xs text-muted-foreground mb-2">Searching...</p>
                                            )}
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start gap-2"
                                                onClick={openCashDialog}
                                            >
                                                <DollarSign className="w-4 h-4 text-green-600" />
                                                Add Cash (Any Currency)
                                            </Button>
                                        </div>

                                        <Tabs defaultValue="etfs" className="flex-1 flex flex-col overflow-hidden">
                                            <div className="px-4">
                                                <TabsList className="w-full grid grid-cols-2">
                                                    <TabsTrigger value="etfs">Halal ETFs</TabsTrigger>
                                                    <TabsTrigger value="stocks">Stocks</TabsTrigger>
                                                </TabsList>
                                            </div>

                                            <TabsContent value="etfs" className="flex-1 overflow-y-auto p-4 space-y-2">
                                                {etfs.length > 0 ? etfs.map(asset => (
                                                    <div key={asset.ticker} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
                                                        onClick={() => initAddTo(asset.ticker, asset.name, 'ETF', { expenseRatio: (asset as any).expenseRatio })}>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-primary">{asset.ticker}</span>
                                                                <Badge variant="secondary" className="text-[10px] px-1 h-4">ETF</Badge>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground truncate">{asset.name}</p>
                                                        </div>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Plus className="w-4 h-4 text-green-600" />
                                                        </Button>
                                                    </div>
                                                )) : <p className="text-center text-sm text-muted-foreground py-4">No ETFs found.</p>}
                                            </TabsContent>

                                            <TabsContent value="stocks" className="flex-1 overflow-y-auto p-4 space-y-2">
                                                {stocks.length > 0 ? stocks.map(asset => (
                                                    <div key={asset.ticker} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
                                                        onClick={() => initAddTo(asset.ticker, asset.name, 'Stock')}>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-primary">{asset.ticker}</span>
                                                                <Badge variant="outline" className="text-[10px] px-1 h-4">Stock</Badge>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground truncate">{asset.name}</p>
                                                        </div>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Plus className="w-4 h-4 text-green-600" />
                                                        </Button>
                                                    </div>
                                                )) : <p className="text-center text-sm text-muted-foreground py-4">No stocks found.</p>}
                                            </TabsContent>
                                        </Tabs>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right: Portfolio List - Made wider (9/12 = 75%) */}
                            <div className="lg:col-span-9 space-y-4">
                                <Card>
                                    <CardHeader className="border-b pb-4">
                                        <CardTitle className="text-lg flex items-center justify-between">
                                            <span className="flex items-center gap-2">
                                                <Building2 className="w-5 h-5 text-gray-500" />
                                                {activePortfolio?.name || 'Your Holdings'}
                                            </span>
                                            <Badge variant="outline">{portfolioItems.length} Assets</Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {portfolioItems.length === 0 ? (
                                            <div className="text-center py-16 px-4">
                                                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Plus className="w-8 h-8 text-muted-foreground opacity-50" />
                                                </div>
                                                <h3 className="text-lg font-medium text-gray-900 mb-1">Start Building Your Portfolio</h3>
                                                <p className="text-muted-foreground max-w-sm mx-auto">Use the tab on the left to add Stocks and ETFs.</p>
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <div className="min-w-[900px] divide-y divide-gray-100">
                                                    {/* Table Header */}
                                                    <div className={`grid gap-2 text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-gray-50/50 px-3 py-3 rounded-t-lg items-center ${isAllSelected ? 'grid-cols-[1.5fr_0.8fr_1.5fr_0.8fr_0.8fr_0.8fr_1fr_1fr_1fr_0.5fr]' : 'grid-cols-[2fr_1.5fr_0.8fr_0.8fr_0.8fr_1fr_1fr_1fr_0.5fr]'}`}>
                                                        <div className="cursor-pointer hover:text-gray-900 flex items-center gap-1" onClick={() => requestSort('ticker')}>
                                                            Asset {sortConfig.key === 'ticker' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                                        </div>
                                                        {isAllSelected && <div className="cursor-pointer hover:text-gray-900" onClick={() => requestSort('portfolio')}>
                                                            Portfolio {sortConfig.key === 'portfolio' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                                        </div>}
                                                        <div className="cursor-pointer hover:text-gray-900" onClick={() => requestSort('compliance')}>
                                                            Compliance {sortConfig.key === 'compliance' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                                        </div>
                                                        <div className="text-right cursor-pointer hover:text-gray-900" onClick={() => requestSort('shares')}>
                                                            Shares {sortConfig.key === 'shares' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                                        </div>
                                                        <div className="text-right cursor-pointer hover:text-gray-900" onClick={() => requestSort('avgPrice')}>
                                                            Avg Price (USD) {sortConfig.key === 'avgPrice' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                                        </div>
                                                        <div className="text-right cursor-pointer hover:text-gray-900" onClick={() => requestSort('mktPrice')}>
                                                            Mkt Price (USD) {sortConfig.key === 'mktPrice' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                                        </div>
                                                        <div className="text-right cursor-pointer hover:text-gray-900" onClick={() => requestSort('costBasis')}>
                                                            Cost Basis (USD) {sortConfig.key === 'costBasis' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                                        </div>
                                                        <div className="text-right cursor-pointer hover:text-gray-900" onClick={() => requestSort('mktValue')}>
                                                            Mkt Value (USD) {sortConfig.key === 'mktValue' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                                        </div>
                                                        <div className="text-right cursor-pointer hover:text-gray-900" onClick={() => requestSort('gain')}>
                                                            Gain (USD) {sortConfig.key === 'gain' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                                        </div>
                                                        <div className="w-6"></div>
                                                    </div>

                                                    {/* List Items */}
                                                    {sortedItems.map((item, index) => {
                                                        const itemData = marketData[item.ticker]
                                                        const itemPrice = getItemUsdPrice(item)
                                                        const itemValue = getItemUsdValue(item)
                                                        const itemCost = getItemUsdCost(item)
                                                        const itemGain = itemValue - itemCost
                                                        const itemGainPct = itemCost > 0 ? (itemGain / itemCost) * 100 : 0
                                                        const isCash = item.type === 'Cash'

                                                        // Compliance Handling
                                                        let isCompliant = false

                                                        if (isCash) {
                                                            isCompliant = true
                                                        } else {
                                                            const checkRes = checkCompliance(item.ticker, item.type)
                                                            isCompliant = checkRes
                                                        }
                                                        const statusText = isCompliant ? 'Shariah Compliant' : 'Non-Shariah Compliant'

                                                        // Find which portfolio this item belongs to
                                                        const pNames = Object.values(portfolios)
                                                            .filter(p => p.items.some(i => i.ticker === item.ticker && (i.shares === item.shares || i.amount === item.amount)))
                                                            .map(p => p.name)
                                                            .join(", ")

                                                        return (
                                                            <div key={`${item.ticker}-${index}`} className={`grid gap-2 px-3 py-3 items-center hover:bg-gray-50/50 transition-colors group text-sm border-b last:border-0 border-gray-100 ${isAllSelected ? 'grid-cols-[1.5fr_0.8fr_1.5fr_0.8fr_0.8fr_0.8fr_1fr_1fr_1fr_0.5fr]' : 'grid-cols-[2fr_1.5fr_0.8fr_0.8fr_0.8fr_1fr_1fr_1fr_0.5fr]'}`}>
                                                                {/* 1. Asset Info */}
                                                                <div className="min-w-0">
                                                                    {isCash ? (
                                                                        <>
                                                                            <div className="font-bold text-gray-900 truncate text-sm">Cash</div>
                                                                            <span className="text-xs text-muted-foreground truncate block">{item.currency || 'USD'}</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Link href={`/screener?q=${item.ticker}`} className="hover:underline font-bold text-gray-900 truncate text-sm block">
                                                                                {item.ticker}
                                                                            </Link>
                                                                            <span className="text-xs text-muted-foreground truncate block">{item.name}</span>
                                                                        </>
                                                                    )}
                                                                </div>

                                                                {/* 2. Portfolio Name - Only if All */}
                                                                {isAllSelected && (
                                                                    <div className="text-xs text-muted-foreground truncate" title={pNames}>
                                                                        {pNames}
                                                                    </div>
                                                                )}

                                                                {/* 3. Compliance */}
                                                                <div className="min-w-0">
                                                                    {isCash ? (
                                                                        <Badge variant="outline" className="text-[10px] w-auto inline-flex items-center gap-1 px-1.5 py-1 whitespace-nowrap h-auto bg-gray-50 text-gray-600 border-gray-200">
                                                                            <span>Cash</span>
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge variant="outline" className={`text-[10px] w-auto inline-flex items-center gap-1 px-1.5 py-1 whitespace-nowrap h-auto ${isCompliant ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                                            {isCompliant ? <ShieldCheck className="w-3 h-3 shrink-0" /> : <AlertTriangle className="w-3 h-3 shrink-0" />}
                                                                            <div className="flex flex-col leading-none gap-0.5">
                                                                                <span>{isCompliant ? 'Shariah' : 'Non-Shariah'}</span>
                                                                                <span>Compliant</span>
                                                                            </div>
                                                                        </Badge>
                                                                    )}
                                                                </div>

                                                                {/* 4. Shares (Input) */}
                                                                <div className="text-right">
                                                                    <Input
                                                                        disabled={isAllSelected}
                                                                        type="number"
                                                                        className="h-8 text-right font-mono text-xs border border-gray-200 bg-white hover:border-primary focus:border-primary px-2 w-full shadow-sm rounded-md"
                                                                        value={isCash ? (item.amount ?? '') : (item.shares || '')}
                                                                        placeholder="0"
                                                                        onChange={(e) => {
                                                                            const value = parseFloat(e.target.value)
                                                                            if (isCash) {
                                                                                updateCash(item.ticker, value)
                                                                            } else {
                                                                                updateHolding(item.ticker, value, item.avgPrice || 0)
                                                                            }
                                                                        }}
                                                                    />
                                                                </div>

                                                                {/* 5. Avg Price (Input) */}
                                                                <div className="text-right">
                                                                    {isCash ? (
                                                                        <span className="text-xs text-muted-foreground">—</span>
                                                                    ) : (
                                                                        <Input
                                                                            disabled={isAllSelected}
                                                                            type="number"
                                                                            className="h-8 text-right font-mono text-xs border border-gray-200 bg-white hover:border-primary focus:border-primary px-2 w-full shadow-sm rounded-md"
                                                                            value={item.avgPrice || ''}
                                                                            placeholder="0.00"
                                                                            onChange={(e) => updateHolding(item.ticker, item.shares || 0, parseFloat(e.target.value))}
                                                                        />
                                                                    )}
                                                                </div>

                                                                {/* 6. Market Price (Read Only) */}
                                                                <div className="text-right font-mono font-medium text-blue-600">
                                                                    ${itemPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    {itemData?.currency && itemData.currency !== 'USD' && !isCash && (
                                                                        <div className="text-[10px] text-muted-foreground">{itemData.currency} → USD</div>
                                                                    )}
                                                                </div>

                                                                {/* 7. Cost Basis */}
                                                                <div className="text-right font-mono text-muted-foreground text-xs">
                                                                    ${itemCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                                </div>

                                                                {/* 8. Market Value */}
                                                                <div className="text-right font-mono font-bold text-gray-900 text-sm">
                                                                    ${itemValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                                </div>

                                                                {/* 9. Gain */}
                                                                <div className={`text-right text-xs font-bold leading-tight ${itemGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                    <div>{itemGain >= 0 ? '+' : ''}${itemGain.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                                                                    <div className="opacity-80 text-[10px]">{itemGainPct.toFixed(1)}%</div>
                                                                </div>

                                                                {/* Actions */}
                                                                <div className="flex justify-end">
                                                                    {!isAllSelected && (
                                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-red-600 hover:bg-red-50" onClick={() => removeFromPortfolio(item.ticker)}>
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="analytics" className="space-y-6">
                        {nonCashItems.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground">
                                <PieChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <h3 className="text-lg font-medium">No Data for Analytics</h3>
                                <p>Add assets to your portfolio to unlock these insights.</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-6">
                                <AssetAllocation items={nonCashItems} />
                                <ComplianceBreakdown items={nonCashItems} />
                                <GeographicBreakdown items={nonCashItems} />
                                <FeeAnalyzer items={nonCashItems} />
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Add To Dialog */}
                <Dialog open={isAddToOpen} onOpenChange={setIsAddToOpen}>
                    <DialogContent className="w-[90%] sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add to Portfolio</DialogTitle>
                            <CardDescription>
                                Select which portfolio to add <strong>{pendingAsset?.ticker}</strong> to.
                            </CardDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Label className="mb-2 block">Target Portfolio</Label>
                            <Select value={targetPortfolioId} onValueChange={setTargetPortfolioId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.values(portfolios)
                                        .filter(p => p.id !== 'all' && p.id !== 'default')
                                        .map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))
                                    }
                                    {Object.values(portfolios).filter(p => p.id !== 'all').length === 0 && (
                                        <SelectItem value="default">Default Portfolio</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddToOpen(false)}>Cancel</Button>
                            <Button onClick={confirmAddTo}>Add Asset</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Add Cash Dialog */}
                <Dialog open={isCashOpen} onOpenChange={setIsCashOpen}>
                    <DialogContent className="w-[90%] sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add Cash</DialogTitle>
                            <CardDescription>
                                Track cash in any currency. Values are converted to USD.
                            </CardDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            {isAllSelected && (
                                <div>
                                    <Label className="mb-2 block">Target Portfolio</Label>
                                    <Select value={cashTargetPortfolioId} onValueChange={setCashTargetPortfolioId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.values(portfolios)
                                                .filter(p => p.id !== 'all' && p.id !== 'default')
                                                .map(p => (
                                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                ))
                                            }
                                            {Object.values(portfolios).filter(p => p.id !== 'all').length === 0 && (
                                                <SelectItem value="default">Default Portfolio</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Currency</Label>
                                    <Select value={cashCurrency} onValueChange={setCashCurrency}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select currency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {COMMON_CURRENCIES.map(code => (
                                                <SelectItem key={code} value={code}>{code}</SelectItem>
                                            ))}
                                            <SelectItem value="OTHER">Other...</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Amount</Label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={cashAmount}
                                        onChange={(e) => setCashAmount(e.target.value)}
                                    />
                                </div>
                            </div>
                            {cashCurrency === 'OTHER' && (
                                <div className="space-y-2">
                                    <Label>Currency Code</Label>
                                    <Input
                                        placeholder="e.g. CHF"
                                        value={cashCurrencyCustom}
                                        onChange={(e) => setCashCurrencyCustom(e.target.value.toUpperCase())}
                                    />
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCashOpen(false)}>Cancel</Button>
                            <Button onClick={confirmAddCash} disabled={!cashAmount}>
                                Add Cash
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    )
}
