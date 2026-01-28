"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { etfData } from "@/lib/etf-data"
import { checkCompliance } from "@/lib/stock-data"
import { usePortfolio } from "@/hooks/use-portfolio"
import { Plus, Trash2, PieChart, Building2, ShieldCheck, TrendingUp, AlertTriangle } from "lucide-react"
import Link from "next/link"

import { createClient } from "@/utils/supabase/client"

export default function PortfolioPage() {
    const { getCurrentPortfolio, updateAllocation, updateHolding, removeFromPortfolio, addToPortfolio, setUserId } = usePortfolio()
    const currentPortfolio = getCurrentPortfolio()
    const portfolio = currentPortfolio?.items || []

    const [searchQuery, setSearchQuery] = useState("")
    const [isMounted, setIsMounted] = useState(false)
    const supabase = createClient()

    // Real-time Data State
    const [marketData, setMarketData] = useState<Record<string, { price: number, change: number, changePercent: number }>>({})

    useEffect(() => {
        setIsMounted(true)

        // Sync User ID with Store
        const syncUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUserId(user?.id || null)
        }
        syncUser()
    }, [])

    // Fetch live prices
    useEffect(() => {
        const fetchPrices = async () => {
            if (portfolio.length === 0) return
            const newData: Record<string, any> = {}
            await Promise.all(portfolio.map(async (item) => {
                try {
                    const res = await fetch(`/api/quote?ticker=${item.ticker}`)
                    if (res.ok) {
                        const data = await res.json()
                        newData[item.ticker] = data
                    }
                } catch (e) {
                    // console.error(e) 
                }
            }))
            setMarketData(prev => ({ ...prev, ...newData }))
        }
        fetchPrices()
    }, [portfolio.length])

    // Available Assets - Split logic
    const { stocks, etfs } = useMemo(() => {
        const inPortfolio = new Set(portfolio.map(p => p.ticker))

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

        const filter = (item: any) =>
            !inPortfolio.has(item.ticker) &&
            (item.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.name.toLowerCase().includes(searchQuery.toLowerCase()))

        return {
            stocks: stockList.filter(filter),
            etfs: etfData.map(e => ({ ...e, type: 'ETF' })).filter(filter)
        }
    }, [portfolio, searchQuery])

    // Calculate Total Portfolio Value
    const totalValue = portfolio.reduce((sum, item) => {
        const price = marketData[item.ticker]?.price || item.avgPrice || 0
        return sum + (item.shares || 0) * price
    }, 0)

    const totalCost = portfolio.reduce((sum, item) => sum + (item.shares || 0) * (item.avgPrice || 0), 0)
    const totalGain = totalValue - totalCost
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0

    if (!isMounted) return null

    return (
        <div className="min-h-screen bg-background">
            <header className="bg-gradient-to-br from-primary/10 to-accent/10 py-12 mb-8 rounded-lg mx-4 mt-4">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <PieChart className="w-10 h-10 text-primary mx-auto mb-4" />
                    <h1 className="text-3xl font-bold">My Portfolio</h1>
                    <p className="text-muted-foreground mt-2">Manage your Halal holdings and track performance</p>

                    {totalValue > 0 && (
                        <div className="mt-8 flex flex-col md:flex-row justify-center gap-8 md:gap-16">
                            <div className="text-center p-4 bg-white rounded-lg shadow-sm border">
                                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">Total Value</p>
                                <p className="text-4xl font-bold text-gray-900">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                            <div className="text-center p-4 bg-white rounded-lg shadow-sm border">
                                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">Total Gain/Loss</p>
                                <div className={`flex items-baseline justify-center gap-2 ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    <span className="text-4xl font-bold">
                                        {totalGain >= 0 ? '+' : ''}{totalGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-lg font-medium">({totalGainPercent.toFixed(2)}%)</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 pb-12">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left: Add Assets (Tabs for Stocks / ETFs) */}
                    <div className="lg:col-span-1 space-y-4">
                        <Card className="sticky top-4 h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
                            <CardHeader className="pb-3 border-b">
                                <CardTitle className="text-lg flex items-center gap-2"><Plus className="w-5 h-5" /> Add Assets</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col gap-4 pt-4 overflow-hidden p-0">
                                <div className="px-4 pt-4">
                                    <Input
                                        placeholder="Search Ticker..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="mb-2"
                                    />
                                </div>

                                <Tabs defaultValue="etfs" className="flex-1 flex flex-col overflow-hidden">
                                    <div className="px-4">
                                        <TabsList className="w-full grid grid-cols-2">
                                            <TabsTrigger value="etfs">Halal ETFs</TabsTrigger>
                                            <TabsTrigger value="stocks">Stocks</TabsTrigger>
                                        </TabsList>
                                    </div>

                                    {/* ETFs List */}
                                    <TabsContent value="etfs" className="flex-1 overflow-y-auto p-4 space-y-2">
                                        {etfs.length > 0 ? etfs.map(asset => (
                                            <div key={asset.ticker} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
                                                onClick={() => addToPortfolio(asset.ticker, asset.name, 'ETF', { expenseRatio: (asset as any).expenseRatio })}>
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

                                    {/* Stocks List */}
                                    <TabsContent value="stocks" className="flex-1 overflow-y-auto p-4 space-y-2">
                                        {stocks.length > 0 ? stocks.map(asset => (
                                            <div key={asset.ticker} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
                                                onClick={() => addToPortfolio(asset.ticker, asset.name, 'Stock')}>
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

                    {/* Right: Portfolio List */}
                    <div className="lg:col-span-2 space-y-4">
                        <Card>
                            <CardHeader className="border-b pb-4">
                                <CardTitle className="text-lg flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <Building2 className="w-5 h-5 text-gray-500" />
                                        {currentPortfolio?.name || 'Your Holdings'}
                                    </span>
                                    <Badge variant="outline">{portfolio.length} Assets</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {portfolio.length === 0 ? (
                                    <div className="text-center py-16 px-4">
                                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Plus className="w-8 h-8 text-muted-foreground opacity-50" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-1">Start Building Your Portfolio</h3>
                                        <p className="text-muted-foreground max-w-sm mx-auto">Use the tab on the left to add Stocks and ETFs.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {/* Table Header */}
                                        <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-gray-50/50">
                                            <div className="col-span-4 md:col-span-3">Asset</div>
                                            <div className="col-span-2 md:col-span-2 text-right">Shares</div>
                                            <div className="col-span-3 md:col-span-2 text-right">Avg Buy Price</div>
                                            <div className="col-span-3 md:col-span-2 text-right">Market Price</div>
                                            <div className="hidden md:block col-span-2 text-right">Value / Gain</div>
                                            <div className="col-span-1 md:col-span-1"></div>
                                        </div>

                                        {/* List Items */}
                                        {portfolio.map(item => {
                                            const itemPrice = marketData[item.ticker]?.price || item.avgPrice || 0
                                            const itemValue = (item.shares || 0) * itemPrice
                                            const itemCost = (item.shares || 0) * (item.avgPrice || 0)
                                            const itemGain = itemValue - itemCost
                                            const itemGainPct = itemCost > 0 ? (itemGain / itemCost) * 100 : 0

                                            // Real Compliance Check
                                            const isCompliant = checkCompliance(item.ticker, item.type)

                                            return (
                                                <div key={item.ticker} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50/50 transition-colors group">
                                                    {/* Asset Info */}
                                                    <div className="col-span-4 md:col-span-3 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                                            <Link href={`/screener?q=${item.ticker}`} className="hover:underline">
                                                                <span className="font-bold text-base text-gray-900">{item.ticker}</span>
                                                            </Link>
                                                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal text-gray-500">{item.type}</Badge>
                                                            {isCompliant ? (
                                                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-green-50 text-green-700 border-green-200 gap-1 flex items-center">
                                                                    <ShieldCheck className="w-3 h-3" /> <span className="hidden sm:inline">Halal</span>
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-red-50 text-red-700 border-red-200 gap-1 flex items-center hover:bg-red-100">
                                                                    <AlertTriangle className="w-3 h-3" /> <span className="hidden sm:inline">Shariah Non-Compliant</span>
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <Link href={`/screener?q=${item.ticker}`} className="text-xs text-muted-foreground truncate max-w-[140px] hover:text-primary transition-colors block">
                                                            {item.name}
                                                        </Link>
                                                    </div>

                                                    {/* Shares Input */}
                                                    <div className="col-span-2 md:col-span-2 flex flex-col justify-center text-right">
                                                        <Input
                                                            type="number"
                                                            className="h-8 text-right font-mono text-sm border-gray-200 focus:border-primary px-2"
                                                            value={item.shares || ''}
                                                            placeholder="0"
                                                            onChange={(e) => updateHolding(item.ticker, parseFloat(e.target.value), item.avgPrice || 0)}
                                                        />
                                                    </div>

                                                    {/* Avg Price Input */}
                                                    <div className="col-span-3 md:col-span-2 flex flex-col justify-center text-right">
                                                        <Input
                                                            type="number"
                                                            className="h-8 text-right font-mono text-sm border-gray-200 focus:border-primary px-2"
                                                            value={item.avgPrice || ''}
                                                            placeholder="0.00"
                                                            onChange={(e) => updateHolding(item.ticker, item.shares || 0, parseFloat(e.target.value))}
                                                        />
                                                    </div>

                                                    {/* Market Price (Read Only) */}
                                                    <div className="col-span-3 md:col-span-2 text-right flex items-center justify-end">
                                                        <div className="h-8 flex items-center justify-end font-mono text-sm font-bold text-gray-900">
                                                            ${itemPrice.toFixed(2)}
                                                        </div>
                                                    </div>

                                                    {/* Value & Gain (Hidden on small screens, shown on md+) */}
                                                    <div className="hidden md:block col-span-2 text-right">
                                                        <div className="font-bold text-gray-900 text-sm">${itemValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                        {item.shares ? (
                                                            <div className={`text-xs font-medium ${itemGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                {itemGain >= 0 ? '+' : ''}{itemGain.toFixed(2)} ({itemGainPct.toFixed(2)}%)
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">-</span>
                                                        )}
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="col-span-1 md:col-span-1 flex justify-end">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" onClick={() => removeFromPortfolio(item.ticker)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}
