/**
 * ColumnHeader Component
 * Interactive column header with sorting, filtering, and statistics
 */

"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ColumnSchema, SortDirection, ColumnInsights, FilterOperator } from "@/lib/types/data-viewer"
import { cn } from "@/lib/utils"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  Filter,
  Hash,
  Calendar,
  Type,
  ToggleLeft,
  Braces,
  List,
} from "lucide-react"
import { ColumnInsightsPopover } from "./column-insights-popover"
import { DataQualityBadge } from "./data-quality-badge"

interface ColumnHeaderProps {
  column: ColumnSchema
  sortState?: { columnId: string; direction: SortDirection } | null
  onSort?: (columnId: string, direction: SortDirection) => void
  onFilter?: (columnId: string) => void
  showStats?: boolean
  className?: string
  // New props for insights
  insights?: ColumnInsights
  onApplyFilter?: (columnId: string, operator: FilterOperator, value: any) => void
  onRemoveFilter?: (columnId: string) => void
  hasActiveFilter?: boolean
}

export function ColumnHeader({
  column,
  sortState,
  onSort,
  onFilter,
  showStats = true,
  className,
  insights,
  onApplyFilter,
  onRemoveFilter,
  hasActiveFilter = false,
}: ColumnHeaderProps) {
  const [insightsOpen, setInsightsOpen] = useState(false)
  const isSorted = sortState?.columnId === column.id
  const sortDirection = isSorted ? sortState.direction : null

  const handleSort = (direction: SortDirection) => {
    if (column.sortable && onSort) {
      onSort(column.id, direction)
    }
  }

  const handleFilter = () => {
    if (column.filterable && onFilter) {
      onFilter(column.id)
    }
  }

  const handleApplyFilter = (columnId: string, operator: FilterOperator, value: any) => {
    if (onApplyFilter) {
      onApplyFilter(columnId, operator, value)
    }
  }

  const getTypeIcon = () => {
    switch (column.type) {
      case 'string':
        return <Type className="h-3 w-3" />
      case 'number':
        return <Hash className="h-3 w-3" />
      case 'boolean':
        return <ToggleLeft className="h-3 w-3" />
      case 'date':
        return <Calendar className="h-3 w-3" />
      case 'object':
        return <Braces className="h-3 w-3" />
      case 'array':
        return <List className="h-3 w-3" />
      default:
        return null
    }
  }

  const getTypeColor = () => {
    switch (column.type) {
      case 'string':
        return 'text-blue-500'
      case 'number':
        return 'text-green-500'
      case 'boolean':
        return 'text-purple-500'
      case 'date':
        return 'text-orange-500'
      case 'object':
      case 'array':
        return 'text-pink-500'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between h-full px-3 py-2 border-b bg-muted/50 group",
        className
      )}
    >
      {/* Left side: Name and Type */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn("flex-shrink-0", getTypeColor())}>
                {getTypeIcon()}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <span className="text-xs capitalize">{column.type}</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <span className="font-semibold text-sm truncate">{column.name}</span>

        {/* Data Quality Badge - Always Visible */}
        {insights && (
          <DataQualityBadge quality={insights.quality} compact={true} />
        )}

        {/* Stats Badge */}
        {showStats && column.stats && !insights && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                  {column.stats.uniqueCount}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="text-xs space-y-1">
                  <div className="font-semibold">Column Statistics</div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Total:</span>
                    <span>{column.stats.count}</span>
                    <span className="text-muted-foreground">Unique:</span>
                    <span>{column.stats.uniqueCount}</span>
                    <span className="text-muted-foreground">Null:</span>
                    <span>{column.stats.nullCount}</span>
                  </div>

                  {column.stats.numericStats && (
                    <>
                      <div className="font-semibold mt-2">Numeric Stats</div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-muted-foreground">Min:</span>
                        <span>{column.stats.numericStats.min.toLocaleString()}</span>
                        <span className="text-muted-foreground">Max:</span>
                        <span>{column.stats.numericStats.max.toLocaleString()}</span>
                        <span className="text-muted-foreground">Avg:</span>
                        <span>{column.stats.numericStats.avg.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  {column.stats.stringStats && (
                    <>
                      <div className="font-semibold mt-2">String Stats</div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-muted-foreground">Min Length:</span>
                        <span>{column.stats.stringStats.minLength}</span>
                        <span className="text-muted-foreground">Max Length:</span>
                        <span>{column.stats.stringStats.maxLength}</span>
                        <span className="text-muted-foreground">Avg Length:</span>
                        <span>{column.stats.stringStats.avgLength.toFixed(1)}</span>
                      </div>
                    </>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-1">
        {/* Column Insights Button - Always Visible */}
        {showStats && insights && (
          <ColumnInsightsPopover
            insights={insights}
            isOpen={insightsOpen}
            onOpenChange={setInsightsOpen}
            onApplyFilter={handleApplyFilter}
            onRemoveFilter={onRemoveFilter}
            hasActiveFilter={hasActiveFilter}
          />
        )}

        {/* Sort Button - Show on Hover */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          {column.sortable && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                >
                  {sortDirection === 'asc' ? (
                    <ArrowUp className="h-3.5 w-3.5" />
                  ) : sortDirection === 'desc' ? (
                    <ArrowDown className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleSort('asc')}>
                  <ArrowUp className="h-4 w-4 mr-2" />
                  Ascending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('desc')}>
                  <ArrowDown className="h-4 w-4 mr-2" />
                  Descending
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Filter Button */}
          {column.filterable && !insights && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={handleFilter}
            >
              <Filter className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
