"use client"

import { useState, useMemo, useRef, useCallback, useEffect } from "react"
import { DataTable } from "./data-table"
import { ViewerHeader } from "./viewer-header"
import { ColumnSummaryPanel } from "./column-summary-panel"
import { ColumnExplorer } from "./column-explorer"
import { JsonView } from "./json-view"
import { ScrollToTopButton } from "./scroll-to-top-button"
import { FilterPanel } from "./filter"
import { fetchCollectionData } from "../lib/api"
import type { DataViewerProps } from "../lib/types"


const ITEMS_PER_PAGE = 50

interface DatabaseViewerExtendedProps extends DataViewerProps {
  datasourceId?: string
  collectionName?: string
  onFetchMore?: (page: number) => Promise<any>
}

export function DatabaseViewer({ data: initialData, datasourceId, collectionName, onFetchMore }: DatabaseViewerExtendedProps) {
  const sampleState = initialData.samplestate.samplestate
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<{
    key: number
    direction: "asc" | "desc"
  } | null>(null)
  const [viewMode, setViewMode] = useState<"table" | "json">("table")
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [showColumnExplorer, setShowColumnExplorer] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [filterQuery, setFilterQuery] = useState("")
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set())
  const [columnOrder, setColumnOrder] = useState<string[]>([])
  const [allData, setAllData] = useState<any[][]>([])
  const [hasMore, setHasMore] = useState(true)
  const [originalRowCount, setOriginalRowCount] = useState<number>(sampleState?.rowCount || 0)
  const containerRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)

  // Initialize data only once or when collection changes
  useEffect(() => {
    const newData = sampleState.data || []
    if (!initializedRef.current || newData.length > 0) {
      console.log("[v0] Initializing data:", newData.length, "rows")
      setAllData(newData)
      setCurrentPage(1)
      setHasMore(true)
      setOriginalRowCount(sampleState?.rowCount || 0)
      initializedRef.current = true
    }
  }, [collectionName, datasourceId, sampleState?.rowCount])

  const allColumns = useMemo(() => {
    if (!sampleState?.columnModel || sampleState.columnModel.length === 0) return []
    return sampleState.columnModel.filter((col) => col.index >= 0 && !col.hidden && col.status !== "DELETED")
  }, [sampleState?.columnModel])
  
  // Initialize visible columns and column order - only once when columns first load
  useEffect(() => {
    if (allColumns.length > 0 && visibleColumns.size === 0) {
      setVisibleColumns(new Set(allColumns.map((col) => col.name)))
      initializedRef.current = true
    }
  }, [allColumns.length])
  
  useEffect(() => {
    if (allColumns.length > 0 && columnOrder.length === 0) {
      setColumnOrder(allColumns.map((col) => col.name))
    }
  }, [allColumns.length])

  const columns = useMemo(() => {
    return allColumns  // Return all columns, let DataTable handle filtering
  }, [allColumns])

  const filteredData = useMemo(() => {
    if (!allData || allData.length === 0) return []

    if (!searchTerm) return allData

    return allData.filter((row) =>
      row.some((cell) => cell?.toString().toLowerCase().includes(searchTerm.toLowerCase())),
    )
  }, [allData, searchTerm])

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData

    const sorted = [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]

      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      if (typeof aVal === "string") {
        return sortConfig.direction === "asc"
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal)
      }

      return sortConfig.direction === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
    })

    return sorted
  }, [filteredData, sortConfig])

  // Show all available data, pagination will load more when scrolling
  const paginatedData = useMemo(() => {
    return sortedData
  }, [sortedData])

  const handleLoadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      const nextPage = currentPage + 1
      console.log('[v0] Loading more data, page:', nextPage)
      
      // Parse filter query if exists
      const parsedQuery = filterQuery.trim() ? JSON.parse(filterQuery) : {}
      
      // Use custom fetch function if provided, otherwise use default
      const result = onFetchMore 
        ? await onFetchMore(nextPage)
        : await fetchCollectionData(nextPage, 1000, false, parsedQuery, 100, 5000, collectionName, datasourceId)

      const newData = result.samplestate?.samplestate?.data || []
      console.log('[v0] Received new data:', newData.length, 'rows')

      if (newData.length === 0) {
        console.log('[v0] No more data available')
        setHasMore(false)
      } else {
        setAllData((prev) => [...prev, ...newData])
        setCurrentPage(nextPage)
      }
    } catch (error) {
      console.error("[v0] Error loading more data:", error)
      setHasMore(false)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, hasMore, currentPage, onFetchMore, filterQuery])

  const handleColumnVisibilityChange = useCallback((columnName: string, visible: boolean) => {
    setVisibleColumns((prev) => {
      const newSet = new Set(prev)
      if (visible) {
        newSet.add(columnName)
      } else {
        newSet.delete(columnName)
      }
      return newSet
    })
  }, [])

  const handleBatchColumnVisibilityChange = useCallback((updates: Array<{columnName: string, visible: boolean}>) => {
    setVisibleColumns((prev) => {
      const newSet = new Set(prev)
      updates.forEach(({columnName, visible}) => {
        if (visible) {
          newSet.add(columnName)
        } else {
          newSet.delete(columnName)
        }
      })
      return newSet
    })
  }, [])

  const handleColumnOrderChange = useCallback((newOrder: string[]) => {
    setColumnOrder(newOrder)
  }, [])

  const dataQuality = useMemo(() => {
    if (!sampleState?.quality) return null
    const q = sampleState.quality
    const total = q.valid + q.invalid + q.missing
    return {
      ...q,
      total,
      validPercent: Math.round((q.valid / total) * 100),
    }
  }, [sampleState?.quality])

  const handleApplyFilter = async (query: string) => {
    setFilterQuery(query)
    setShowFilter(false)
    console.log('[v0] Applying filter:', query)
    
    // Parse the query string to JSON
    try {
      const parsedQuery = query.trim() ? JSON.parse(query) : {}
      
      // Store original count before applying filter (only if no filter was active before)
      if (!filterQuery) {
        setOriginalRowCount(sampleState?.rowCount || allData.length || 0)
      }
      
      // Reset to first page when applying filter
      setCurrentPage(1)
      setIsLoading(true)
      
      // Fetch filtered data
      const result = await fetchCollectionData(1, 1000, false, parsedQuery, 100, 5000, collectionName, datasourceId)
      const newData = result.samplestate?.samplestate?.data || []
      
      setAllData(newData)
      setHasMore(newData.length >= 1000) // If we got full page, there might be more
      
    } catch (error) {
      console.error('[v0] Error applying filter:', error)
      alert('Invalid filter query. Please check your JSON syntax.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearFilter = async () => {
    setFilterQuery("")
    setCurrentPage(1)
    setIsLoading(true)
    
    try {
      // Fetch data without filter
      const result = await fetchCollectionData(1, 1000, false, {}, 100, 5000, collectionName, datasourceId)
      const newData = result.samplestate?.samplestate?.data || []
      
      setAllData(newData)
      setHasMore(newData.length >= 1000)
      // Reset original count when clearing filter
      setOriginalRowCount(result.samplestate?.samplestate?.rowCount || 0)
    } catch (error) {
      console.error('[v0] Error clearing filter:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <ViewerHeader
        dataQuality={dataQuality}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        rowCount={sampleState?.rowCount || 0}
        colCount={columns.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onColumnExplorerToggle={() => setShowColumnExplorer(!showColumnExplorer)}
        onFilterToggle={() => setShowFilter(!showFilter)}
        activeFilter={filterQuery}
        onClearFilter={handleClearFilter}
        filteredRowCount={filterQuery ? allData.length : undefined}
        originalRowCount={filterQuery ? originalRowCount : undefined}
      />

      <div className="flex flex-1 overflow-hidden">
        <div ref={containerRef} className="flex-1 overflow-auto relative">
          {viewMode === "table" ? (
            <DataTable
              columns={columns}
              data={paginatedData}
              selectedColumn={selectedColumn}
              onColumnSelect={setSelectedColumn}
              onSort={setSortConfig}
              sortConfig={sortConfig}
              visibleColumns={visibleColumns}
              columnOrder={columnOrder}
              onLoadMore={handleLoadMore}
              isLoading={isLoading}
              hasMore={hasMore}
            />
          ) : (
            <JsonView data={paginatedData} columns={columns} />
          )}
        </div>

        {selectedColumn && viewMode === "table" && (
          <ColumnSummaryPanel
            column={columns.find((c) => c.name === selectedColumn)}
            onClose={() => setSelectedColumn(null)}
          />
        )}

        {showColumnExplorer && (
          <ColumnExplorer
            columns={allColumns}
            visibleColumns={visibleColumns}
            columnOrder={columnOrder}
            onVisibilityChange={handleColumnVisibilityChange}
            onBatchVisibilityChange={handleBatchColumnVisibilityChange}
            onColumnOrderChange={handleColumnOrderChange}
            onClose={() => setShowColumnExplorer(false)}
          />
        )}

        {showFilter && (
          <FilterPanel
            onClose={() => setShowFilter(false)}
            onApplyFilter={handleApplyFilter}
            currentFilter={filterQuery}
          />
        )}
      </div>

      <ScrollToTopButton containerRef={containerRef} />
    </div>
  )
}
