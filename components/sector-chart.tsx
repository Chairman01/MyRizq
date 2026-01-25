"use client"

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"
import type { SectorAllocation } from "@/lib/etf-data"

interface SectorChartProps {
  sectors: SectorAllocation[]
}

const COLORS = [
  'oklch(0.45 0.15 170)',  // Primary teal
  'oklch(0.55 0.18 145)',  // Accent green
  'oklch(0.6 0.12 250)',   // Blue
  'oklch(0.7 0.15 80)',    // Yellow
  'oklch(0.55 0.22 25)',   // Red
  'oklch(0.65 0.1 300)',   // Purple
  'oklch(0.5 0.12 200)',   // Cyan
  'oklch(0.6 0.15 50)',    // Orange
]

export function SectorChart({ sectors }: SectorChartProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Sector Allocation</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sectors}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="weight"
                nameKey="sector"
              >
                {sectors.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    className="stroke-card stroke-2"
                  />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-card p-3 rounded-lg border border-border shadow-lg">
                        <p className="text-sm font-medium">{payload[0].name}</p>
                        <p className="text-lg font-bold text-primary">
                          {(payload[0].value as number).toFixed(1)}%
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Sector List */}
        <div className="space-y-3">
          {sectors.map((sector, index) => (
            <div key={sector.sector} className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{sector.sector}</span>
                  <span className="text-sm font-bold ml-2">{sector.weight.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-1">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${sector.weight}%`,
                      backgroundColor: COLORS[index % COLORS.length]
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
