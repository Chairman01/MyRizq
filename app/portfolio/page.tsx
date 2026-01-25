"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { etfData, type ETF } from "@/lib/etf-data"
import { Plus, Minus, Trash2, PieChart, TrendingUp, DollarSign, Building2, Save, RotateCcw } from "lucide-react"
import Link from "next/link"

interface PortfolioItem {
    etf: ETF
    allocation: number
}

export default function PortfolioPage() {
    const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
    const [searchQuery, setSearchQuery] = useState("")

    const availableETFs = useMemo(() => {
        const inPortfolio = new Set(portfolio.map(p => p.etf.ticker))
        return etfData.filter(etf =>
            !inPortfolio.has(etf.ticker) &&
            (etf.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
                etf.name.toLowerCase().includes(searchQuery.toLowerCase()))
        )
    }, [portfolio, searchQuery])

    const totalAllocation = portfolio.reduce((sum, p) => sum + p.allocation, 0)

    const portfolioStats = useMemo(() => {
        if (portfolio.length === 0) return null
        const weightedExpense = portfolio.reduce((sum, p) => sum + (p.etf.expenseRatio * p.allocation / 100), 0)
        const weightedYTD = portfolio.reduce((sum, p) => sum + (p.etf.performance.ytd * p.allocation / 100), 0)

        // Combined sector allocation
        const sectorMap = new Map<string, number>()
        portfolio.forEach(item => {
            item.etf.sectorAllocation.forEach(sector => {
                const weight = (sector.weight * item.allocation / 100)
                sectorMap.set(sector.sector, (sectorMap.get(sector.sector) || 0) + weight)
            })
        })
        const sectors = Array.from(sectorMap.entries())
            .map(([sector, weight]) => ({ sector, weight }))
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 8)

        // Combined holdings
        const holdingMap = new Map<string, { name: string, weight: number, sector: string }>()
        portfolio.forEach(item => {
            item.etf.holdings.forEach(holding => {
                const weight = (holding.weight * item.allocation / 100)
                const existing = holdingMap.get(holding.ticker)
                if (existing) {
                    existing.weight += weight
                } else {
                    holdingMap.set(holding.ticker, { name: holding.name, weight, sector: holding.sector || 'Other' })
                }
            })
        })
        const holdings = Array.from(holdingMap.entries())
            .map(([ticker, data]) => ({ ticker, ...data }))
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 10)

        return { weightedExpense, weightedYTD, sectors, holdings }
    }, [portfolio])

    const addETF = (etf: ETF) => {
        const remainingAllocation = Math.max(0, 100 - totalAllocation)
        const defaultAllocation = Math.min(remainingAllocation, Math.floor(100 / (portfolio.length + 1)))
        setPortfolio([...portfolio, { etf, allocation: defaultAllocation || 10 }])
        setSearchQuery("")
    }

    const removeETF = (ticker: string) => {
        setPortfolio(portfolio.filter(p => p.etf.ticker !== ticker))
    }

    const updateAllocation = (ticker: string, allocation: number) => {
        setPortfolio(portfolio.map(p =>
            p.etf.ticker === ticker ? { ...p, allocation: Math.max(0, Math.min(100, allocation)) } : p
        ))
    }

    const savePortfolio = () => {
        localStorage.setItem('myrizq-portfolio', JSON.stringify(portfolio.map(p => ({ ticker: p.etf.ticker, allocation: p.allocation }))))
        alert('Portfolio saved!')
    }

    const loadPortfolio = () => {
        const saved = localStorage.getItem('myrizq-portfolio')
        if (saved) {
            const data = JSON.parse(saved) as { ticker: string, allocation: number }[]
            const loaded = data.map(item => {
                const etf = etfData.find(e => e.ticker === item.ticker)
                return etf ? { etf, allocation: item.allocation } : null
            }).filter(Boolean) as PortfolioItem[]
            setPortfolio(loaded)
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="bg-gradient-to-br from-primary/10 to-accent/10 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <PieChart className="w-10 h-10 text-primary mx-auto mb-4" />
                    <h1 className="text-3xl font-bold">Portfolio Builder</h1>
                    <p className="text-muted-foreground mt-2">Build your custom Halal investment portfolio</p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left: ETF Selection */}
                    <div className="lg:col-span-1 space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2"><Plus className="w-5 h-5" />Add ETFs</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Input
                                    placeholder="Search ETFs..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <div className="max-h-64 overflow-y-auto space-y-2">
                                    {availableETFs.slice(0, 8).map(etf => (
                                        <div key={etf.ticker} className="flex items-center justify-between p-2 border rounded hover:bg-muted/50 cursor-pointer" onClick={() => addETF(etf)}>
                                            <div>
                                                <span className="font-bold text-primary">{etf.ticker}</span>
                                                <p className="text-xs text-muted-foreground truncate max-w-[180px]">{etf.name}</p>
                                            </div>
                                            <Plus className="w-4 h-4 text-primary" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={savePortfolio}><Save className="w-4 h-4" />Save</Button>
                            <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={loadPortfolio}><RotateCcw className="w-4 h-4" />Load</Button>
                        </div>
                    </div>

                    {/* Middle: Portfolio */}
                    <div className="lg:col-span-1 space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center justify-between">
                                    <span>Your Portfolio</span>
                                    <Badge variant={totalAllocation === 100 ? "default" : "secondary"}>{totalAllocation}%</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {portfolio.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">Add ETFs to build your portfolio</p>
                                ) : (
                                    <div className="space-y-3">
                                        {portfolio.map(item => (
                                            <div key={item.etf.ticker} className="flex items-center gap-3 p-3 border rounded-lg">
                                                <div className="flex-1">
                                                    <span className="font-bold text-primary">{item.etf.ticker}</span>
                                                    <p className="text-xs text-muted-foreground">{item.etf.provider}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateAllocation(item.etf.ticker, item.allocation - 5)}>
                                                        <Minus className="w-3 h-3" />
                                                    </Button>
                                                    <Input
                                                        type="number"
                                                        value={item.allocation}
                                                        onChange={(e) => updateAllocation(item.etf.ticker, parseInt(e.target.value) || 0)}
                                                        className="w-16 text-center h-8"
                                                    />
                                                    <span className="text-sm">%</span>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateAllocation(item.etf.ticker, item.allocation + 5)}>
                                                        <Plus className="w-3 h-3" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeETF(item.etf.ticker)}>
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                        {totalAllocation !== 100 && (
                                            <p className="text-sm text-amber-600 text-center">⚠️ Allocations should total 100%</p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Stats */}
                    <div className="lg:col-span-1 space-y-4">
                        {portfolioStats && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <Card><CardContent className="pt-4 text-center">
                                        <DollarSign className="w-5 h-5 text-primary mx-auto mb-1" />
                                        <p className="text-2xl font-bold">{portfolioStats.weightedExpense.toFixed(2)}%</p>
                                        <p className="text-xs text-muted-foreground">Expense Ratio</p>
                                    </CardContent></Card>
                                    <Card><CardContent className="pt-4 text-center">
                                        <TrendingUp className="w-5 h-5 text-accent mx-auto mb-1" />
                                        <p className={`text-2xl font-bold ${portfolioStats.weightedYTD >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {portfolioStats.weightedYTD >= 0 ? '+' : ''}{portfolioStats.weightedYTD.toFixed(2)}%
                                        </p>
                                        <p className="text-xs text-muted-foreground">Weighted YTD</p>
                                    </CardContent></Card>
                                </div>

                                <Card>
                                    <CardHeader className="pb-2"><CardTitle className="text-sm">Top Sectors</CardTitle></CardHeader>
                                    <CardContent className="space-y-2">
                                        {portfolioStats.sectors.map(s => (
                                            <div key={s.sector} className="flex items-center gap-2">
                                                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                                                    <div className="h-full bg-primary" style={{ width: `${Math.min(s.weight, 100)}%` }} />
                                                </div>
                                                <span className="text-xs w-20 truncate">{s.sector}</span>
                                                <span className="text-xs font-medium w-12 text-right">{s.weight.toFixed(1)}%</span>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2"><CardTitle className="text-sm">Top Holdings</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="space-y-1">
                                            {portfolioStats.holdings.map(h => (
                                                <div key={h.ticker} className="flex justify-between text-sm">
                                                    <span className="font-medium">{h.ticker}</span>
                                                    <span className="text-muted-foreground">{h.weight.toFixed(2)}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}

                        <Link href="/compare">
                            <Button variant="outline" className="w-full gap-2"><Building2 className="w-4 h-4" />Compare ETFs Side-by-Side</Button>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    )
}
