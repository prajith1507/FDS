/**
 * DataViewerToolbar Component
 * Toolbar with search, filters, view toggle, and export
 */

"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Download,
  FileJson,
  FileSpreadsheet,
  Grid3x3,
  List,
  Search,
  X,
} from "lucide-react"
import { FilterCondition, ViewMode } from "@/lib/types/data-viewer"
import { useState } from "react"

interface DataViewerToolbarProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  onSearch?: (query: string) => void
  onExport?: (format: 'csv' | 'json') => void
  activeFilters?: FilterCondition[]
  onClearFilters?: () => void
  totalRecords?: number
  filteredRecords?: number
}

export function DataViewerToolbar({
  viewMode,
  onViewModeChange,
  onSearch,
  onExport,
  activeFilters = [],
  onClearFilters,
  totalRecords = 0,
  filteredRecords = 0,
}: DataViewerToolbarProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    onSearch?.(value)
  }

  const handleClearSearch = () => {
    setSearchQuery("")
    onSearch?.("")
  }

  const activeFilterCount = activeFilters.filter(f => f.active).length

  return (
    <div className="flex items-center justify-between gap-4 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Left: Search and Filters */}
      <div className="flex items-center gap-2 flex-1">
        {/* Search */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search across all columns..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              onClick={handleClearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Active Filters Badge */}
        {activeFilterCount > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Badge variant="secondary" className="gap-2">
                    {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={onClearFilters}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs space-y-1">
                  <div className="font-semibold">Active Filters:</div>
                  {activeFilters
                    .filter(f => f.active)
                    .map((filter, idx) => (
                      <div key={idx}>
                        {filter.columnId} {filter.operator} {String(filter.value)}
                      </div>
                    ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Record Count */}
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          {filteredRecords !== totalRecords ? (
            <>
              <span className="font-medium">{filteredRecords.toLocaleString()}</span>
              {" of "}
              <span>{totalRecords.toLocaleString()}</span>
              {" records"}
            </>
          ) : (
            <>
              <span className="font-medium">{totalRecords.toLocaleString()}</span>
              {" records"}
            </>
          )}
        </div>
      </div>

      {/* Right: View Toggle and Export */}
      <div className="flex items-center gap-2">
        {/* View Mode Toggle */}
        <div className="flex items-center border rounded-md">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-r-none"
                  onClick={() => onViewModeChange('table')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Table View</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === 'json' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-l-none"
                  onClick={() => onViewModeChange('json')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>JSON View</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Export Menu */}
        {onExport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export Format</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onExport('csv')}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('json')}>
                <FileJson className="h-4 w-4 mr-2" />
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}
