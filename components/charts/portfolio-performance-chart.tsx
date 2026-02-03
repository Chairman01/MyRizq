"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, TrendingDown } from "lucide-react"

type Period = '1M' | '3M' | '6M' | '1Y' | 'YTD' | 'ALL'

interface PerformanceDataPoint {
    date: string
    value: number
    cost: number
    gain: number
    gainPercent: number
}

interface PortfolioPerformanceChartProps {
    currentValue: number
    currentCost: number
    items: any[]
}

export function PortfolioPerformanceChart({ currentValue, currentCost, items }: PortfolioPerformanceChartProps) {
    const [selectedPeriod, setSelectedPeriod] = useState<Period>('1M')

    // Generate mock historical data based on current portfolio
    // In production, this would come from the database
    const generateHistoricalData = (period: Period): PerformanceDataPoint[] => {
        const now = new Date()
        const data: PerformanceDataPoint[] = []

        let days = 30
        let interval = 1 // daily

        switch (period) {
            case '1M':
                days = 30
                interval = 1
                break
            case '3M':
                days = 90
                interval = 2
                break
            case '6M':
                days = 180
                interval = 5
                break
            case '1Y':
                days = 365
                interval = 7
                break
            case 'YTD':
                const startOfYear = new Date(now.getFullYear(), 0, 1)
                days = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24))
                interval = Math.max(1, Math.floor(days / 50))
                break
            case 'ALL':
                days = 730 // 2 years of data
                interval = 14
                break
        }

        // Generate data points with some realistic variance
        for (let i = days; i >= 0; i -= interval) {
            const date = new Date(now)
            date.setDate(date.getDate() - i)

            // Simulate portfolio growth with some volatility
            const progress = 1 - (i / days)
            const baseGrowth = progress * (currentValue - currentCost)
            const volatility = Math.sin(i / 10) * (currentValue * 0.02) // 2% volatility
            const value = currentCost + baseGrowth + volatility
            const gain = value - currentCost
            const gainPercent = currentCost > 0 ? (gain / currentCost) * 100 : 0

            data.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                value: Math.max(0, value),
                cost: currentCost,
                gain,
                gainPercent
            })
        }

        return data
    }

    const performanceData = useMemo(() => generateHistoricalData(selectedPeriod), [selectedPeriod, currentValue, currentCost])

    const totalGain = currentValue - currentCost
    const totalGainPercent = currentCost > 0 ? (totalGain / currentCost) * 100 : 0
    const isPositive = totalGain >= 0

    const periods: { label: string; value: Period }[] = [
        { label: '1M', value: '1M' },
        { label: '3M', value: '3M' },
        { label: '6M', value: '6M' },
        { label: '1Y', value: '1Y' },
        { label: 'YTD', value: 'YTD' },
        { label: 'All', value: 'ALL' }
    ]

    return (
        <Card className="col-span-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-lg font-medium">Portfolio Performance</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-2xl font-bold">${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            <span>{isPositive ? '+' : ''}{totalGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <span>({totalGainPercent.toFixed(2)}%)</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-1">
                    {periods.map(period => (
                        <Button
                            key={period.value}
                            variant={selectedPeriod === period.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedPeriod(period.value)}
                            className="h-8 px-3"
                        >
                            {period.label}
                        </Button>
                    ))}
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={performanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={isPositive ? "#16a34a" : "#ef4444"} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={isPositive ? "#16a34a" : "#ef4444"} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    padding: '12px'
                                }}
                                formatter={(value: number, name: string) => {
                                    if (name === 'value') return [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Portfolio Value']
                                    if (name === 'cost') return [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Cost Basis']
                                    return [value, name]
                                }}
                            />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={isPositive ? "#16a34a" : "#ef4444"}
                                strokeWidth={2}
                                fill="url(#colorValue)"
                                name="Portfolio Value"
                            />
                            <Line
                                type="monotone"
                                dataKey="cost"
                                stroke="#94a3b8"
                                strokeWidth={1}
                                strokeDasharray="5 5"
                                dot={false}
                                name="Cost Basis"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
