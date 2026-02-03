"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Info } from "lucide-react"
import { PortfolioItem } from "@/hooks/use-portfolio"

export function FeeAnalyzer({ items }: { items: PortfolioItem[] }) {
    // Calculate total value
    const totalValue = items.reduce((sum, item) => sum + (item.shares! * item.avgPrice!), 0)

    // Calculate weighted average expense ratio
    // (Value * Ratio) / Total Value
    let totalFees = 0
    items.forEach(item => {
        if (item.expenseRatio) {
            // item.expenseRatio is a percentage (e.g. 0.45), so we multiply by 0.01
            const value = (item.shares || 0) * (item.avgPrice || 0)
            const fee = value * (item.expenseRatio / 100)
            totalFees += fee
        }
    })

    const myFee = totalFees
    const conventionalFee = totalValue * 0.02 // 2% benchmark
    const roboFee = totalValue * 0.005 // 0.5% benchmark

    const data = [
        { name: 'My Portfolio', fee: myFee, color: '#16a34a' }, // Green-600
        { name: 'Robo-Advisor', fee: roboFee, color: '#f59e0b' }, // Amber-500
        { name: 'Mutual Fund', fee: conventionalFee, color: '#ef4444' }, // Red-500
    ]

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">Estimated Annual Fees</CardTitle>
                <Info className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" tickFormatter={(val) => `$${val}`} />
                            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                            <Tooltip
                                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Annual Fee']}
                                cursor={{ fill: 'transparent' }}
                            />
                            <Bar dataKey="fee" radius={[0, 4, 4, 0]}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                    <p>You pay approximately <span className="font-bold text-foreground">${myFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> per year in fees.</p>
                    <p className="text-xs mt-1">
                        vs Conventional Mutual Funds (~2%): <span className="text-red-500 font-medium">${conventionalFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
