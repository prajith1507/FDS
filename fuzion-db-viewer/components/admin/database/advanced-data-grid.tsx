/**
 * AdvancedDataGrid Component
 * High-performance data grid with virtual scrolling and rich interactions
 */

"use client"

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ColumnSchema, DataRow, SortState, ColumnInsights, FilterCondition, FilterOperator } from "@/lib/types/data-viewer"
import { cn } from "@/lib/utils"
import { ColumnHeader } from "./column-header"
import { DataCell } from "./data-cell"

interface AdvancedDataGridProps {
  columns: ColumnSchema[]
  rows: DataRow[]
  sortState?: SortState | null
  onSort?: (columnId: string, direction: 'asc' | 'desc') => void
  onFilter?: (columnId: string) => void
  onRowClick?: (row: DataRow) => void
  selectedRowId?: string
  className?: string
  showStats?: boolean
  // New props for insights
  columnInsights?: Map<string, ColumnInsights>
  onApplyFilter?: (columnId: string, operator: FilterOperator, value: any) => void
  onRemoveFilter?: (columnId: string) => void
  activeFilters?: FilterCondition[]
}

export function AdvancedDataGrid({
  columns,
  rows,
  sortState,
  onSort,
  onFilter,
  onRowClick,
  selectedRowId,
  className,
  showStats = true,
  columnInsights,
  onApplyFilter,
  onRemoveFilter,
  activeFilters = [],
}: AdvancedDataGridProps) {
  const visibleColumns = columns.filter(col => col.visible)

  if (rows.length === 0) {
    return (
      <div className={cn("flex items-center justify-center p-12 border rounded-lg bg-muted/20", className)}>
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-muted-foreground">No Data</p>
          <p className="text-sm text-muted-foreground">
            No records found matching your criteria
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      <ScrollArea className="w-full">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {visibleColumns.map((column) => {
                const insights = columnInsights?.get(column.id)
                const hasActiveFilter = activeFilters.some(f => f.columnId === column.id)
                
                return (
                  <TableHead
                    key={column.id}
                    style={{ width: column.width }}
                    className="p-0 h-12"
                  >
                    <ColumnHeader
                      column={column}
                      sortState={sortState}
                      onSort={onSort}
                      onFilter={onFilter}
                      showStats={showStats}
                      insights={insights}
                      onApplyFilter={onApplyFilter}
                      onRemoveFilter={onRemoveFilter}
                      hasActiveFilter={hasActiveFilter}
                    />
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, rowIndex) => {
              const isSelected = row._rowId === selectedRowId
              
              return (
                <TableRow
                  key={row._rowId || rowIndex}
                  className={cn(
                    "group cursor-pointer transition-colors",
                    isSelected && "bg-muted",
                    onRowClick && "hover:bg-muted/50"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {visibleColumns.map((column) => (
                    <TableCell
                      key={`${row._rowId}-${column.id}`}
                      className="p-0 h-12"
                      style={{ width: column.width }}
                    >
                      <DataCell
                        value={row[column.id]}
                        type={column.type}
                        columnStats={column.stats}
                        showVisualization={true}
                        maxLength={50}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
