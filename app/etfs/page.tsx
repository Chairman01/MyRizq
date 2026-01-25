"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ETFCard } from "@/components/etf-card"
import { ETFDetailModal } from "@/components/etf-detail-modal"
import { ETFComparisonTable } from "@/components/etf-comparison-table"
import { etfData, etfCategories, filterETFsByCategory, type ETF } from "@/lib/etf-data"
import { Search, LayoutGrid, TableIcon, ChevronDown, BookOpen } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function ETFsPage() {
    const [selectedETF, setSelectedETF] = useState<ETF | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
    const [sortBy, setSortBy] = useState<"name" | "ytd" | "expense">("ytd")

    const filteredETFs = useMemo(() => {
        let result = filterETFsByCategory(selectedCategory)
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(
                etf => etf.ticker.toLowerCase().includes(query) ||
                    etf.name.toLowerCase().includes(query) ||
                    etf.provider.toLowerCase().includes(query)
            )
        }
        if (sortBy === "ytd") result = [...result].sort((a, b) => b.performance.ytd - a.performance.ytd)
        else if (sortBy === "expense") result = [...result].sort((a, b) => a.expenseRatio - b.expenseRatio)
        else result = [...result].sort((a, b) => a.ticker.localeCompare(b.ticker))
        return result
    }, [selectedCategory, searchQuery, sortBy])

    const handleETFClick = (etf: ETF) => { setSelectedETF(etf); setIsModalOpen(true) }

    return (
        <div className="min-h-screen bg-background">
            <header className="bg-card border-b border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <h1 className="text-3xl font-bold text-foreground">Halal ETF Explorer</h1>
                    <p className="text-muted-foreground mt-2">Discover and compare {etfData.length} Shariah-compliant ETFs</p>
                </div>
            </header>

            <main className={`mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 ${viewMode === "table" ? "max-w-[1600px]" : "max-w-7xl"}`}>
                {/* Info Box */}
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                        <h2 className="font-semibold">What Makes an ETF Halal?</h2>
                        <p className="text-sm text-muted-foreground">Halal ETFs invest in Shariah-compliant companies, excluding alcohol, gambling, pork, conventional finance, and weapons. Companies must also meet financial ratios (debt-to-market cap below 30%).</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                        {etfCategories.map((cat) => (
                            <Button key={cat.id} variant={selectedCategory === cat.id ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(cat.id)}>{cat.label}</Button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="relative flex-1 lg:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Search ETFs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="gap-2 bg-transparent">Sort<ChevronDown className="w-4 h-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSortBy("ytd")}>Best YTD</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortBy("expense")}>Lowest Fees</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortBy("name")}>Alphabetical</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <div className="flex border rounded-lg overflow-hidden">
                            <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")} className="rounded-none"><LayoutGrid className="w-4 h-4" /></Button>
                            <Button variant={viewMode === "table" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("table")} className="rounded-none"><TableIcon className="w-4 h-4" /></Button>
                        </div>
                    </div>
                </div>

                <p className="text-sm text-muted-foreground">Showing {filteredETFs.length} of {etfData.length} ETFs</p>

                {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredETFs.map((etf) => (<ETFCard key={etf.ticker} etf={etf} onClick={() => handleETFClick(etf)} />))}
                    </div>
                ) : (
                    <ETFComparisonTable etfs={filteredETFs} onSelect={handleETFClick} />
                )}

                {filteredETFs.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No ETFs found matching your criteria.</p>
                        <Button variant="link" onClick={() => { setSearchQuery(""); setSelectedCategory("all") }}>Clear filters</Button>
                    </div>
                )}
            </main>

            <ETFDetailModal etf={selectedETF} open={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    )
}
