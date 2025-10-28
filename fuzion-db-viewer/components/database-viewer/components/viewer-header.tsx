"use client"

import { Search, Columns3, Filter, Code2, Table2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ViewerHeaderProps {
  dataQuality: {
    valid: number
    invalid: number
    missing: number
    total: number
    validPercent: number
  } | null
  searchTerm: string
  onSearchChange: (term: string) => void
  rowCount: number
  colCount: number
  viewMode: "table" | "json"
  onViewModeChange: (mode: "table" | "json") => void
  onColumnExplorerToggle: () => void
  onFilterToggle: () => void
  activeFilter?: string
  onClearFilter?: () => void
  filteredRowCount?: number
  originalRowCount?: number
}

export function ViewerHeader({
  dataQuality,
  searchTerm,
  onSearchChange,
  rowCount,
  colCount,
  viewMode,
  onViewModeChange,
  onColumnExplorerToggle,
  onFilterToggle,
  activeFilter,
  onClearFilter,
  filteredRowCount,
  originalRowCount,
}: ViewerHeaderProps) {
  const displayRowCount = activeFilter && filteredRowCount !== undefined ? filteredRowCount : rowCount
  const showOriginalCount = activeFilter && originalRowCount !== undefined && filteredRowCount !== originalRowCount

  return (
    <div className="border-b border-border bg-muted/30 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold text-foreground">Sample Dataset</h1>
            <p className="text-sm text-muted-foreground">
              {displayRowCount.toLocaleString()} rows
              {showOriginalCount && (
                <span className="text-blue-600 dark:text-blue-400">
                  {" "}(filtered from {originalRowCount.toLocaleString()})
                </span>
              )}
              {" • "}{colCount} columns
            </p>
          </div>
        </div>

        {dataQuality && (
          <div className="flex items-center gap-2 rounded-lg bg-background px-3 py-2">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-700">
              {Math.round(dataQuality.validPercent)}%
            </div>
            <div className="flex flex-col text-sm">
              <span className="font-medium text-foreground">Data Quality</span>
              <span className="text-xs text-muted-foreground">
                {dataQuality.valid.toLocaleString()} valid • {dataQuality.invalid.toLocaleString()} invalid
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search data..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-1 rounded-lg border border-border bg-background p-1">
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="icon"
              onClick={() => onViewModeChange("table")}
              title="Table View"
            >
              <Table2 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "json" ? "default" : "ghost"}
              size="icon"
              onClick={() => onViewModeChange("json")}
              title="JSON View"
            >
              <Code2 className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="icon" onClick={onColumnExplorerToggle} title="Column Explorer">
            <Columns3 className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onFilterToggle} 
            title="Query Filter"
            className={activeFilter ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : ""}
          >
            <Filter className={`h-4 w-4 ${activeFilter ? "text-blue-600 dark:text-blue-400" : ""}`} />
          </Button>
        </div>
      </div>
      {activeFilter && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-800 dark:bg-blue-950">
          <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-medium text-blue-900 dark:text-blue-100">Active Query Filter</p>
            <code className="block truncate text-xs text-blue-700 dark:text-blue-300">{activeFilter}</code>
          </div>
          {onClearFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilter}
              className="h-6 shrink-0 text-xs text-blue-600 hover:bg-blue-100 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900 dark:hover:text-blue-300"
            >
              Clear Filter
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
