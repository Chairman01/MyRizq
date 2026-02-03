"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Award, AlertTriangle } from "lucide-react"

interface PortfolioMetricsCardsProps {
    totalReturn: number
    totalReturnPercent: number
    items: any[]
    marketData: Record<string, any>
}

export function PortfolioMetricsCards({ totalReturn, totalReturnPercent, items, marketData }: PortfolioMetricsCardsProps) {
    // Calculate best and worst performers
    const performers = items
        .filter(item => item.type !== 'Cash')
        .map(item => {
            const currentPrice = marketData[item.ticker]?.price || item.avgPrice || 0
            const value = (item.shares || 0) * currentPrice
            const cost = (item.shares || 0) * (item.avgPrice || 0)
            const gain = value - cost
            const gainPercent = cost > 0 ? (gain / cost) * 100 : 0

            return {
                ticker: item.ticker,
                name: item.name,
                gain,
                gainPercent,
                value
            }
        })
        .filter(p => p.value > 0)

    const bestPerformer = performers.length > 0
        ? performers.reduce((best, current) => current.gainPercent > best.gainPercent ? current : best)
        : null

    const worstPerformer = performers.length > 0
        ? performers.reduce((worst, current) => current.gainPercent < worst.gainPercent ? current : worst)
        : null

    // Calculate volatility (simplified - standard deviation of returns)
    const avgReturn = performers.length > 0
        ? performers.reduce((sum, p) => sum + p.gainPercent, 0) / performers.length
        : 0

    const variance = performers.length > 0
        ? performers.reduce((sum, p) => sum + Math.pow(p.gainPercent - avgReturn, 2), 0) / performers.length
        : 0

    const volatility = Math.sqrt(variance)

    const metrics = [
        {
            title: "Total Return",
            value: `$${totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            subtitle: `${totalReturnPercent >= 0 ? '+' : ''}${totalReturnPercent.toFixed(2)}%`,
            icon: totalReturn >= 0 ? TrendingUp : TrendingDown,
            iconColor: totalReturn >= 0 ? "text-green-600" : "text-red-600",
            bgColor: totalReturn >= 0 ? "bg-green-50" : "bg-red-50"
        },
        {
            title: "Best Performer",
            value: bestPerformer?.ticker || "N/A",
            subtitle: bestPerformer ? `+${bestPerformer.gainPercent.toFixed(2)}%` : "",
            icon: Award,
            iconColor: "text-green-600",
            bgColor: "bg-green-50"
        },
        {
            title: "Worst Performer",
            value: worstPerformer?.ticker || "N/A",
            subtitle: worstPerformer ? `${worstPerformer.gainPercent.toFixed(2)}%` : "",
            icon: AlertTriangle,
            iconColor: "text-red-600",
            bgColor: "bg-red-50"
        },
        {
            title: "Portfolio Volatility",
            value: `${volatility.toFixed(2)}%`,
            subtitle: volatility < 10 ? "Low" : volatility < 20 ? "Moderate" : "High",
            icon: TrendingUp,
            iconColor: volatility < 10 ? "text-green-600" : volatility < 20 ? "text-amber-600" : "text-red-600",
            bgColor: volatility < 10 ? "bg-green-50" : volatility < 20 ? "bg-amber-50" : "bg-red-50"
        }
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric, index) => {
                const Icon = metric.icon
                return (
                    <Card key={index}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                                    <Icon className={`w-4 h-4 ${metric.iconColor}`} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-2xl font-bold">{metric.value}</p>
                                {metric.subtitle && (
                                    <p className={`text-sm font-medium ${metric.iconColor}`}>
                                        {metric.subtitle}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
