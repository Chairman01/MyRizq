"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Briefcase } from "lucide-react"
import { PortfolioItem } from "@/hooks/use-portfolio"

export function AssetAllocation({ items }: { items: PortfolioItem[] }) {
    const breakdown = items.reduce((acc, item) => {
        const val = item.shares! * item.avgPrice!
        const type = item.type || 'Stock'
        acc[type] = (acc[type] || 0) + val
        return acc
    }, {} as Record<string, number>)

    const data = Object.entries(breakdown).map(([name, value]) => ({ name, value }))

    // Modern palette
    const COLORS = ['#2563eb', '#16a34a', '#8b5cf6', '#f59e0b', '#ec4899']

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">Asset Allocation</CardTitle>
                <Briefcase className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(val: number) => [`$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Value']} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
