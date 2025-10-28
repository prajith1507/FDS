"use client"

import { cn } from "@/lib/utils"
import type { Suggestion, KeySuggestion } from "@/types/copilot"
import { FileText, Hash, Terminal, Zap, Database } from "lucide-react"

interface SuggestionListProps {
  suggestions: Suggestion[]
  selectedIndex: number
  onSelect: (suggestion: Suggestion) => void
  position: { top: number; left: number }
  highlightText?: string
}

export function SuggestionList({ suggestions, selectedIndex, onSelect, position, highlightText }: SuggestionListProps) {
  if (suggestions.length === 0) return null

  const getIcon = (suggestion: Suggestion) => {
    if ("sourceType" in suggestion) {
      const typedSuggestion = suggestion as KeySuggestion | { sourceType: "api" | "collection" }
      if (typedSuggestion.sourceType === "api") {
        return <Zap className="h-4 w-4 text-blue-500" />
      } else if (typedSuggestion.sourceType === "collection") {
        return <Database className="h-4 w-4 text-green-500" />
      }
    }

    // Default icons for other types
    switch (suggestion.type) {
      case "file":
        return <FileText className="h-4 w-4 text-yellow-500" />
      case "field":
        return <Hash className="h-4 w-4 text-yellow-500" />
      case "command":
        return <Terminal className="h-4 w-4 text-yellow-500" />
    }
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text

    const index = text.toLowerCase().indexOf(query.toLowerCase())
    if (index === -1) return text

    return (
      <>
        {text.slice(0, index)}
        <span className="text-blue-500 font-semibold">{text.slice(index, index + query.length)}</span>
        {text.slice(index + query.length)}
      </>
    )
  }

  // Group suggestions by category
  const grouped = suggestions.reduce(
    (acc, suggestion) => {
      const category = suggestion.category || "Other"
      if (!acc[category]) acc[category] = []
      acc[category].push(suggestion)
      return acc
    },
    {} as Record<string, Suggestion[]>,
  )

  let currentIndex = 0

  return (
    <div
      className="absolute z-50 w-[600px] max-h-80 overflow-auto bg-popover border border-border rounded-lg shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      <div className="px-3 py-2 flex items-center justify-between border-b border-border sticky top-0 bg-popover">
        <span className="text-xs font-semibold text-muted-foreground">recently opened</span>
        <div className="flex items-center gap-2">
          <button className="text-muted-foreground hover:text-foreground">
            <FileText className="h-4 w-4" />
          </button>
          <button className="text-muted-foreground hover:text-foreground">×</button>
        </div>
      </div>

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          {items.map((suggestion) => {
            const index = currentIndex++
            const isKeySuggestion = "sourceType" in suggestion
            const keySuggestion = isKeySuggestion ? (suggestion as KeySuggestion) : null

            return (
              <button
                key={`${suggestion.value}-${index}`}
                className={cn(
                  "w-full px-3 py-2 flex items-center gap-3 hover:bg-accent text-left transition-colors",
                  selectedIndex === index && "bg-accent",
                )}
                onClick={() => onSelect(suggestion)}
              >
                <div className="text-muted-foreground flex-shrink-0">{getIcon(suggestion)}</div>

                <div className="flex-1 min-w-0 text-sm font-medium truncate">
                  {highlightText ? highlightMatch(suggestion.label, highlightText) : suggestion.label}
                  {keySuggestion && (
                    <span
                      className={cn(
                        "ml-2 text-xs font-normal",
                        keySuggestion.sourceType === "api" ? "text-blue-500" : "text-green-500",
                      )}
                    >
                      ({keySuggestion.sourceName})
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      ))}

      <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border sticky bottom-0 bg-popover text-right">
        file results
      </div>
    </div>
  )
}
