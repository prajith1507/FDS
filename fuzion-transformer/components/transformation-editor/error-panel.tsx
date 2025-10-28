"use client"

import { X, ChevronDown, ChevronRight, CheckCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface LogEntry {
  type: string
  message: string
  timestamp: string
  blockId: string | null
}

interface ErrorPanelProps {
  error?: string
  stack?: string
  result?: any
  success?: boolean
  logs?: LogEntry[]
  executionTime?: number
  metadata?: {
    inputRecords?: number
    outputRecords?: number
    testMode?: boolean
    totalLogs?: number
    totalErrors?: number
    totalBlocks?: number
  }
  onClose: () => void
}

export function ErrorPanel({
  error,
  stack,
  result,
  success,
  logs = [],
  executionTime,
  metadata,
  onClose,
}: ErrorPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [activeTab, setActiveTab] = useState<"output" | "run-logs">(success ? "output" : "run-logs")

  // Parse stack trace into lines
  const stackLines = stack ? stack.split("\n").filter((line) => line.trim()) : []

  // Format timestamp to display time only
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
    } catch {
      return timestamp
    }
  }

  const parseLogMessage = (message: string) => {
    const emojiMatch = message.match(/^([\u{1F300}-\u{1F9FF}])\s*(.+)$/u)
    if (emojiMatch) {
      return { emoji: emojiMatch[1], text: emojiMatch[2] }
    }
    return { emoji: null, text: message }
  }

  return (
    <div className="border-t border-border bg-white">
      {/* Tab Bar */}
      <div className="flex items-center justify-between bg-[#f3f3f3] border-b border-[#e5e5e5]">
        <div className="flex items-center">
          <button
            onClick={() => setActiveTab("output")}
            className={`px-4 py-2 text-xs font-medium border-r border-[#e5e5e5] transition-colors ${
              activeTab === "output" ? "bg-white text-[#1e1e1e]" : "text-[#616161] hover:bg-[#e8e8e8]"
            }`}
          >
            OUTPUT
          </button>
          <button
            onClick={() => setActiveTab("run-logs")}
            className={`px-4 py-2 text-xs font-medium border-r border-[#e5e5e5] transition-colors ${
              activeTab === "run-logs" ? "bg-white text-[#1e1e1e]" : "text-[#616161] hover:bg-[#e8e8e8]"
            }`}
          >
            RUN LOGS
          </button>
        </div>
        <div className="flex items-center gap-1 px-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 w-7 p-0 hover:bg-[#e8e8e8] text-[#616161]"
          >
            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0 hover:bg-[#e8e8e8] text-[#616161]">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && activeTab === "output" && (
        <div className="max-h-[250px] overflow-y-auto bg-white p-4">
          {success && result ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#16825d] mb-3">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Function executed successfully</span>
                {executionTime !== undefined && <span className="text-xs text-[#616161]">({executionTime}ms)</span>}
              </div>
              <pre className="text-xs font-mono text-[#1e1e1e] bg-[#f8f8f8] p-3 rounded border border-[#e5e5e5] overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          ) : error ? (
            <div className="space-y-2">
              <div className="text-[#e51400] font-medium mb-2">{error}</div>
              {stackLines.length > 0 && (
                <div className="space-y-1 font-mono text-xs">
                  {stackLines.map((line, index) => (
                    <div key={index} className="text-[#1e1e1e] leading-relaxed">
                      {line.trim()}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-[#616161] font-mono">No output available</div>
          )}
        </div>
      )}

      {isExpanded && activeTab === "run-logs" && (
        <div className="max-h-[300px] overflow-y-auto bg-white">
          {logs.length > 0 ? (
            <div className="divide-y divide-[#e5e5e5]">
              {logs.map((log, index) => {
                const { emoji, text } = parseLogMessage(log.message)
                return (
                  <div
                    key={index}
                    className="px-4 py-3 hover:bg-[#f8f8f8] transition-colors flex items-start gap-3 group"
                  >
                    <CheckCircle className="h-4 w-4 text-[#16825d] flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0 flex items-start gap-2">
                      {emoji && <span className="text-base flex-shrink-0">{emoji}</span>}
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] leading-relaxed text-[#1e1e1e] break-words">{text}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#616161] flex-shrink-0 mt-0.5">
                      <Clock className="h-3 w-3" />
                      <span className="font-mono">{formatTime(log.timestamp)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="px-4 py-3 text-xs text-[#616161]">No logs available</div>
          )}
        </div>
      )}
    </div>
  )
}
