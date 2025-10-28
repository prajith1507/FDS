/**
 * StatisticsPanel Component
 * Display data statistics and insights
 */

"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ColumnSchema } from "@/lib/types/data-viewer"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  Database,
  Layers,
  Hash,
} from "lucide-react"

interface StatisticsPanelProps {
  totalRecords: number
  filteredRecords: number
  columns: ColumnSchema[]
  className?: string
}

export function StatisticsPanel({
  totalRecords,
  filteredRecords,
  columns,
  className,
}: StatisticsPanelProps) {
  const visibleColumns = columns.filter(c => c.visible).length
  const totalColumns = columns.length

  // Calculate type distribution
  const typeDistribution = columns.reduce((acc, col) => {
    acc[col.type] = (acc[col.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const stats = [
    {
      label: "Total Records",
      value: totalRecords.toLocaleString(),
      icon: Database,
      color: "text-blue-500",
    },
    {
      label: "Filtered Records",
      value: filteredRecords.toLocaleString(),
      icon: BarChart3,
      color: "text-green-500",
      visible: filteredRecords !== totalRecords,
    },
    {
      label: "Columns",
      value: `${visibleColumns} / ${totalColumns}`,
      icon: Layers,
      color: "text-purple-500",
    },
    {
      label: "Data Types",
      value: Object.keys(typeDistribution).length,
      icon: Hash,
      color: "text-orange-500",
    },
  ]

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      {stats.map((stat, index) => {
        if (stat.visible === false) return null

        const Icon = stat.icon

        return (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-muted", stat.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">
                    {stat.label}
                  </p>
                  <p className="text-xl font-bold truncate">
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
