/**
 * DataQualityBadge Component
 * Visual indicator for data quality metrics with color-coded status
 */

"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react"
import type { DataQualityMetrics } from "@/lib/types/data-viewer"
import { getQualityColor } from "@/lib/utils/data-viewer-utils"

interface DataQualityBadgeProps {
  quality: DataQualityMetrics
  compact?: boolean
}

export const DataQualityBadge = React.memo(function DataQualityBadge({
  quality,
  compact = false,
}: DataQualityBadgeProps) {
  const getIcon = (percentage: number) => {
    if (percentage >= 90)
      return <CheckCircle className="h-3 w-3 text-green-600" />
    if (percentage >= 70)
      return <AlertTriangle className="h-3 w-3 text-yellow-600" />
    return <AlertCircle className="h-3 w-3 text-red-600" />
  }

  const getBadgeVariant = (percentage: number) => {
    if (percentage >= 90) return "default"
    if (percentage >= 70) return "secondary"
    return "destructive"
  }

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="flex items-center gap-1 cursor-pointer">
              {getIcon(quality.completeness)}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            <div className="space-y-1">
              <div className="font-semibold">Data Quality</div>
              <div>Completeness: {quality.completeness.toFixed(1)}%</div>
              <div>Validity: {quality.validity.toFixed(1)}%</div>
              <div>Uniqueness: {quality.uniqueness.toFixed(1)}%</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge
              variant={getBadgeVariant(quality.completeness)}
              className="h-5 px-1.5 text-xs font-normal cursor-pointer"
            >
              {getIcon(quality.completeness)}
              <span className="ml-1">{quality.completeness.toFixed(0)}%</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            <div>
              Completeness: {quality.valid} / {quality.total} values
            </div>
            <div className="text-muted-foreground">
              {quality.missing} missing
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {quality.invalid > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="destructive" className="h-5 px-1.5 text-xs font-normal cursor-pointer">
                <AlertCircle className="h-3 w-3" />
                <span className="ml-1">{quality.invalid}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {quality.invalid} invalid values detected
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {quality.duplicates > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="h-5 px-1.5 text-xs font-normal">
                {quality.unique} unique
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {quality.duplicates} duplicate values
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
})
