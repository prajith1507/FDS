"use client"

import { useState, useMemo } from "react"
import { X, Search, Eye, EyeOff, Columns3, HelpCircle, GripVertical, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ColumnModel } from "../lib/types"

interface ColumnExplorerProps {
  columns: ColumnModel[]
  visibleColumns: Set<string>
  columnOrder: string[]
  onVisibilityChange: (columnName: string, visible: boolean) => void
  onBatchVisibilityChange?: (updates: Array<{columnName: string, visible: boolean}>) => void
  onColumnOrderChange: (newOrder: string[]) => void
  onClose: () => void
}

export function ColumnExplorer({ columns, visibleColumns, columnOrder, onVisibilityChange, onBatchVisibilityChange, onColumnOrderChange, onClose }: ColumnExplorerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterMode, setFilterMode] = useState<"all" | "hidden" | "valid" | "invalid">("all")
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)

  const filteredColumns = useMemo(() => {
    // First sort columns by the current order
    const orderedColumns = columnOrder
      .map(columnName => columns.find(col => col.name === columnName))
      .filter(Boolean) as ColumnModel[]
    
    // Add any columns that might not be in the order (new columns)
    const columnsNotInOrder = columns.filter(col => !columnOrder.includes(col.name))
    const allOrderedColumns = [...orderedColumns, ...columnsNotInOrder]

    let filtered = allOrderedColumns

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((col) => col.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    // Apply data quality filters - these only filter the displayed list, don't change visibility
    if (filterMode === "valid") {
      filtered = filtered.filter((col) => {
        const quality = col.widgets.quality?.[0]
        return quality && quality.invalid === 0 && quality.missing === 0
      })
    } else if (filterMode === "invalid") {
      filtered = filtered.filter((col) => {
        const quality = col.widgets.quality?.[0]
        return quality && (quality.invalid > 0 || quality.missing > 0)
      })
    }
    // Note: "all" and "hidden" modes affect visibility but don't filter the list
    // "valid" and "invalid" modes filter the list but don't change visibility

    return filtered
  }, [columns, searchTerm, filterMode, visibleColumns, columnOrder])

  const handleToggleVisibility = (columnName: string) => {
    const shouldBeVisible = !visibleColumns.has(columnName)
    onVisibilityChange(columnName, shouldBeVisible)
    
    // If user manually toggles visibility, reset to "all" mode
    if (filterMode === "hidden" || filterMode === "all") {
      setFilterMode("all")
    }
  }

  const handleFilterChange = (mode: string) => {
    // Apply visibility changes BEFORE setting filter mode to avoid stale closure
    if (mode === "all") {
      // Show all columns - make all columns visible
      if (onBatchVisibilityChange) {
        const updates = columns
          .filter(col => !visibleColumns.has(col.name))
          .map(col => ({ columnName: col.name, visible: true }))
        if (updates.length > 0) {
          onBatchVisibilityChange(updates)
        }
      } else {
        columns.forEach((col) => {
          if (!visibleColumns.has(col.name)) {
            onVisibilityChange(col.name, true)
          }
        })
      }
    } else if (mode === "hidden") {
      // Hide all columns - make all columns invisible
      if (onBatchVisibilityChange) {
        const updates = columns
          .filter(col => visibleColumns.has(col.name))
          .map(col => ({ columnName: col.name, visible: false }))
        if (updates.length > 0) {
          onBatchVisibilityChange(updates)
        }
      } else {
        columns.forEach((col) => {
          if (visibleColumns.has(col.name)) {
            onVisibilityChange(col.name, false)
          }
        })
      }
    }
    
    // Set filter mode AFTER applying visibility changes
    setFilterMode(mode as "all" | "hidden" | "valid" | "invalid")
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, columnName: string) => {
    setDraggedItem(columnName)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, columnName: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    
    // Update column order immediately during drag
    if (draggedItem && draggedItem !== columnName) {
      const newOrder = [...columnOrder]
      const draggedIndex = newOrder.indexOf(draggedItem)
      const targetIndex = newOrder.indexOf(columnName)
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        // Remove dragged item from current position
        newOrder.splice(draggedIndex, 1)
        // Insert at target position
        newOrder.splice(targetIndex, 0, draggedItem)
        onColumnOrderChange(newOrder)
      }
    }
    
    setDragOverItem(columnName)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the column item entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverItem(null)
    }
  }

  const handleDrop = (e: React.DragEvent, targetColumnName: string) => {
    e.preventDefault()
    
    // Clean up drag state
    setDraggedItem(null)
    setDragOverItem(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverItem(null)
  }

  const getQualityBar = (column: ColumnModel) => {
    const quality = column.widgets.quality?.[0]
    if (!quality) return null

    const total = quality.valid + quality.invalid + quality.missing
    const validPercent = (quality.valid / total) * 100
    const invalidPercent = (quality.invalid / total) * 100

    return (
      <div className="flex h-2 w-32 overflow-hidden rounded-full bg-muted">
        <div className="bg-green-500" style={{ width: `${validPercent}%` }} />
        <div className="bg-red-500" style={{ width: `${invalidPercent}%` }} />
      </div>
    )
  }

  const getColumnIcon = (dataType: string) => {
    const type = dataType.toLowerCase()
    if (type.includes("string") || type.includes("text")) return "T"
    if (type.includes("number") || type.includes("int") || type.includes("float")) return "#"
    if (type.includes("date") || type.includes("time")) return "📅"
    if (type.includes("bool")) return "✓"
    if (type.includes("currency")) return "$"
    return "•"
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-[400px] border-l border-border bg-card shadow-lg">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <Columns3 className="h-5 w-5 text-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Column Explorer</h2>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="border-b border-border p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search columns by name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchTerm && (
            <p className="mt-2 text-xs text-muted-foreground">
              Searching in column names • {filteredColumns.length} result{filteredColumns.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Filter Actions */}
        <div className="border-b border-border p-3">
          <Select value={filterMode} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Show all columns</SelectItem>
              <SelectItem value="hidden">Hide all columns</SelectItem>
              <SelectItem value="valid">Show valid data only</SelectItem>
              <SelectItem value="invalid">Show invalid data only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Column List */}
        <div className="flex-1 overflow-auto p-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">Columns</h3>
          <div className="space-y-2">
            {filteredColumns.map((column) => {
              const isVisible = visibleColumns.has(column.name)
              const isDragging = draggedItem === column.name
              const isDragOver = dragOverItem === column.name
              
              return (
                <div
                  key={column.name}
                  draggable
                  onDragStart={(e) => handleDragStart(e, column.name)}
                  onDragOver={(e) => handleDragOver(e, column.name)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, column.name)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center justify-between rounded-lg border border-border bg-background p-3 hover:bg-accent transition-all cursor-move ${
                    isDragging ? 'opacity-50 scale-95' : ''
                  } ${
                    isDragOver ? 'border-primary bg-primary/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleToggleVisibility(column.name)}
                      >
                        {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        {getColumnIcon(column.dataType.name)}
                      </span>
                      <span className="text-sm font-medium text-foreground">{column.displayName}</span>
                    </div>
                  </div>
                  {getQualityBar(column)}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
