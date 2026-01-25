"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ETFHolding } from "@/lib/etf-data"

interface HoldingsTableProps {
  holdings: ETFHolding[]
}

export function HoldingsTable({ holdings }: HoldingsTableProps) {
  const totalWeight = holdings.reduce((sum, h) => sum + h.weight, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Top 10 Holdings</h3>
        <p className="text-sm text-muted-foreground">
          Top 10 represents {totalWeight.toFixed(1)}% of portfolio
        </p>
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12">#</TableHead>
              <TableHead>Ticker</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Weight</TableHead>
              <TableHead className="w-32">Allocation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holdings.map((holding, index) => (
              <TableRow key={holding.ticker}>
                <TableCell className="font-medium text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell className="font-bold text-primary">
                  {holding.ticker}
                </TableCell>
                <TableCell>{holding.name}</TableCell>
                <TableCell className="text-right font-medium">
                  {holding.weight.toFixed(2)}%
                </TableCell>
                <TableCell>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(holding.weight * 5, 100)}%` }}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
