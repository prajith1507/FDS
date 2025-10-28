"use client"

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts"
import { Card } from "@/components/ui/card"

interface DistributionWidgetProps {
  discrete?: any[]
  continuous?: any[]
}

export function DistributionWidget({ discrete, continuous }: DistributionWidgetProps) {
  const data = discrete || continuous || []

  if (data.length === 0) return null

  const chartData = data.slice(0, 10).map((item: any) => ({
    label: item.label.substring(0, 12),
    count: item.count,
  }))

  return (
    <Card className="p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{discrete ? "Top Values" : "Distribution"}</h3>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
              {chartData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#3b82f6" : "#60a5fa"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
