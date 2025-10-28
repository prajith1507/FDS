/**
 * ValueDistributionChart Component
 * Smart chart renderer that adapts based on data type and cardinality
 */

"use client"

import React, { useMemo } from "react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type {
  ValueDistribution,
  NumericDistribution,
  ColumnDataType,
} from "@/lib/types/data-viewer"

interface ValueDistributionChartProps {
  dataType: ColumnDataType
  valueDistribution?: ValueDistribution[]
  numericDistribution?: NumericDistribution
  onValueClick?: (value: any) => void
  maxHeight?: number
}

export const ValueDistributionChart = React.memo(
  function ValueDistributionChart({
    dataType,
    valueDistribution,
    numericDistribution,
    onValueClick,
    maxHeight = 300,
  }: ValueDistributionChartProps) {
    // Render numeric histogram
    if (dataType === "number" && numericDistribution) {
      return (
        <NumericHistogram
          distribution={numericDistribution}
          onBucketClick={onValueClick}
        />
      )
    }

    // Render categorical distribution
    if (valueDistribution && valueDistribution.length > 0) {
      // Show list view for small number of values
      if (valueDistribution.length <= 5) {
        return (
          <CategoricalList
            distribution={valueDistribution}
            onValueClick={onValueClick}
          />
        )
      }

      // Show bar chart for larger number of values
      return (
        <CategoricalBarChart
          distribution={valueDistribution}
          onValueClick={onValueClick}
          maxHeight={maxHeight}
        />
      )
    }

    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No distribution data available
      </div>
    )
  }
)

/**
 * Numeric Histogram Component
 */
function NumericHistogram({
  distribution,
  onBucketClick,
}: {
  distribution: NumericDistribution
  onBucketClick?: (value: any) => void
}) {
  const maxCount = Math.max(...distribution.buckets.map((b) => b.count))

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-xs mb-3 pb-3 border-b">
        <div>
          <span className="text-muted-foreground">Min:</span>{" "}
          <span className="font-mono">{distribution.min.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Max:</span>{" "}
          <span className="font-mono">{distribution.max.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Avg:</span>{" "}
          <span className="font-mono">{distribution.avg.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Median:</span>{" "}
          <span className="font-mono">{distribution.median.toFixed(2)}</span>
        </div>
      </div>

      <ScrollArea className="max-h-[200px]">
        <div className="space-y-2">
          {distribution.buckets.map((bucket, index) => {
            const heightPercentage = (bucket.count / maxCount) * 100

            return (
              <div
                key={index}
                className={cn(
                  "group p-2 rounded-md hover:bg-accent/50 transition-colors",
                  onBucketClick && "cursor-pointer"
                )}
                onClick={() => onBucketClick?.(bucket)}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-mono text-muted-foreground">
                    {bucket.range}
                  </span>
                  <span className="font-medium">{bucket.count}</span>
                </div>
                <div className="relative h-6 bg-secondary rounded overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-primary transition-all"
                    style={{ width: `${heightPercentage}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-primary-foreground mix-blend-difference">
                    {bucket.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

/**
 * Categorical Bar Chart Component
 */
function CategoricalBarChart({
  distribution,
  onValueClick,
  maxHeight,
}: {
  distribution: ValueDistribution[]
  onValueClick?: (value: any) => void
  maxHeight: number
}) {
  const maxCount = Math.max(...distribution.map((d) => d.count))

  return (
    <ScrollArea style={{ maxHeight }}>
      <div className="space-y-2">
        {distribution.map((item, index) => {
          const widthPercentage = (item.count / maxCount) * 100
          const isEmptyValue = item.value === null || item.value === undefined

          return (
            <div
              key={index}
              className={cn(
                "group p-2 rounded-md hover:bg-accent/50 transition-colors",
                onValueClick && "cursor-pointer"
              )}
              onClick={() => onValueClick?.(item.value)}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span
                  className={cn(
                    "font-medium truncate max-w-[200px]",
                    isEmptyValue && "text-muted-foreground italic"
                  )}
                  title={item.label}
                >
                  {item.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-muted-foreground">
                    {item.count.toLocaleString()}
                  </span>
                  <span className="font-medium text-primary min-w-[45px] text-right">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="relative h-5 bg-secondary rounded-sm overflow-hidden">
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 transition-all",
                    isEmptyValue ? "bg-muted-foreground/30" : "bg-primary"
                  )}
                  style={{ width: `${widthPercentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}

/**
 * Categorical List Component (for small number of unique values)
 */
function CategoricalList({
  distribution,
  onValueClick,
}: {
  distribution: ValueDistribution[]
  onValueClick?: (value: any) => void
}) {
  return (
    <div className="space-y-2">
      {distribution.map((item, index) => {
        const isEmptyValue = item.value === null || item.value === undefined

        return (
          <div
            key={index}
            className={cn(
              "flex items-center justify-between p-3 rounded-md border",
              "hover:bg-accent/50 transition-colors",
              onValueClick && "cursor-pointer"
            )}
            onClick={() => onValueClick?.(item.value)}
          >
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  isEmptyValue ? "bg-muted-foreground/30" : "bg-primary"
                )}
              />
              <span
                className={cn(
                  "text-sm font-medium",
                  isEmptyValue && "text-muted-foreground italic"
                )}
              >
                {item.label}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono text-muted-foreground">
                {item.count.toLocaleString()}
              </span>
              <Badge variant="secondary" className="min-w-[55px] justify-center">
                {item.percentage.toFixed(1)}%
              </Badge>
            </div>
          </div>
        )
      })}
    </div>
  )
}
