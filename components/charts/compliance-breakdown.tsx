"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Info } from "lucide-react"
import { PortfolioItem } from "@/hooks/use-portfolio"

import { screenStock } from "@/lib/stock-data"

const getStatus = (item: PortfolioItem) => {
    // 1. ETFs are generally considered safe/compliant in this model
    if (item.type === 'ETF') return 'Shariah Compliant'

    // 2. Check Database via screenStock
    const result = screenStock(item.ticker)
    if (result) {
        if (result.overallStatus === 'Compliant') return 'Shariah Compliant'
        if (result.overallStatus === 'Non-Compliant') return 'Non-Shariah Compliant'
        return result.overallStatus // Questionable remains same
    }

    // 3. Fallback - If it's a stock and not in our DB, we treat it as Non-Compliant/Unknown but mark as Non-Compliant to match table strictness
    return 'Non-Shariah Compliant'
}

export function ComplianceBreakdown({ items }: { items: PortfolioItem[] }) {
    const breakdown = items.reduce((acc, item) => {
        const val = (item.shares || 0) * (item.avgPrice || 0)
        const status = getStatus(item)

        acc[status] = (acc[status] || 0) + val
        return acc
    }, {} as Record<string, number>)

    const data = Object.entries(breakdown).map(([name, value]) => ({ name, value }))
    const COLORS = {
        'Shariah Compliant': '#16a34a', // Green
        'Questionable': '#f59e0b', // Amber
        'Non-Shariah Compliant': '#ef4444', // Red
        'Unknown': '#94a3b8' // Slate
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">Shariah Compliance</CardTitle>
                <Info className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#94a3b8'} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(val: number) => `$${val.toFixed(2)}`} />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
