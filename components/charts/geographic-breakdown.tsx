"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Globe } from "lucide-react"
import { PortfolioItem } from "@/hooks/use-portfolio"

// Mock geo data helper
const getCountry = (ticker: string) => {
    if (['SPUS', 'HLAL', 'SPTE', 'SPSK', 'AAPL', 'MSFT'].some(s => ticker.includes(s))) return 'United States'
    if (['IGDA', 'UMMA'].some(s => ticker.includes(s))) return 'International'
    if (['SGLN', 'GLDM'].some(s => ticker.includes(s))) return 'Commodities'
    return 'Other'
}

export function GeographicBreakdown({ items }: { items: PortfolioItem[] }) {
    const breakdown = items.reduce((acc, item) => {
        const val = item.shares! * item.avgPrice!
        const section = getCountry(item.ticker)
        acc[section] = (acc[section] || 0) + val
        return acc
    }, {} as Record<string, number>)

    const data = Object.entries(breakdown).map(([name, value]) => ({ name, value }))
    const COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#6366f1']

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">Geographic Exposure</CardTitle>
                <Globe className="w-4 h-4 text-muted-foreground" />
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
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(val: number) => [`$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Value']} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
