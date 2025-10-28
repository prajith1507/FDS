"use client"

import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { MiniChart } from "./mini-chart"
import { ColumnHeaderTooltip } from "./column-header-tooltip"
import type { ColumnModel } from "../lib/types"
import { useState } from "react"

interface ColumnHeaderProps {
  column: ColumnModel
  isSelected: boolean
  onSelect: () => void
  onSort: () => void
  isSorted: boolean
  sortDirection?: "asc" | "desc"
}

export function ColumnHeader({ column, isSelected, onSelect, onSort, isSorted, sortDirection }: ColumnHeaderProps) {
  const hasWidgets = column.widgets && Object.keys(column.widgets).length > 0
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)

  return (
    <th
      className={cn(
        "border-r border-border px-4 py-2 text-left relative w-[180px]",
        isSelected && "bg-blue-50 dark:bg-blue-950/20",
      )}
      onMouseEnter={() => setIsTooltipVisible(true)}
      onMouseLeave={() => setIsTooltipVisible(false)}
    >
      {isTooltipVisible && <ColumnHeaderTooltip column={column} />}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <button onClick={onSelect} className="flex-1 text-left min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground truncate">{column.displayName}</span>
              <span className="text-xs text-muted-foreground shrink-0">{column.dataType.name}</span>
            </div>
          </button>
          <button onClick={onSort} className="p-1 hover:bg-muted rounded transition-colors shrink-0">
            {isSorted ? (
              sortDirection === "asc" ? (
                <ChevronUp className="h-3 w-3 text-blue-600" />
              ) : (
                <ChevronDown className="h-3 w-3 text-blue-600" />
              )
            ) : (
              <ChevronDown className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
            )}
          </button>
        </div>

        {hasWidgets && <MiniChart column={column} />}
      </div>
    </th>
  )
}
