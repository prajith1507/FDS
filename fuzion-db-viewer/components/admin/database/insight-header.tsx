/**
 * InsightHeader Component
 * Displays profiling data summary and column insights strip
 */

"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

// ============================================================================
// TYPES (matching new backend shape)
// ============================================================================

interface ProfilingResponse {
  samplestate: {
    samplestate: {
      rowCount: number
      colCount: number
      intColCount: number
      dataTypeCount: number
      quality: { valid: number; invalid: number; missing: number }
      inputDSDetails?: { rowCount?: string; colCount?: string; size?: string; status?: string }
      fileSize?: number
      nextIndex?: number
      version?: string
      sampled?: boolean
      charset?: string
      columnModel: ColumnModel[]
    }
  }
  ruleset?: {
    datasource_details?: {
      url?: string
      parse_details?: { charset?: string }
    }
    rules?: Array<{
      id: string
      type: string
      description?: string
      rule_json?: any
      status?: string
    }>
  }
}

type ColumnModel = {
  displayName: string
  name: string
  index: number
  status: "RETAINED" | "DELETED" | string
  columnType: "INTERNAL" | "RAW" | "DERIVED" | string
  hidden: boolean
  dataType: { name: string; baseType: string }
  widgets?: {
    discrete?: Array<{ label: string; count: number }>
    continuous?: Array<{ min: string; max: string; label: string; count: number }>
    quality?: Array<{ valid: number; invalid: number; missing: number }>
  }
  aggregate?: Array<Record<string, string>>
  personalData?: { pii?: boolean }
  pii?: boolean
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatBytes(n?: number | string): string {
  if (n == null) return "-"
  const bytes = typeof n === "string" ? parseInt(n, 10) : n
  if (isNaN(bytes) || bytes === 0) return "-"
  
  const units = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, i)
  
  return `${value.toFixed(1)} ${units[i]}`
}

function pct(n: number, total: number): number {
  if (total === 0) return 0
  return Math.round((n / total) * 1000) / 10 // 1 decimal
}

function getIcon(col: ColumnModel): string {
  const type = col.dataType?.baseType?.toLowerCase() || col.dataType?.name?.toLowerCase() || ""
  
  if (type.includes("string") || type.includes("text") || type.includes("varchar")) return "T"
  if (type.includes("number") || type.includes("int") || type.includes("decimal") || type.includes("float") || type.includes("currency")) return "#"
  if (type.includes("bool")) return "T/F"
  if (type.includes("date") || type.includes("time")) return "🗓"
  
  return "?"
}

function getBars(col: ColumnModel): Array<{ count: number; kind: "discrete" | "continuous" }> {
  if (col.widgets?.discrete && col.widgets.discrete.length > 0) {
    // Take top 10 by count
    const sorted = [...col.widgets.discrete].sort((a, b) => b.count - a.count).slice(0, 10)
    return sorted.map(item => ({ count: item.count, kind: "discrete" }))
  }
  
  if (col.widgets?.continuous && col.widgets.continuous.length > 0) {
    return col.widgets.continuous.map(item => ({ count: item.count, kind: "continuous" }))
  }
  
  // Empty state: 10 placeholder bars
  return Array(10).fill({ count: 0, kind: "discrete" as const })
}

function getFooterText(col: ColumnModel): string {
  if (col.widgets?.discrete && col.widgets.discrete.length > 0) {
    return `${col.widgets.discrete.length} types`
  }
  
  if (col.widgets?.continuous && col.widgets.continuous.length > 0) {
    const first = col.widgets.continuous[0]
    if (first?.min != null && first?.max != null) {
      return `${first.min} - ${first.max}`
    }
  }
  
  // Fallback to aggregate
  if (col.aggregate && col.aggregate.length > 0) {
    const agg = col.aggregate[0]
    if (agg.min != null && agg.max != null) {
      return `${agg.min} - ${agg.max}`
    }
  }
  
  return "-"
}

function getQuality(col: ColumnModel): { valid: number; invalid: number; missing: number } | null {
  if (col.widgets?.quality && col.widgets.quality.length > 0) {
    return col.widgets.quality[0]
  }
  return null
}

// ============================================================================
// COMPONENT
// ============================================================================

export function InsightHeader({ data }: { data: ProfilingResponse }): JSX.Element {
  const state = data.samplestate.samplestate
  
  // Sort columns by index (negative at end), filter out if needed
  const sortedColumns = useMemo(() => {
    return [...state.columnModel]
      .sort((a, b) => {
        if (a.index < 0 && b.index >= 0) return 1
        if (a.index >= 0 && b.index < 0) return -1
        return a.index - b.index
      })
  }, [state.columnModel])
  
  // Calculate size
  const size = useMemo(() => {
    if (state.fileSize) return formatBytes(state.fileSize)
    if (state.inputDSDetails?.size) return formatBytes(state.inputDSDetails.size)
    return "-"
  }, [state.fileSize, state.inputDSDetails?.size])
  
  // Get encoding
  const encoding = useMemo(() => {
    return data.ruleset?.datasource_details?.parse_details?.charset || state.charset || "-"
  }, [data.ruleset?.datasource_details?.parse_details?.charset, state.charset])
  
  // Quality totals
  const qualityTotal = state.quality.valid + state.quality.invalid + state.quality.missing
  const validPct = pct(state.quality.valid, qualityTotal)
  const invalidPct = pct(state.quality.invalid, qualityTotal)
  const missingPct = pct(state.quality.missing, qualityTotal)
  
  return (
    <div className="w-full border-b bg-background">
      {/* Top Summary Bar */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between gap-6">
          {/* Left: Metrics */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Rows:</span>
              <span className="font-semibold">{state.rowCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Cols:</span>
              <span className="font-semibold">{state.colCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Size:</span>
              <span className="font-semibold">{size}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Version:</span>
              <span className="font-semibold">{state.version || "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Encoding:</span>
              <span className="font-semibold">{encoding}</span>
            </div>
          </div>
          
          {/* Right: Quality Bar */}
          <div className="flex items-center gap-3">
            <div className="text-xs text-muted-foreground">Quality:</div>
            <div className="w-48 h-6 rounded-full overflow-hidden flex border">
              {/* Valid - Green */}
              {validPct > 0 && (
                <div
                  className="bg-green-500 flex items-center justify-center text-[10px] font-medium text-white"
                  style={{ width: `${validPct}%` }}
                  title={`Valid: ${validPct}%`}
                >
                  {validPct > 10 && `${validPct}%`}
                </div>
              )}
              {/* Invalid - Red */}
              {invalidPct > 0 && (
                <div
                  className="bg-red-500 flex items-center justify-center text-[10px] font-medium text-white"
                  style={{ width: `${invalidPct}%` }}
                  title={`Invalid: ${invalidPct}%`}
                >
                  {invalidPct > 10 && `${invalidPct}%`}
                </div>
              )}
              {/* Missing - Gray */}
              {missingPct > 0 && (
                <div
                  className="bg-gray-400 flex items-center justify-center text-[10px] font-medium text-white"
                  style={{ width: `${missingPct}%` }}
                  title={`Missing: ${missingPct}%`}
                >
                  {missingPct > 10 && `${missingPct}%`}
                </div>
              )}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Valid</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>Invalid</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-400" />
                <span>Missing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Column Strip */}
      <div className="overflow-x-auto whitespace-nowrap px-4 py-4">
        <div className="inline-flex gap-3">
          {sortedColumns.map((col, idx) => {
            const bars = getBars(col)
            const maxCount = Math.max(...bars.map(b => b.count), 1)
            const footerText = getFooterText(col)
            const quality = getQuality(col)
            const hasIssues = quality && (quality.invalid > 0 || quality.missing > 0)
            const isPII = col.pii || col.personalData?.pii
            const isDeleted = col.status === "DELETED"
            const isHidden = col.hidden
            
            return (
              <div
                key={`${col.name}-${idx}`}
                className={cn(
                  "w-[220px] h-[130px] rounded-2xl border p-3 flex flex-col",
                  "bg-card hover:bg-accent/5 transition-colors",
                  (isDeleted || isHidden) && "opacity-50"
                )}
              >
                {/* Header Row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Icon */}
                    <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                      {getIcon(col)}
                    </div>
                    {/* Title */}
                    <div
                      className={cn(
                        "text-sm font-medium truncate",
                        isDeleted && "line-through"
                      )}
                      title={col.displayName}
                    >
                      {col.displayName}
                    </div>
                  </div>
                  {/* Badges */}
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {isPII && (
                      <div className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                        PII
                      </div>
                    )}
                    <div className="text-muted-foreground text-xs">▼</div>
                  </div>
                </div>
                
                {/* Mini Histogram */}
                <div className="flex-1 flex items-end justify-between gap-0.5 mb-2 px-1">
                  {bars.map((bar, barIdx) => {
                    const heightPct = bar.count > 0 ? (bar.count / maxCount) * 100 : 0
                    const minHeight = bar.count > 0 ? 6 : 3
                    const actualHeight = Math.max(heightPct, minHeight)
                    
                    return (
                      <div
                        key={barIdx}
                        className={cn(
                          "flex-1 rounded-sm transition-all",
                          bar.count > 0 
                            ? "bg-blue-500 hover:bg-blue-600" 
                            : "bg-muted/40"
                        )}
                        style={{ height: `${actualHeight}%` }}
                        title={bar.count > 0 ? `Count: ${bar.count}` : undefined}
                      />
                    )
                  })}
                </div>
                
                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate">{footerText}</span>
                  {hasIssues && (
                    <div className="flex items-center gap-1 shrink-0">
                      {quality.invalid > 0 && (
                        <div className="w-2 h-2 rounded-full bg-red-500" title={`${quality.invalid} invalid`} />
                      )}
                      {quality.missing > 0 && (
                        <div className="w-2 h-2 rounded-full bg-gray-400" title={`${quality.missing} missing`} />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// DEMO (guarded with if(false))
// ============================================================================

if (false) {
  const mockData: ProfilingResponse = {
    samplestate: {
      samplestate: {
        rowCount: 245,
        colCount: 24,
        intColCount: 8,
        dataTypeCount: 6,
        quality: { valid: 5000, invalid: 120, missing: 200 },
        fileSize: 21148,
        version: "1.0",
        charset: "UTF-8",
        columnModel: [
          {
            displayName: "Item ID",
            name: "item_id",
            index: 0,
            status: "RETAINED",
            columnType: "RAW",
            hidden: false,
            dataType: { name: "string", baseType: "string" },
            widgets: {
              discrete: [
                { label: "L7C500-s4f5b4136", count: 244 },
                { label: "KCAL-4", count: 1 },
              ],
              quality: [{ valid: 244, invalid: 0, missing: 1 }],
            },
          },
          {
            displayName: "Name",
            name: "name",
            index: 1,
            status: "RETAINED",
            columnType: "RAW",
            hidden: false,
            dataType: { name: "string", baseType: "string" },
            widgets: {
              discrete: Array(49).fill(null).map((_, i) => ({ label: `Name${i}`, count: 10 - i })),
              quality: [{ valid: 240, invalid: 3, missing: 2 }],
            },
          },
          {
            displayName: "Price",
            name: "price",
            index: 2,
            status: "RETAINED",
            columnType: "RAW",
            hidden: false,
            dataType: { name: "currency", baseType: "number" },
            widgets: {
              continuous: [
                { min: "0.83", max: "50", label: "$0.83-$50", count: 30 },
                { min: "50", max: "100", label: "$50-$100", count: 80 },
                { min: "100", max: "484.2", label: "$100-$484.2", count: 120 },
              ],
              quality: [{ valid: 230, invalid: 0, missing: 15 }],
            },
          },
          {
            displayName: "Country of Origin",
            name: "country",
            index: 3,
            status: "RETAINED",
            columnType: "RAW",
            hidden: false,
            dataType: { name: "string", baseType: "string" },
            widgets: {
              discrete: [
                { label: "JAPAN", count: 100 },
                { label: "USA", count: 80 },
                { label: "Germany", count: 40 },
                { label: "China", count: 25 },
              ],
              quality: [{ valid: 245, invalid: 0, missing: 0 }],
            },
          },
          {
            displayName: "Created At",
            name: "created_at",
            index: 4,
            status: "RETAINED",
            columnType: "RAW",
            hidden: false,
            dataType: { name: "timestamp", baseType: "datetime" },
            widgets: {
              continuous: [
                { min: "2020-11-14", max: "2021-12-31", label: "2020-2021", count: 245 },
              ],
              quality: [{ valid: 245, invalid: 0, missing: 0 }],
            },
          },
          {
            displayName: "SSN",
            name: "ssn",
            index: 5,
            status: "RETAINED",
            columnType: "RAW",
            hidden: false,
            pii: true,
            dataType: { name: "string", baseType: "string" },
            widgets: {
              discrete: Array(245).fill(null).map((_, i) => ({ label: `SSN${i}`, count: 1 })),
              quality: [{ valid: 240, invalid: 5, missing: 0 }],
            },
          },
        ],
      },
    },
  }
  
  // Usage: <InsightHeader data={mockData} />
}
