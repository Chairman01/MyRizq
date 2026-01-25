"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { ETF } from "@/lib/etf-data"
import { 
  TrendingUp, 
  Wallet, 
  BarChart3, 
  Globe,
  Percent,
} from "lucide-react"

interface StatsOverviewProps {
  etfs: ETF[]
}

export function StatsOverview({ etfs }: StatsOverviewProps) {
  // Calculate aggregate stats
  const avgExpenseRatio = etfs.reduce((sum, etf) => sum + etf.expenseRatio, 0) / etfs.length
  const avgYTD = etfs.reduce((sum, etf) => sum + etf.performance.ytd, 0) / etfs.length
  const bestPerformer = etfs.reduce((best, etf) => 
    etf.performance.ytd > best.performance.ytd ? etf : best
  , etfs[0])
  const lowestExpenseRatio = etfs.reduce((lowest, etf) => 
    etf.expenseRatio < lowest.expenseRatio ? etf : lowest
  , etfs[0])

  const stats = [
    {
      icon: <BarChart3 className="w-5 h-5" />,
      label: "Total ETFs",
      value: etfs.length.toString(),
      sublabel: "Shariah-compliant funds",
      color: "text-primary",
    },
    {
      icon: <Percent className="w-5 h-5" />,
      label: "Avg Expense Ratio",
      value: `${avgExpenseRatio.toFixed(2)}%`,
      sublabel: `Lowest: ${lowestExpenseRatio.ticker} (${lowestExpenseRatio.expenseRatio.toFixed(2)}%)`,
      color: "text-chart-3",
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      label: "Avg YTD Return",
      value: `+${avgYTD.toFixed(2)}%`,
      sublabel: `Best: ${bestPerformer.ticker} (+${bestPerformer.performance.ytd.toFixed(2)}%)`,
      color: "text-accent",
    },
    {
      icon: <Globe className="w-5 h-5" />,
      label: "Markets Covered",
      value: "4",
      sublabel: "US, UK, Canada, Global",
      color: "text-chart-4",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border/50">
          <CardContent className="p-4">
            <div className={`${stat.color} mb-2`}>
              {stat.icon}
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm font-medium text-foreground">{stat.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.sublabel}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
