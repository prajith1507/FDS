"use client"

import { BarChart, Bar, ResponsiveContainer, Cell, Tooltip } from "recharts"
import type { ColumnModel } from "../lib/types"

interface MiniChartProps {
  column: ColumnModel
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-slate-900 text-white px-2 py-1 rounded text-xs shadow-lg border border-slate-700">
        <p className="font-semibold">{data.label}</p>
        <p className="text-blue-300">Count: {data.count}</p>
      </div>
    )
  }
  return null
}

export function MiniChart({ column }: MiniChartProps) {
  const widgets = column.widgets

  // Handle discrete data (bar chart)
  if (widgets.discrete && widgets.discrete.length > 0) {
    const data = widgets.discrete.slice(0, 8).map((item: any) => ({
      fullLabel: item.label,
      label: item.label.substring(0, 8),
      count: item.count,
    }))

    return (
      <div className="h-12 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(59, 130, 246, 0.1)" }} />
            <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]}>
              {data.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#3b82f6" : "#60a5fa"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Handle continuous data (histogram)
  if (widgets.continuous && widgets.continuous.length > 0) {
    const data = widgets.continuous.map((item: any) => ({
      label: item.label,
      count: item.count,
    }))

    return (
      <div className="h-12 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(16, 185, 129, 0.1)" }} />
            <Bar dataKey="count" fill="#10b981" radius={[2, 2, 0, 0]}>
              {data.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#10b981" : "#34d399"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return null
}
