"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { ArrowUpDown } from "lucide-react"

interface GainLossBreakdownProps {
    items: any[]
    marketData: Record<string, any>
}

export function GainLossBreakdown({ items, marketData }: GainLossBreakdownProps) {
    const [sortBy, setSortBy] = useState<'amount' | 'percent'>('amount')

    const performanceData = useMemo(() => {
        return items
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
                    value,
                    cost
                }
            })
            .filter(p => p.value > 0)
            .sort((a, b) => {
                if (sortBy === 'amount') {
                    return b.gain - a.gain
                } else {
                    return b.gainPercent - a.gainPercent
                }
            })
            .slice(0, 10) // Top 10
    }, [items, marketData, sortBy])

    if (performanceData.length === 0) {
        return null
    }

    return (
        <Card className="col-span-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">Top Holdings Performance</CardTitle>
                <div className="flex gap-2">
                    <Button
                        variant={sortBy === 'amount' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSortBy('amount')}
                    >
                        By Amount
                    </Button>
                    <Button
                        variant={sortBy === 'percent' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSortBy('percent')}
                    >
                        By %
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={performanceData}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis
                                type="number"
                                tickFormatter={(value) => sortBy === 'amount'
                                    ? `$${(value / 1000).toFixed(1)}k`
                                    : `${value.toFixed(0)}%`
                                }
                            />
                            <YAxis
                                type="category"
                                dataKey="ticker"
                                width={90}
                                tick={{ fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    padding: '12px'
                                }}
                                formatter={(value: number, name: string, props: any) => {
                                    const item = props.payload
                                    return [
                                        <div key="tooltip" className="space-y-1">
                                            <p className="font-semibold">{item.ticker}</p>
                                            <p className="text-sm text-muted-foreground">{item.name}</p>
                                            <p className={`font-medium ${item.gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {item.gain >= 0 ? '+' : ''}${item.gain.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </p>
                                            <p className={`text-sm ${item.gainPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {item.gainPercent >= 0 ? '+' : ''}{item.gainPercent.toFixed(2)}%
                                            </p>
                                        </div>,
                                        ''
                                    ]
                                }}
                                cursor={{ fill: 'transparent' }}
                            />
                            <Bar
                                dataKey={sortBy === 'amount' ? 'gain' : 'gainPercent'}
                                radius={[0, 4, 4, 0]}
                            >
                                {performanceData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.gain >= 0 ? '#16a34a' : '#ef4444'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
