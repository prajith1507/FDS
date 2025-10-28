"use client"

import { useMemo, useEffect, useRef } from "react"
import { ColumnHeader } from "./column-header"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { ColumnModel } from "../lib/types"

interface DataTableProps {
  columns: ColumnModel[]
  data: any[][]
  selectedColumn: string | null
  onColumnSelect: (columnName: string) => void
  onSort: (config: { key: number; direction: "asc" | "desc" } | null) => void
  sortConfig: { key: number; direction: "asc" | "desc" } | null
  visibleColumns: Set<string>
  columnOrder: string[]
  onLoadMore?: () => void
  isLoading?: boolean
  hasMore?: boolean
}

const ITEMS_PER_PAGE = 50

export function DataTable({
  columns,
  data,
  selectedColumn,
  onColumnSelect,
  onSort,
  sortConfig,
  visibleColumns,
  columnOrder,
  onLoadMore,
  isLoading,
  hasMore = true,
}: DataTableProps) {
  const filteredColumns = useMemo(() => {
    // First, order columns according to columnOrder
    const orderedColumns = columnOrder
      .map(columnName => columns.find(col => col.name === columnName))
      .filter(Boolean) as ColumnModel[]
    
    // Add any columns that might not be in the order (new columns)
    const columnsNotInOrder = columns.filter(col => !columnOrder.includes(col.name))
    const allOrderedColumns = [...orderedColumns, ...columnsNotInOrder]
    
    // Then filter by visibility and valid index
    return allOrderedColumns.filter((col) => col.index >= 0 && visibleColumns.has(col.name))
  }, [columns, visibleColumns, columnOrder])

  const columnIndexMap = useMemo(() => {
    const map: Record<number, number> = {}
    filteredColumns.forEach((col, dataIndex) => {
      map[col.index] = col.index  // Keep original index for data access
    })
    return map
  }, [filteredColumns])

  const tableBodyRef = useRef<HTMLTableSectionElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (!tableBodyRef.current || !onLoadMore || !hasMore) return

    const lastRow = tableBodyRef.current.lastElementChild
    if (!lastRow) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
          onLoadMore()
        }
      },
      { threshold: 0.1 },
    )

    observerRef.current.observe(lastRow)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [data.length, onLoadMore, isLoading, hasMore])

  return (
    <div className="w-full">
      <table className="border-collapse table-fixed" style={{ width: `${80 + (filteredColumns.length * 180)}px` }}>
        <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900/30 z-20">
          <tr className="border-b border-border">
            <th className="w-20 border-r border-border bg-gray-100 dark:bg-gray-900/50 px-4 py-3 text-left text-xs font-semibold text-muted-foreground sticky left-0 z-30">
              #
            </th>
            {filteredColumns.map((column) => (
              <ColumnHeader
                key={column.name}
                column={column}
                isSelected={selectedColumn === column.name}
                onSelect={() => onColumnSelect(column.name)}
                onSort={() => {
                  if (sortConfig?.key === column.index) {
                    onSort({
                      key: column.index,
                      direction: sortConfig.direction === "asc" ? "desc" : "asc",
                    })
                  } else {
                    onSort({ key: column.index, direction: "asc" })
                  }
                }}
                isSorted={sortConfig?.key === column.index}
                sortDirection={sortConfig?.direction}
              />
            ))}
          </tr>
        </thead>
        <tbody ref={tableBodyRef}>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-border hover:bg-muted/50 transition-colors">
              <td className="w-20 border-r border-border bg-gray-100 dark:bg-gray-900/50 px-4 py-3 text-xs font-medium text-muted-foreground sticky left-0 z-10">
                {rowIndex + 1}
              </td>
              {filteredColumns.map((column) => {
                const cellValue = row[column.index]  // Use original column index for data access
                const formattedValue = formatCellValue(cellValue, column.dataType.name)
                return (
                  <td
                    key={`${rowIndex}-${column.index}`}
                    className={cn(
                      "px-4 py-3 text-sm text-foreground w-[180px]",
                      selectedColumn === column.name && "bg-blue-50 dark:bg-blue-950/20",
                    )}
                  >
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <div className="truncate cursor-default">{formattedValue}</div>
                      </TooltipTrigger>
                      <TooltipContent 
                        side="top" 
                        className="max-w-md break-words bg-popover text-popover-foreground border border-border shadow-lg"
                      >
                        <div className="max-h-60 overflow-auto">
                          {typeof cellValue === "object" && cellValue !== null ? (
                            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(cellValue, null, 2)}</pre>
                          ) : (
                            <span className="text-xs">{formattedValue}</span>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {isLoading && hasMore && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
          </div>
        </div>
      )}
      {!hasMore && data.length > 0 && (
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-muted-foreground">No more data to load</p>
        </div>
      )}
    </div>
  )
}

function formatCellValue(value: any, dataType: string): string {
  if (value === null || value === undefined || value === "") {
    return "—"
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 0)
    } catch (error) {
      return String(value)
    }
  }

  if (dataType === "currency") {
    return typeof value === "string" ? value : `$${Number.parseFloat(value).toFixed(2)}`
  }

  if (dataType === "datetime" || dataType === "timestamp") {
    return value.toString()
  }

  return value.toString()
}
