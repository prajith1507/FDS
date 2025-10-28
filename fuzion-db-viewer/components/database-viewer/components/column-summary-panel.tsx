"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatWidget } from "./stat-widget"
import { QualityWidget } from "./quality-widget"
import { DistributionWidget } from "./distribution-widget"
import type { ColumnModel } from "../lib/types"

interface ColumnSummaryPanelProps {
  column?: ColumnModel
  onClose: () => void
}

export function ColumnSummaryPanel({ column, onClose }: ColumnSummaryPanelProps) {
  if (!column) return null

  const widgets = column.widgets
  const quality = widgets.quality?.[0]
  const aggregate = widgets.aggregate?.[0]

  return (
    <div className="w-80 border-l border-border bg-card overflow-y-auto">
      <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card p-4">
        <div>
          <h2 className="font-semibold text-foreground">{column.displayName}</h2>
          <p className="text-xs text-muted-foreground">{column.dataType.name}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4 p-4">
        {/* Quality Metrics */}
        {quality && <QualityWidget quality={quality} />}

        {/* Statistics */}
        {aggregate && <StatWidget aggregate={aggregate} dataType={column.dataType.name} />}

        {/* Distribution */}
        {(widgets.discrete || widgets.continuous) && (
          <DistributionWidget discrete={widgets.discrete} continuous={widgets.continuous} />
        )}
      </div>
    </div>
  )
}
