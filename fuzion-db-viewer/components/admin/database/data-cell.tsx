/**
 * DataCell Component
 * Smart cell renderer with type-aware formatting and visualizations
 */

"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ColumnDataType, ColumnStatistics } from "@/lib/types/data-viewer"
import { formatValue, getPercentage, truncateText } from "@/lib/utils/data-viewer-utils"
import { cn } from "@/lib/utils"
import { Copy, ExternalLink } from "lucide-react"
import { useState } from "react"

interface DataCellProps {
  value: any
  type: ColumnDataType
  columnStats?: ColumnStatistics
  showVisualization?: boolean
  maxLength?: number
  className?: string
}

export function DataCell({
  value,
  type,
  columnStats,
  showVisualization = true,
  maxLength = 50,
  className,
}: DataCellProps) {
  const [copied, setCopied] = useState(false)

  // Handle null/undefined
  if (value === null || value === undefined) {
    return (
      <div className={cn("flex items-center h-full py-2 px-3", className)}>
        <Badge variant="outline" className="text-xs text-muted-foreground">
          {value === null ? 'null' : 'undefined'}
        </Badge>
      </div>
    )
  }

  // Handle boolean
  if (type === 'boolean') {
    return (
      <div className={cn("flex items-center h-full py-2 px-3", className)}>
        <Badge variant={value ? 'default' : 'secondary'} className="text-xs">
          {value ? 'true' : 'false'}
        </Badge>
      </div>
    )
  }

  // Handle number with visualization
  if (type === 'number' && showVisualization && columnStats?.numericStats) {
    const { min, max } = columnStats.numericStats
    const percentage = getPercentage(Number(value), min, max)

    return (
      <div className={cn("relative h-full py-2 px-3", className)}>
        {/* Background bar */}
        <div
          className="absolute left-0 top-0 h-full bg-primary/10 transition-all"
          style={{ width: `${percentage}%` }}
        />
        {/* Value */}
        <div className="relative z-10 flex items-center justify-between h-full">
          <span className="font-mono text-sm">
            {Number(value).toLocaleString()}
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                  onClick={() => {
                    navigator.clipboard.writeText(String(value))
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {copied ? 'Copied!' : 'Copy value'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    )
  }

  // Handle date
  if (type === 'date') {
    const dateObj = new Date(value)
    const formattedDate = dateObj.toLocaleDateString()
    const formattedTime = dateObj.toLocaleTimeString()

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("flex items-center h-full py-2 px-3 cursor-help", className)}>
              <span className="text-sm">{formattedDate}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs space-y-1">
              <div>{formattedDate} {formattedTime}</div>
              <div className="text-muted-foreground">{dateObj.toISOString()}</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Handle object/array
  if (type === 'object' || type === 'array') {
    const jsonStr = JSON.stringify(value, null, 2)
    const preview = truncateText(JSON.stringify(value), 30)

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("flex items-center h-full py-2 px-3 group cursor-help", className)}>
              <Badge variant="secondary" className="text-xs font-mono mr-2">
                {type === 'array' ? `[${(value as any[]).length}]` : '{...}'}
              </Badge>
              <span className="text-sm text-muted-foreground truncate flex-1">
                {preview}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 ml-1 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  navigator.clipboard.writeText(jsonStr)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-md">
            <pre className="text-xs overflow-auto max-h-96">
              {jsonStr}
            </pre>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Handle string (default)
  const stringValue = String(value)
  const isTruncated = stringValue.length > maxLength
  const displayValue = isTruncated ? truncateText(stringValue, maxLength) : stringValue

  // Check if it's a URL
  const isURL = /^https?:\/\//i.test(stringValue)

  return (
    <div className={cn("flex items-center h-full py-2 px-3 group", className)}>
      {isURL ? (
        <a
          href={stringValue}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline flex items-center gap-1 truncate"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="truncate">{displayValue}</span>
          <ExternalLink className="h-3 w-3 flex-shrink-0" />
        </a>
      ) : isTruncated ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-sm truncate cursor-help">{displayValue}</span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-md">
              <div className="text-xs whitespace-pre-wrap break-words">
                {stringValue}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <span className="text-sm">{displayValue}</span>
      )}
      
      {!isURL && (
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 ml-auto opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation()
            navigator.clipboard.writeText(stringValue)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
        >
          <Copy className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
