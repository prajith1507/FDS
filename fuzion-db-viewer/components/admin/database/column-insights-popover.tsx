/**
 * ColumnInsightsPopover Component
 * Interactive popover showing column statistics, data quality, and distribution charts
 */

"use client"

import React from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  BarChart3,
  AlertTriangle,
  Filter,
  X,
  TrendingUp,
  Database,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type {
  ColumnInsights,
  FilterOperator,
} from "@/lib/types/data-viewer"
import { DataQualityBadge } from "./data-quality-badge"
import { ValueDistributionChart } from "./value-distribution-chart"

interface ColumnInsightsPopoverProps {
  insights: ColumnInsights
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onApplyFilter?: (columnId: string, operator: FilterOperator, value: any) => void
  onRemoveFilter?: (columnId: string) => void
  hasActiveFilter?: boolean
  trigger?: React.ReactNode
}

export const ColumnInsightsPopover = React.memo(
  function ColumnInsightsPopover({
    insights,
    isOpen,
    onOpenChange,
    onApplyFilter,
    onRemoveFilter,
    hasActiveFilter = false,
    trigger,
  }: ColumnInsightsPopoverProps) {
    const handleValueClick = (value: any) => {
      if (!onApplyFilter) return
      
      if (value === null || value === undefined) {
        onApplyFilter(insights.columnId, "isEmpty", null)
      } else if (typeof value === "object" && value.min !== undefined) {
        // Numeric bucket range
        onApplyFilter(insights.columnId, "greaterThanOrEqual", value.min)
      } else {
        onApplyFilter(insights.columnId, "equals", value)
      }
      onOpenChange(false)
    }

    const defaultTrigger = (
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-6 w-6 p-0",
          hasActiveFilter && "text-primary",
          isOpen && "bg-accent"
        )}
        onClick={() => onOpenChange(!isOpen)}
      >
        <BarChart3 className="h-3.5 w-3.5" />
      </Button>
    )

    return (
      <Popover open={isOpen} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>{trigger || defaultTrigger}</PopoverTrigger>
        <PopoverContent
          className="w-[400px] p-0"
          align="start"
          side="bottom"
          sideOffset={5}
        >
          <div className="flex flex-col max-h-[500px]">
            {/* Header */}
            <div className="px-4 py-3 border-b">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm truncate">
                      {insights.columnName}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {insights.dataType}
                    </Badge>
                  </div>
                  <DataQualityBadge quality={insights.quality} />
                </div>
                {hasActiveFilter && onRemoveFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 ml-2"
                    onClick={() => onRemoveFilter(insights.columnId)}
                  >
                    <Filter className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Sampling indicator */}
              {insights.isSampled && (
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Database className="h-3 w-3" />
                  <span>
                    Sampled: {insights.sampleSize?.toLocaleString()} of{" "}
                    {insights.quality.total.toLocaleString()} rows
                  </span>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="px-4 py-3 bg-muted/30 border-b">
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="text-muted-foreground mb-1">Total</div>
                  <div className="font-semibold">
                    {insights.quality.total.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Unique</div>
                  <div className="font-semibold">
                    {insights.quality.unique.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Missing</div>
                  <div className="font-semibold text-red-600">
                    {insights.quality.missing.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Data Issues */}
            {(insights.quality.invalid > 0 || insights.invalidSamples) && (
              <div className="px-4 py-3 bg-red-50 dark:bg-red-950/20 border-b">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-red-900 dark:text-red-200 mb-1">
                      {insights.quality.invalid} Invalid Values
                    </div>
                    {insights.invalidSamples &&
                      insights.invalidSamples.length > 0 && (
                        <div className="text-xs text-red-700 dark:text-red-300">
                          Examples:{" "}
                          {insights.invalidSamples
                            .slice(0, 3)
                            .map((v) => JSON.stringify(v))
                            .join(", ")}
                        </div>
                      )}
                  </div>
                </div>
              </div>
            )}

            {/* Distribution Chart */}
            <ScrollArea className="flex-1">
              <div className="px-4 py-3">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Value Distribution</span>
                  {onApplyFilter && (
                    <span className="text-xs text-muted-foreground">
                      (click to filter)
                    </span>
                  )}
                </div>
                <ValueDistributionChart
                  dataType={insights.dataType}
                  valueDistribution={insights.valueDistribution}
                  numericDistribution={insights.numericDistribution}
                  onValueClick={onApplyFilter ? handleValueClick : undefined}
                  maxHeight={250}
                />
              </div>
            </ScrollArea>

            {/* Footer */}
            {onApplyFilter && (
              <div className="px-4 py-2 border-t bg-muted/30">
                <p className="text-xs text-muted-foreground text-center">
                  Click on any value to apply filter
                </p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    )
  }
)
