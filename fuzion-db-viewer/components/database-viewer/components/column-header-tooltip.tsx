"use client"

import type { ColumnModel } from "../lib/types"

interface ColumnHeaderTooltipProps {
  column: ColumnModel
}

export function ColumnHeaderTooltip({ column }: ColumnHeaderTooltipProps) {
  const getAggregateStats = () => {
    if (!column.widgets?.aggregate || column.widgets.aggregate.length === 0) {
      return null
    }
    return column.widgets.aggregate[0]
  }

  const getQualityStats = () => {
    if (!column.widgets?.quality || column.widgets.quality.length === 0) {
      return null
    }
    return column.widgets.quality[0]
  }

  const stats = getAggregateStats()
  const quality = getQualityStats()

  return (
    <div className="absolute top-full left-0 mt-1 z-50 bg-slate-900 text-white rounded-lg shadow-lg p-3 min-w-max text-xs border border-slate-700 pointer-events-none">
      <div className="font-semibold mb-2 text-blue-300">{column.displayName}</div>

      {/* Data Type Info */}
      <div className="mb-2 pb-2 border-b border-slate-700">
        <div className="text-slate-400">
          Type: <span className="text-slate-200">{column.dataType.name}</span>
        </div>
      </div>

      {/* Quality Metrics */}
      {quality && (
        <div className="mb-2 pb-2 border-b border-slate-700">
          <div className="font-semibold text-slate-300 mb-1">Quality</div>
          <div className="text-slate-400">
            <div>
              Valid: <span className="text-green-400">{quality.valid}</span>
            </div>
            <div>
              Invalid: <span className="text-red-400">{quality.invalid}</span>
            </div>
            <div>
              Missing: <span className="text-yellow-400">{quality.missing}</span>
            </div>
          </div>
        </div>
      )}

      {/* Aggregate Statistics */}
      {stats && (
        <div>
          <div className="font-semibold text-slate-300 mb-1">Statistics</div>
          <div className="text-slate-400 space-y-1">
            {stats.min !== undefined && (
              <div>
                Min: <span className="text-slate-200">{stats.min}</span>
              </div>
            )}
            {stats.max !== undefined && (
              <div>
                Max: <span className="text-slate-200">{stats.max}</span>
              </div>
            )}
            {stats.avg !== undefined && (
              <div>
                Avg: <span className="text-slate-200">{stats.avg}</span>
              </div>
            )}
            {stats.mode !== undefined && (
              <div>
                Mode: <span className="text-slate-200">{stats.mode}</span>
              </div>
            )}
            {stats.categories !== undefined && (
              <div>
                Categories: <span className="text-slate-200">{stats.categories}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
