"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { ETF } from "@/lib/etf-data"
import { TrendingUp, TrendingDown, Globe, Building, ChevronRight } from "lucide-react"

interface ETFCardProps {
  etf: ETF
  onClick: () => void
}

export function ETFCard({ etf, onClick }: ETFCardProps) {
  const isPositiveYTD = etf.performance.ytd >= 0

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-primary/30 group"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary">{etf.ticker}</span>
              <span className="text-lg">{etf.listingFlag}</span>
            </div>
            <h3 className="text-sm font-medium text-foreground leading-tight line-clamp-2">
              {etf.name}
            </h3>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">
            <Globe className="w-3 h-3 mr-1" />
            {etf.focus}
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Building className="w-3 h-3 mr-1" />
            {etf.provider}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Expense Ratio</p>
            <p className="text-lg font-semibold">{etf.expenseRatio.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">AUM</p>
            <p className="text-lg font-semibold">{etf.aum}</p>
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">YTD Return</span>
            <div className={`flex items-center gap-1 ${isPositiveYTD ? 'text-accent' : 'text-destructive'}`}>
              {isPositiveYTD ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="text-lg font-bold">
                {isPositiveYTD ? '+' : ''}{etf.performance.ytd.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <p className="text-xs text-muted-foreground line-clamp-2">{etf.description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
