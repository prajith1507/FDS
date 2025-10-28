"use client"

import { useState, useEffect } from "react"
import { Terminal, ChevronUp, ChevronDown, X, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export type ConsoleEntry = {
  id: string
  timestamp: Date
  method: string
  url: string
  status?: number
  statusText?: string
  timeMs: number
  type: "request" | "response" | "error"
  headers?: Record<string, string>
  error?: string
  requestHeaders?: Record<string, string>
  responseHeaders?: Record<string, string>
}

type ConsolePanelProps = {
  entries: ConsoleEntry[]
  onClear: () => void
}

export function ConsolePanel({ entries, onClear }: ConsolePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null)

  const getStatusColor = (status?: number) => {
    if (!status) return "text-red-500"
    if (status >= 200 && status < 300) return "text-green-500"
    if (status >= 300 && status < 400) return "text-yellow-500"
    if (status >= 400) return "text-red-500"
    return "text-gray-500"
  }

  const getStatusIcon = (entry: ConsoleEntry) => {
    if (entry.error) return <XCircle className="h-4 w-4 text-red-500" />
    if (entry.status && entry.status >= 200 && entry.status < 300) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    if (entry.status && entry.status >= 400) {
      return <XCircle className="h-4 w-4 text-red-500" />
    }
    return <AlertCircle className="h-4 w-4 text-yellow-500" />
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    })
  }

  const selectedEntryData = entries.find(e => e.id === selectedEntry)

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 bg-background border rounded-lg shadow-lg",
            "hover:bg-muted/50 transition-colors",
            entries.length > 0 && entries[entries.length - 1]?.error && "border-red-500",
            entries.length > 0 && !entries[entries.length - 1]?.error && "border-green-500"
          )}
          title="Open Console (API Call History)"
        >
          <Terminal className="h-4 w-4" />
          <span className="text-sm font-medium">Console</span>
          {entries.length > 0 && (
            <span className="bg-muted px-1.5 py-0.5 rounded text-xs">
              {entries.length}
            </span>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4" />
          <span className="font-medium">Console</span>
          <span className="text-xs text-muted-foreground">
            ({entries.length}/10 API calls)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            disabled={entries.length === 0}
            className="text-xs px-2 py-1 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear
          </button>
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1 hover:bg-muted rounded"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex h-80">
        {/* Left Panel - Entry List */}
        <div className="w-2/3 border-r overflow-y-auto">
          {entries.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No API calls yet</p>
                <p className="text-xs">Send a request to see debugging information</p>
              </div>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => setSelectedEntry(entry.id)}
                  className={cn(
                    "p-3 rounded cursor-pointer border transition-colors",
                    selectedEntry === entry.id ? "bg-muted border-border" : "hover:bg-muted/50 border-transparent"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(entry)}
                      <span className="font-mono text-xs font-medium">
                        {entry.method}
                      </span>
                      <span className={cn("text-xs font-medium", getStatusColor(entry.status))}>
                        {entry.status || "ERR"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{entry.timeMs}ms</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mb-1 font-mono truncate">
                    {entry.url}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatTime(entry.timestamp)}
                  </div>
                  {entry.error && (
                    <div className="text-xs text-red-500 mt-1 truncate">
                      {entry.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel - Entry Details */}
        <div className="w-1/3 overflow-y-auto">
          {selectedEntryData ? (
            <div className="p-4 space-y-4">
              <div>
                <h3 className="font-medium mb-2">Request Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Method:</span>
                    <span className="ml-2 font-mono">{selectedEntryData.method}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">URL:</span>
                    <div className="mt-1 p-2 bg-muted rounded text-xs font-mono break-all">
                      {selectedEntryData.url}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Time:</span>
                    <span className="ml-2">{formatTime(selectedEntryData.timestamp)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="ml-2">{selectedEntryData.timeMs}ms</span>
                  </div>
                </div>
              </div>

              {selectedEntryData.requestHeaders && Object.keys(selectedEntryData.requestHeaders).length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Request Headers</h4>
                  <div className="space-y-1">
                    {Object.entries(selectedEntryData.requestHeaders).map(([key, value]) => (
                      <div key={key} className="text-xs">
                        <span className="text-muted-foreground font-mono">{key}:</span>
                        <span className="ml-2 font-mono">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedEntryData.status && (
                <div>
                  <h4 className="font-medium mb-2">Response</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <span className={cn("ml-2 font-mono", getStatusColor(selectedEntryData.status))}>
                        {selectedEntryData.status} {selectedEntryData.statusText}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {selectedEntryData.responseHeaders && Object.keys(selectedEntryData.responseHeaders).length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Response Headers</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {Object.entries(selectedEntryData.responseHeaders).map(([key, value]) => (
                      <div key={key} className="text-xs">
                        <span className="text-muted-foreground font-mono">{key}:</span>
                        <span className="ml-2 font-mono">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedEntryData.error && (
                <div>
                  <h4 className="font-medium mb-2 text-red-500">Error</h4>
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-xs font-mono text-red-700 whitespace-pre-wrap">
                    {selectedEntryData.error}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <AlertCircle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select an entry to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}