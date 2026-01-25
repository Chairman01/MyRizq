"use client"

import { useState, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { ETF } from "@/lib/etf-data"
import { TrendingUp, TrendingDown, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

interface ETFComparisonTableProps {
  etfs: ETF[]
  onSelect: (etf: ETF) => void
}

type SortField = "ticker" | "provider" | "name" | "expense" | "aum" | "ytd" | "oneYear" | "threeYear" | "yield" | null
type SortDirection = "asc" | "desc"

function parseAUM(aum: string): number {
  // Parse AUM like "$1.92B", "$598M", "$185M CAD" to a number for sorting
  const cleaned = aum.replace(/[^0-9.BMK]/gi, '')
  const match = cleaned.match(/([0-9.]+)([BMK])?/i)
  if (!match) return 0
  const value = parseFloat(match[1])
  const suffix = (match[2] || '').toUpperCase()
  if (suffix === 'B') return value * 1000000000
  if (suffix === 'M') return value * 1000000
  if (suffix === 'K') return value * 1000
  return value
}

export function ETFComparisonTable({ etfs, onSelect }: ETFComparisonTableProps) {
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc") // Default to descending for most columns
    }
  }

  const sortedETFs = useMemo(() => {
    if (!sortField) return etfs

    return [...etfs].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case "ticker":
          comparison = a.ticker.localeCompare(b.ticker)
          break
        case "provider":
          comparison = a.provider.localeCompare(b.provider)
          break
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "expense":
          comparison = a.expenseRatio - b.expenseRatio
          break
        case "aum":
          comparison = parseAUM(a.aum) - parseAUM(b.aum)
          break
        case "ytd":
          comparison = a.performance.ytd - b.performance.ytd
          break
        case "oneYear":
          comparison = a.performance.oneYear - b.performance.oneYear
          break
        case "threeYear":
          comparison = (a.performance.threeYear ?? 0) - (b.performance.threeYear ?? 0)
          break
        case "yield":
          comparison = a.distributionYield - b.distributionYield
          break
      }

      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [etfs, sortField, sortDirection])

  const SortableHeader = ({ field, children, className = "" }: { field: SortField, children: React.ReactNode, className?: string }) => (
    <TableHead
      className={`cursor-pointer hover:bg-muted/70 transition-colors select-none ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1 justify-end">
        <span>{children}</span>
        {sortField === field ? (
          sortDirection === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-40" />
        )}
      </div>
    </TableHead>
  )

  return (
    <div className="rounded-lg border border-border overflow-hidden w-full">
      <div className="overflow-x-auto">
        <Table className="w-full min-w-[1200px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="sticky left-0 bg-muted/50 z-10 w-[80px]">Ticker</TableHead>
              <TableHead className="w-[120px]">Owner</TableHead>
              <TableHead className="min-w-[280px]">Name</TableHead>
              <TableHead className="w-[180px]">Focus</TableHead>
              <TableHead className="text-center w-[80px]">Listing</TableHead>
              <SortableHeader field="expense" className="text-right w-[120px]">Expense Ratio</SortableHeader>
              <SortableHeader field="aum" className="text-right w-[120px]">AUM</SortableHeader>
              <SortableHeader field="ytd" className="text-right w-[100px]">YTD</SortableHeader>
              <SortableHeader field="oneYear" className="text-right w-[100px]">1Y</SortableHeader>
              <SortableHeader field="threeYear" className="text-right w-[100px]">3Y</SortableHeader>
              <SortableHeader field="yield" className="text-right w-[100px]">Yield</SortableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedETFs.map((etf) => {
              const isPositiveYTD = etf.performance.ytd >= 0
              const isPositive1Y = etf.performance.oneYear >= 0
              const isPositive3Y = (etf.performance.threeYear ?? 0) >= 0

              return (
                <TableRow
                  key={etf.ticker}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onSelect(etf)}
                >
                  <TableCell className="sticky left-0 bg-card z-10 font-bold text-primary">
                    {etf.ticker}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {etf.provider}
                  </TableCell>
                  <TableCell className="font-medium">
                    <span className="line-clamp-1">{etf.name}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs whitespace-nowrap">
                      {etf.focus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-lg">
                    {etf.listingFlag}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {etf.expenseRatio.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {etf.aum}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={`flex items-center justify-end gap-1 ${isPositiveYTD ? 'text-accent' : 'text-destructive'}`}>
                      {isPositiveYTD ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span className="font-medium">
                        {isPositiveYTD ? '+' : ''}{etf.performance.ytd.toFixed(2)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-medium ${isPositive1Y ? 'text-accent' : 'text-destructive'}`}>
                      {isPositive1Y ? '+' : ''}{etf.performance.oneYear.toFixed(2)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-medium ${isPositive3Y ? 'text-accent' : 'text-destructive'}`}>
                      {(etf.performance.threeYear ?? 0) > 0 ? `+${(etf.performance.threeYear ?? 0).toFixed(2)}%` : 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {etf.distributionYield.toFixed(2)}%
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

