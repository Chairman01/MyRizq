"use client"

import { etfData } from "@/lib/etf-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LineChart, TrendingUp, DollarSign, ExternalLink, ChevronDown, ArrowUpDown } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function getRankColor(rank: number, total: number): string {
    const pct = rank / total
    if (pct <= 0.33) return "bg-green-100 text-green-800 border-green-200"
    if (pct <= 0.66) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-red-100 text-red-800 border-red-200"
}

export default function AnalyticsPage() {
    const [sortField, setSortField] = useState<"ytd" | "inception" | "expense">("ytd")
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

    const sortedData = [...etfData].sort((a, b) => {
        let valA, valB
        if (sortField === "ytd") {
            valA = a.performance.ytd
            valB = b.performance.ytd
        } else if (sortField === "inception") {
            valA = a.performance.sinceInception
            valB = b.performance.sinceInception
        } else {
            valA = a.expenseRatio
            valB = b.expenseRatio
        }
        return sortDirection === "asc" ? valA - valB : valB - valA
    })

    const sortedByYTD = [...etfData].sort((a, b) => b.performance.ytd - a.performance.ytd)
    const sortedByExpense = [...etfData].sort((a, b) => a.expenseRatio - b.expenseRatio)
    const usETFs = etfData.filter(e => e.listing === "US" && e.focus.includes("US"))

    const toggleSort = (field: "ytd" | "inception" | "expense") => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            setSortDirection(field === "expense" ? "asc" : "desc") // Default expense to asc (lower is better)
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="bg-gradient-to-br from-primary/10 to-accent/10 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <LineChart className="w-10 h-10 text-primary mx-auto mb-4" />
                    <h1 className="text-3xl font-bold">ETF Analytics & Comparison</h1>
                    <p className="text-muted-foreground mt-2">Compare Halal ETFs by performance, fees, and diversification</p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
                {/* Key Metrics */}
                <div className="grid md:grid-cols-4 gap-4">
                    <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{etfData.length}</div><p className="text-sm text-muted-foreground">Total Halal ETFs</p></CardContent></Card>
                    <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-accent">{sortedByYTD[0]?.ticker}</div><p className="text-sm text-muted-foreground">Best YTD Performance</p></CardContent></Card>
                    <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{sortedByExpense[0]?.expenseRatio.toFixed(2)}%</div><p className="text-sm text-muted-foreground">Lowest Expense Ratio</p></CardContent></Card>
                    <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{usETFs.length}</div><p className="text-sm text-muted-foreground">US-Listed ETFs</p></CardContent></Card>
                </div>

                {/* Rankings Table */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" />ETF Rankings</CardTitle>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Sort by:</span>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-2">
                                        {sortField === "ytd" ? "YTD Performance" : sortField === "inception" ? "Since Inception" : "Expense Ratio"}
                                        <ChevronDown className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => { setSortField("ytd"); setSortDirection("desc") }}>
                                        YTD Performance
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { setSortField("inception"); setSortDirection("desc") }}>
                                        Since Inception
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { setSortField("expense"); setSortDirection("asc") }}>
                                        Expense Ratio
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                            >
                                <ArrowUpDown className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-2">Rank</th>
                                        <th className="text-left py-3 px-2">ETF</th>
                                        <th className="text-left py-3 px-2">Focus</th>
                                        <th className="text-right py-3 px-2 cursor-pointer hover:text-primary" onClick={() => toggleSort("expense")}>
                                            Expense {sortField === "expense" && (sortDirection === "asc" ? "↑" : "↓")}
                                        </th>
                                        <th className="text-right py-3 px-2 cursor-pointer hover:text-primary" onClick={() => toggleSort("ytd")}>
                                            YTD {sortField === "ytd" && (sortDirection === "desc" ? "↓" : "↑")}
                                        </th>
                                        <th className="text-right py-3 px-2 cursor-pointer hover:text-primary" onClick={() => toggleSort("inception")}>
                                            Since Inception {sortField === "inception" && (sortDirection === "desc" ? "↓" : "↑")}
                                        </th>
                                        <th className="text-center py-3 px-2">Listing</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedData.map((etf, i) => (
                                        <tr key={etf.ticker} className="border-b hover:bg-muted/50">
                                            <td className="py-3 px-2"><Badge className={getRankColor(i + 1, sortedData.length)}>#{i + 1}</Badge></td>
                                            <td className="py-3 px-2"><span className="font-bold text-primary">{etf.ticker}</span><span className="block text-xs text-muted-foreground">{etf.provider}</span></td>
                                            <td className="py-3 px-2 text-muted-foreground">{etf.focus}</td>
                                            <td className="py-3 px-2 text-right">{etf.expenseRatio.toFixed(2)}%</td>
                                            <td className={`py-3 px-2 text-right font-semibold ${etf.performance.ytd >= 0 ? 'text-green-600' : 'text-red-600'}`}>{etf.performance.ytd >= 0 ? '+' : ''}{etf.performance.ytd.toFixed(2)}%</td>
                                            <td className="py-3 px-2 text-right">{etf.performance.sinceInception.toFixed(2)}%</td>
                                            <td className="py-3 px-2 text-center">{etf.listingFlag}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Expense Ratio Comparison */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5" />Expense Ratio Comparison</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {sortedByExpense.map((etf, i) => (
                                <div key={etf.ticker} className="flex items-center gap-4">
                                    <span className="w-16 font-bold text-primary">{etf.ticker}</span>
                                    <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                                        <div className={`h-full ${i < 3 ? 'bg-green-500' : i < 7 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${(etf.expenseRatio / 0.65) * 100}%` }} />
                                    </div>
                                    <span className="w-16 text-right font-semibold">{etf.expenseRatio.toFixed(2)}%</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">Lower expense ratios mean more of your returns stay in your pocket. Conventional S&P 500 ETFs can be as low as 0.03%.</p>
                    </CardContent>
                </Card>

                {/* Where to Buy */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><ExternalLink className="w-5 h-5" />Where to Buy Halal ETFs</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                                { name: "Fidelity", url: "https://www.fidelity.com", desc: "US - $0 commissions", countries: "🇺🇸" },
                                { name: "Charles Schwab", url: "https://www.schwab.com", desc: "US - $0 commissions", countries: "🇺🇸" },
                                { name: "Interactive Brokers", url: "https://www.interactivebrokers.com", desc: "Global - Low fees", countries: "🇺🇸🇬🇧🇨🇦🇪🇺" },
                                { name: "Wealthsimple", url: "https://www.wealthsimple.com", desc: "Canada - Commission-free", countries: "🇨🇦" },
                                { name: "Trading 212", url: "https://www.trading212.com", desc: "UK/EU - Commission-free", countries: "🇬🇧🇪🇺" },
                                { name: "Robinhood", url: "https://www.robinhood.com", desc: "US - Commission-free", countries: "🇺🇸" },
                            ].map((broker) => (
                                <a key={broker.name} href={broker.url} target="_blank" rel="noopener noreferrer" className="p-4 border rounded-lg hover:border-primary transition-colors group">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold group-hover:text-primary">{broker.name}</p>
                                            <p className="text-sm text-muted-foreground">{broker.desc}</p>
                                        </div>
                                        <span>{broker.countries}</span>
                                    </div>
                                </a>
                            ))}
                        </div>
                        <Link href="/blog/brokers" className="text-primary font-medium text-sm mt-4 inline-block hover:underline">Read our complete broker guide →</Link>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
