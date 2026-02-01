"use client"

import React, { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ETF, ETFHolding, SectorAllocation } from "@/lib/etf-data"
import {
  X,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Percent,
  BarChart3,
  PieChart,
  Building2,
} from "lucide-react"
import { HoldingsTable } from "./holdings-table"
import { PerformanceChart } from "./performance-chart"
import { SectorChart } from "./sector-chart"

interface ETFDetailModalProps {
  etf: ETF | null
  open: boolean
  onClose: () => void
}

export function ETFDetailModal({ etf, open, onClose }: ETFDetailModalProps) {
  if (!etf) return null

  const isPositiveYTD = etf.performance.ytd >= 0
  const [liveHoldings, setLiveHoldings] = useState<ETFHolding[] | null>(null)
  const [liveSectors, setLiveSectors] = useState<SectorAllocation[] | null>(null)
  const [liveUpdatedAt, setLiveUpdatedAt] = useState<string | null>(null)
  const [isHoldingsLoading, setIsHoldingsLoading] = useState(false)

  useEffect(() => {
    if (!open || !etf) return
    const controller = new AbortController()
    const fetchHoldings = async () => {
      setIsHoldingsLoading(true)
      try {
        const response = await fetch(`/api/etf-holdings?ticker=${encodeURIComponent(etf.ticker)}&listing=${encodeURIComponent(etf.listing)}`, {
          signal: controller.signal
        })
        if (response.ok) {
          const data = await response.json()
          setLiveHoldings(Array.isArray(data.holdings) ? data.holdings : null)
          setLiveSectors(Array.isArray(data.sectors) ? data.sectors : null)
          setLiveUpdatedAt(data.updatedAt || null)
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setLiveHoldings(null)
          setLiveSectors(null)
          setLiveUpdatedAt(null)
        }
      } finally {
        setIsHoldingsLoading(false)
      }
    }
    fetchHoldings()
    return () => controller.abort()
  }, [open, etf])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-screen h-screen max-w-none max-h-none sm:max-w-none sm:max-h-none m-0 rounded-none overflow-y-auto p-0" showCloseButton={false}>
        <DialogHeader className="sticky top-0 bg-card z-10 p-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-primary">{etf.ticker}</span>
                <span className="text-2xl">{etf.listingFlag}</span>
                <Badge variant="default" className="bg-primary text-primary-foreground">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Shariah Compliant
                </Badge>
              </div>
              <DialogTitle className="text-lg font-medium text-foreground">
                {etf.name}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">{etf.description}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              icon={<Percent className="w-4 h-4 text-primary" />}
              label="Expense Ratio"
              value={`${etf.expenseRatio.toFixed(2)}%`}
            />
            <MetricCard
              icon={<Building2 className="w-4 h-4 text-primary" />}
              label="AUM"
              value={etf.aum}
            />
            <MetricCard
              icon={<Calendar className="w-4 h-4 text-primary" />}
              label="Inception"
              value={etf.inceptionDate}
            />
            <MetricCard
              icon={isPositiveYTD ? <TrendingUp className="w-4 h-4 text-accent" /> : <TrendingDown className="w-4 h-4 text-destructive" />}
              label="YTD Return"
              value={`${isPositiveYTD ? '+' : ''}${etf.performance.ytd.toFixed(2)}%`}
              valueClassName={isPositiveYTD ? 'text-accent' : 'text-destructive'}
            />
          </div>

          {/* Fund Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <InfoRow label="Provider" value={etf.provider} />
              <InfoRow label="Benchmark" value={etf.benchmark} />
              <InfoRow label="Focus" value={etf.focus} />
            </div>
            <div className="space-y-2">
              <InfoRow label="Distribution Yield" value={`${etf.distributionYield.toFixed(2)}%`} />
              <InfoRow label="Turnover Rate" value={`${etf.turnoverRate}%`} />
              <InfoRow label="Certification" value={etf.shariahCertification} />
              {etf.esgRating && <InfoRow label="ESG Rating" value={etf.esgRating} />}
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="performance" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="performance" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="holdings" className="gap-2">
                <Building2 className="w-4 h-4" />
                Holdings
              </TabsTrigger>
              <TabsTrigger value="sectors" className="gap-2">
                <PieChart className="w-4 h-4" />
                Sectors
              </TabsTrigger>
            </TabsList>

            <TabsContent value="performance" className="mt-4">
              <PerformanceChart performance={etf.performance} />
            </TabsContent>

            <TabsContent value="holdings" className="mt-4 space-y-2">
              {isHoldingsLoading && (
                <p className="text-xs text-muted-foreground">Refreshing holdings...</p>
              )}
              {liveUpdatedAt && (
                <p className="text-xs text-muted-foreground">
                  Updated {new Date(liveUpdatedAt).toLocaleDateString()}
                </p>
              )}
              <HoldingsTable holdings={liveHoldings ?? etf.holdings} />
            </TabsContent>

            <TabsContent value="sectors" className="mt-4">
              <SectorChart sectors={liveSectors ?? etf.sectorAllocation} />
            </TabsContent>
          </Tabs>

          {/* Disclaimer */}
          <div className="p-4 bg-muted/30 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground">
              <strong>Disclaimer:</strong> Past performance does not guarantee future results.
              The investment return and principal value of an investment will fluctuate so that
              an investor&apos;s shares, when sold or redeemed, may be worth more or less than their
              original cost. Always conduct your own research and consult with qualified professionals.
            </p>
          </div>

          {/* External Link */}
          <Button variant="outline" className="w-full gap-2 bg-transparent" asChild>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(etf.ticker + ' ' + etf.name + ' ETF')}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4" />
              Learn More About {etf.ticker}
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function MetricCard({
  icon,
  label,
  value,
  valueClassName = ''
}: {
  icon: React.ReactNode
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="p-4 bg-card rounded-lg border border-border">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={`text-xl font-bold ${valueClassName}`}>{value}</p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  )
}
