"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { etfData, type ETF } from "@/lib/etf-data"
import { GitCompare, BarChart3, PieChart, Building2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Cell
} from "recharts"

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

export default function ComparePage() {
    const [selectedETFs, setSelectedETFs] = useState<string[]>([])

    const selectedData = useMemo(() =>
        etfData.filter(etf => selectedETFs.includes(etf.ticker)),
        [selectedETFs]
    )

    const toggleETF = (ticker: string) => {
        if (selectedETFs.includes(ticker)) {
            setSelectedETFs(selectedETFs.filter(t => t !== ticker))
        } else if (selectedETFs.length < 5) {
            setSelectedETFs([...selectedETFs, ticker])
        }
    }

    // Sector comparison data
    const sectorData = useMemo(() => {
        const allSectors = new Set<string>()
        selectedData.forEach(etf => etf.sectorAllocation.forEach(s => allSectors.add(s.sector)))

        return Array.from(allSectors).map(sector => {
            const row: Record<string, string | number> = { sector }
            selectedData.forEach(etf => {
                const sectorAlloc = etf.sectorAllocation.find(s => s.sector === sector)
                row[etf.ticker] = sectorAlloc?.weight || 0
            })
            return row
        }).sort((a, b) => {
            const aTotal = selectedData.reduce((sum, etf) => sum + (Number(a[etf.ticker]) || 0), 0)
            const bTotal = selectedData.reduce((sum, etf) => sum + (Number(b[etf.ticker]) || 0), 0)
            return bTotal - aTotal
        }).slice(0, 8)
    }, [selectedData])

    // Holdings overlap
    const holdingsOverlap = useMemo(() => {
        if (selectedData.length < 2) return []

        const holdingCounts = new Map<string, { name: string, etfs: string[], totalWeight: number }>()
        selectedData.forEach(etf => {
            etf.holdings.forEach(h => {
                const existing = holdingCounts.get(h.ticker)
                if (existing) {
                    existing.etfs.push(etf.ticker)
                    existing.totalWeight += h.weight
                } else {
                    holdingCounts.set(h.ticker, { name: h.name, etfs: [etf.ticker], totalWeight: h.weight })
                }
            })
        })

        return Array.from(holdingCounts.entries())
            .filter(([, data]) => data.etfs.length > 1)
            .map(([ticker, data]) => ({ ticker, ...data }))
            .sort((a, b) => b.etfs.length - a.etfs.length || b.totalWeight - a.totalWeight)
            .slice(0, 10)
    }, [selectedData])

    // Performance comparison
    const performanceData = useMemo(() =>
        selectedData.map(etf => ({
            ticker: etf.ticker,
            YTD: etf.performance.ytd,
            '1Y': etf.performance.oneYear,
            '3Y': etf.performance.threeYear || 0,
            'Since Inception': etf.performance.sinceInception,
        })),
        [selectedData]
    )

    return (
        <div className="min-h-screen bg-background">
            <header className="bg-gradient-to-br from-primary/10 to-accent/10 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <GitCompare className="w-10 h-10 text-primary mx-auto mb-4" />
                    <h1 className="text-3xl font-bold">Compare ETFs</h1>
                    <p className="text-muted-foreground mt-2">Compare holdings, sectors, and performance side-by-side</p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* ETF Selection */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Select ETFs to Compare (max 5)</span>
                            <Badge variant="secondary">{selectedETFs.length} selected</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {etfData.map(etf => (
                                <div
                                    key={etf.ticker}
                                    className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${selectedETFs.includes(etf.ticker) ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground'
                                        } ${selectedETFs.length >= 5 && !selectedETFs.includes(etf.ticker) ? 'opacity-50' : ''}`}
                                    onClick={() => toggleETF(etf.ticker)}
                                >
                                    <Checkbox checked={selectedETFs.includes(etf.ticker)} />
                                    <div>
                                        <span className="font-bold text-primary text-sm">{etf.ticker}</span>
                                        <p className="text-xs text-muted-foreground">{etf.provider}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {selectedData.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-muted-foreground">Select ETFs above to start comparing</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Quick Stats */}
                        <div className="grid md:grid-cols-5 gap-4">
                            {selectedData.map((etf, i) => (
                                <Card key={etf.ticker} style={{ borderColor: COLORS[i] }}>
                                    <CardContent className="pt-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                                            <span className="font-bold">{etf.ticker}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mb-2">{etf.provider}</p>
                                        <div className="text-sm space-y-1">
                                            <div className="flex justify-between"><span>Expense:</span><span className="font-medium">{etf.expenseRatio}%</span></div>
                                            <div className="flex justify-between"><span>YTD:</span><span className={`font-medium ${etf.performance.ytd >= 0 ? 'text-green-600' : 'text-red-600'}`}>{etf.performance.ytd >= 0 ? '+' : ''}{etf.performance.ytd}%</span></div>
                                            <div className="flex justify-between"><span>AUM:</span><span className="font-medium">{etf.aum}</span></div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Sector Comparison */}
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><PieChart className="w-5 h-5" />Sector Allocation Comparison</CardTitle></CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={sectorData} layout="vertical">
                                        <XAxis type="number" domain={[0, 60]} tickFormatter={(v) => `${v}%`} />
                                        <YAxis type="category" dataKey="sector" width={120} tick={{ fontSize: 12 }} />
                                        <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                                        <Legend />
                                        {selectedData.map((etf, i) => (
                                            <Bar key={etf.ticker} dataKey={etf.ticker} fill={COLORS[i]} />
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Holdings Overlap */}
                        {holdingsOverlap.length > 0 && (
                            <Card>
                                <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" />Holdings Overlap</CardTitle></CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4">Stocks held by multiple selected ETFs</p>
                                    <div className="grid md:grid-cols-2 gap-3">
                                        {holdingsOverlap.map(h => (
                                            <div key={h.ticker} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div>
                                                    <span className="font-bold">{h.ticker}</span>
                                                    <p className="text-xs text-muted-foreground">{h.name}</p>
                                                </div>
                                                <div className="flex gap-1">
                                                    {h.etfs.map(etf => {
                                                        const idx = selectedETFs.indexOf(etf)
                                                        return <Badge key={etf} style={{ backgroundColor: COLORS[idx] }}>{etf}</Badge>
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Performance Comparison */}
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" />Performance Comparison</CardTitle></CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={performanceData}>
                                        <XAxis dataKey="ticker" />
                                        <YAxis tickFormatter={(v) => `${v}%`} />
                                        <Tooltip formatter={(v: number) => `${v.toFixed(2)}%`} />
                                        <Legend />
                                        <Bar dataKey="YTD" fill="#22c55e" />
                                        <Bar dataKey="1Y" fill="#3b82f6" />
                                        <Bar dataKey="Since Inception" fill="#f59e0b" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <div className="mt-8 flex gap-4">
                    <Link href="/etfs"><Button variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4" />Back to ETFs</Button></Link>
                    <Link href="/portfolio"><Button className="gap-2"><PieChart className="w-4 h-4" />Build Portfolio</Button></Link>
                </div>
            </main>
        </div>
    )
}
