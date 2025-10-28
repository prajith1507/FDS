/**
 * JsonDataViewer Component
 * JSON view with syntax highlighting for NoSQL data
 */

"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { DataRow } from "@/lib/types/data-viewer"
import { cn } from "@/lib/utils"
import { Copy, Check } from "lucide-react"
import { useState } from "react"

interface JsonDataViewerProps {
  rows: DataRow[]
  className?: string
}

export function JsonDataViewer({ rows, className }: JsonDataViewerProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopy = (index: number, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  if (rows.length === 0) {
    return (
      <div className={cn("flex items-center justify-center p-12", className)}>
        <p className="text-muted-foreground">No data to display</p>
      </div>
    )
  }

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="space-y-4 p-4">
        {rows.map((row, index) => {
          // Remove _rowId for display
          const { _rowId, ...displayData } = row
          const jsonString = JSON.stringify(displayData, null, 2)

          return (
            <div
              key={row._rowId || index}
              className="relative group border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              {/* Header with row number and copy button */}
              <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
                <span className="text-xs font-mono text-muted-foreground">
                  Document {index + 1}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleCopy(index, jsonString)}
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>

              {/* JSON Content */}
              <pre className="p-4 overflow-x-auto">
                <code className="text-sm font-mono">{jsonString}</code>
              </pre>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
