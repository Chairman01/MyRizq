"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts"
import type { ETFPerformance } from "@/lib/etf-data"

interface PerformanceChartProps {
  performance: ETFPerformance
}

export function PerformanceChart({ performance }: PerformanceChartProps) {
  const data = [
    { period: "1M", value: performance.oneMonth },
    { period: "3M", value: performance.threeMonth },
    { period: "6M", value: performance.sixMonth },
    { period: "YTD", value: performance.ytd },
    { period: "1Y", value: performance.oneYear },
    ...(performance.threeYear !== null ? [{ period: "3Y", value: performance.threeYear }] : []),
    ...(performance.fiveYear !== null ? [{ period: "5Y", value: performance.fiveYear }] : []),
    ...(performance.tenYear !== null ? [{ period: "10Y", value: performance.tenYear }] : []),
    { period: "Since Inception", value: performance.sinceInception },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Performance Returns (Annualized)</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const value = payload[0].value as number
                  return (
                    <div className="bg-card p-3 rounded-lg border border-border shadow-lg">
                      <p className="text-sm font-medium">{payload[0].payload.period}</p>
                      <p className={`text-lg font-bold ${value >= 0 ? 'text-accent' : 'text-destructive'}`}>
                        {value >= 0 ? '+' : ''}{value.toFixed(2)}%
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.value >= 0 ? 'oklch(0.55 0.18 145)' : 'oklch(0.55 0.22 25)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
        {data.map((item) => (
          <div
            key={item.period}
            className="p-3 bg-muted/50 rounded-lg text-center"
          >
            <p className="text-xs text-muted-foreground mb-1">{item.period}</p>
            <p className={`text-lg font-bold ${item.value >= 0 ? 'text-accent' : 'text-destructive'}`}>
              {item.value >= 0 ? '+' : ''}{item.value.toFixed(2)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
