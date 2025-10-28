/**
 * AdvancedDataViewer Component
 * Main component that orchestrates all data viewing functionality
 */

"use client"

import { useEffect, useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AdvancedDataViewerProps,
  DataRow,
  ViewMode,
  SortState,
  FilterCondition,
  ColumnSchema,
} from "@/lib/types/data-viewer"
import {
  generateColumnSchemas,
  sortRows,
  filterRows,
  rowsToCSV,
  downloadFile,
  calculateColumnInsights,
} from "@/lib/utils/data-viewer-utils"
import type { ColumnInsights, FilterOperator } from "@/lib/types/data-viewer"
import { AdvancedDataGrid } from "./advanced-data-grid"
import { JsonDataViewer } from "./json-data-viewer"
import { DataViewerToolbar } from "./data-viewer-toolbar"
import { StatisticsPanel } from "./statistics-panel"
import { Loader2 } from "lucide-react"

export function AdvancedDataViewer({
  database,
  initialData = [],
  initialTotal = 0,
  onDataChange,
  onError,
  className,
  features = {
    export: true,
    filter: true,
    sort: true,
    search: true,
    statistics: true,
    viewToggle: true,
    columnInsights: true,
  },
}: AdvancedDataViewerProps) {
  // State
  const [rows, setRows] = useState<DataRow[]>(initialData)
  const [columns, setColumns] = useState<ColumnSchema[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>(database.isNoSQL ? 'json' : 'table')
  const [sortState, setSortState] = useState<SortState | null>(null)
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalRecords, setTotalRecords] = useState(initialTotal)
  const [isLoading, setIsLoading] = useState(false)
  const [columnInsights, setColumnInsights] = useState<Map<string, ColumnInsights>>(new Map())

  // Generate column schemas when data changes
  useEffect(() => {
    if (rows.length > 0) {
      const schemas = generateColumnSchemas(rows, {
        includeStats: features.statistics,
        defaultWidth: 150,
      })
      setColumns(schemas)
    }
  }, [rows, features.statistics])

  // Calculate column insights (with performance optimization)
  useEffect(() => {
    if (rows.length > 0 && columns.length > 0 && features.columnInsights !== false) {
      const insightsMap = new Map<string, ColumnInsights>()
      
      // Calculate insights for each column
      columns.forEach(column => {
        const insights = calculateColumnInsights(
          column.id,
          column.name,
          rows,
          column.type
        )
        insightsMap.set(column.id, insights)
      })
      
      setColumnInsights(insightsMap)
    }
  }, [rows, columns, features.columnInsights])

  // Add _rowId to rows if not present
  useEffect(() => {
    const rowsWithIds = initialData.map((row, index) => ({
      ...row,
      _rowId: row._rowId || row.id || row._id || `row-${index}`,
    }))
    setRows(rowsWithIds)
    setTotalRecords(initialTotal || rowsWithIds.length)
  }, [initialData, initialTotal])

  // Filtered and sorted data
  const processedData = useMemo(() => {
    let result = [...rows]

    // Apply search
    if (searchQuery && features.search) {
      const query = searchQuery.toLowerCase()
      result = result.filter(row => {
        return Object.values(row).some(value => {
          if (value === null || value === undefined) return false
          return String(value).toLowerCase().includes(query)
        })
      })
    }

    // Apply filters
    if (filterConditions.length > 0 && features.filter) {
      result = filterRows(result, filterConditions)
    }

    // Apply sorting
    if (sortState && features.sort) {
      result = sortRows(result, sortState)
    }

    return result
  }, [rows, searchQuery, filterConditions, sortState, features])

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return processedData.slice(startIndex, endIndex)
  }, [processedData, currentPage, pageSize])

  const totalPages = Math.ceil(processedData.length / pageSize)

  // Handlers
  const handleSort = (columnId: string, direction: 'asc' | 'desc') => {
    setSortState({ columnId, direction })
    setCurrentPage(1) // Reset to first page
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
  }

  const handleExport = (format: 'csv' | 'json') => {
    try {
      const dataToExport = processedData

      if (format === 'csv') {
        const csv = rowsToCSV(dataToExport, columns, true)
        downloadFile(
          csv,
          `${database.table}-${new Date().toISOString().split('T')[0]}.csv`,
          'text/csv'
        )
      } else if (format === 'json') {
        const json = JSON.stringify(dataToExport, null, 2)
        downloadFile(
          json,
          `${database.table}-${new Date().toISOString().split('T')[0]}.json`,
          'application/json'
        )
      }
    } catch (error) {
      onError?.(error as Error)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleApplyFilter = (columnId: string, operator: FilterOperator, value: any) => {
    // Remove existing filter for this column
    const newFilters = filterConditions.filter(f => f.columnId !== columnId)
    
    // Add new filter
    newFilters.push({
      columnId,
      operator,
      value,
      active: true,
    })
    
    setFilterConditions(newFilters)
    setCurrentPage(1) // Reset to first page
  }

  const handleRemoveFilter = (columnId: string) => {
    setFilterConditions(filterConditions.filter(f => f.columnId !== columnId))
    setCurrentPage(1)
  }

  const handlePageSizeChange = (size: string) => {
    setPageSize(Number(size))
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setFilterConditions([])
    setSearchQuery("")
    setCurrentPage(1)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Statistics Panel */}
      {features.statistics && (
        <StatisticsPanel
          totalRecords={rows.length}
          filteredRecords={processedData.length}
          columns={columns}
        />
      )}

      {/* Main Card */}
      <Card className="overflow-hidden">
        {/* Toolbar */}
        <DataViewerToolbar
          viewMode={viewMode}
          onViewModeChange={features.viewToggle ? handleViewModeChange : () => {}}
          onSearch={features.search ? handleSearch : undefined}
          onExport={features.export ? handleExport : undefined}
          activeFilters={filterConditions}
          onClearFilters={handleClearFilters}
          totalRecords={rows.length}
          filteredRecords={processedData.length}
        />

        {/* Data View */}
        <div className="min-h-[400px]">
          {viewMode === 'table' ? (
            <AdvancedDataGrid
              columns={columns}
              rows={paginatedData}
              sortState={sortState}
              onSort={features.sort ? handleSort : undefined}
              showStats={features.statistics}
              columnInsights={columnInsights}
              onApplyFilter={handleApplyFilter}
              onRemoveFilter={handleRemoveFilter}
              activeFilters={filterConditions}
            />
          ) : (
            <JsonDataViewer rows={paginatedData} />
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page:</span>
              <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
            </div>

            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i
                  if (page > totalPages) return null
                  
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={page === currentPage}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>
    </div>
  )
}
