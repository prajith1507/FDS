"use client"

import { Card } from "@/components/ui/card"

interface StatWidgetProps {
  aggregate: any
  dataType: string
}

export function StatWidget({ aggregate, dataType }: StatWidgetProps) {
  const formatValue = (value: any) => {
    if (dataType === "currency") {
      return typeof value === "string" ? value : `$${Number.parseFloat(value).toFixed(2)}`
    }
    if (dataType === "number") {
      return typeof value === "number" ? value.toFixed(2) : value
    }
    return value
  }

  return (
    <Card className="p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Statistics</h3>
      <div className="space-y-2">
        {aggregate.min && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Min</span>
            <span className="font-medium text-foreground">{formatValue(aggregate.min)}</span>
          </div>
        )}
        {aggregate.max && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Max</span>
            <span className="font-medium text-foreground">{formatValue(aggregate.max)}</span>
          </div>
        )}
        {aggregate.avg && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Average</span>
            <span className="font-medium text-foreground">{formatValue(aggregate.avg)}</span>
          </div>
        )}
        {aggregate.mode && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Mode</span>
            <span className="font-medium text-foreground truncate">{aggregate.mode}</span>
          </div>
        )}
        {aggregate.categories && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Categories</span>
            <span className="font-medium text-foreground">{aggregate.categories}</span>
          </div>
        )}
      </div>
    </Card>
  )
}
