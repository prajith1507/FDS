"use client"

import { useState } from "react"
import { X, Play, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface FilterPanelProps {
  onClose: () => void
  onApplyFilter: (query: string) => void
  currentFilter?: string
}

const QUERY_SNIPPETS = [
  {
    name: "Find by Title",
    query: '{"title": {"$regex": "Matrix", "$options": "i"}}',
    description: "Search movies by title (case-insensitive)",
  },
  {
    name: "Year Range",
    query: '{"year": {"$gte": 2000, "$lte": 2020}}',
    description: "Movies released between 2000-2020",
  },
  {
    name: "High Rated",
    query: '{"imdb.rating": {"$gte": 8.0}}',
    description: "Movies with IMDB rating >= 8.0",
  },
  {
    name: "By Genre",
    query: '{"genres": {"$in": ["Action", "Thriller"]}}',
    description: "Movies in Action or Thriller genres",
  },
  {
    name: "Recent Movies",
    query: '{"year": {"$gte": 2020}}',
    description: "Movies from 2020 onwards",
  },
  {
    name: "By Director",
    query: '{"directors": "Christopher Nolan"}',
    description: "Movies by specific director",
  },
  {
    name: "Long Movies",
    query: '{"runtime": {"$gte": 180}}',
    description: "Movies longer than 3 hours",
  },
  {
    name: "Award Winners",
    query: '{"awards.wins": {"$gte": 10}}',
    description: "Movies with 10+ awards",
  },
]

export function FilterPanel({ onClose, onApplyFilter, currentFilter = "" }: FilterPanelProps) {
  const [query, setQuery] = useState(currentFilter)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [isValidJson, setIsValidJson] = useState(true)
  const [jsonError, setJsonError] = useState<string>("")

  const validateJson = (value: string) => {
    if (!value.trim()) {
      setIsValidJson(true)
      setJsonError("")
      return true
    }

    try {
      JSON.parse(value)
      setIsValidJson(true)
      setJsonError("")
      return true
    } catch (error) {
      setIsValidJson(false)
      setJsonError(error instanceof Error ? error.message : "Invalid JSON")
      return false
    }
  }

  const handleQueryChange = (value: string) => {
    setQuery(value)
    validateJson(value)
  }

  const handleApply = () => {
    if (isValidJson) {
      onApplyFilter(query)
    }
  }

  const handleClear = () => {
    setQuery("")
    setIsValidJson(true)
    setJsonError("")
  }

  const handleSnippetClick = (snippetQuery: string) => {
    setQuery(snippetQuery)
    validateJson(snippetQuery)
  }

  const handleCopySnippet = (snippetQuery: string, index: number) => {
    navigator.clipboard.writeText(snippetQuery)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-[500px] border-l border-border bg-card shadow-2xl">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Query Filter</h2>
            <p className="text-sm text-muted-foreground">Build MongoDB queries to filter data</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Query Editor */}
        <div className="border-b border-border p-4">
          <label className="mb-2 block text-sm font-medium text-foreground">MongoDB Query</label>
          <Textarea
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder='{"field": "value"}'
            className={`min-h-[120px] font-mono text-sm ${!isValidJson ? "border-red-500 focus-visible:ring-red-500" : ""}`}
          />
          {!isValidJson && jsonError && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              ⚠️ {jsonError}
            </p>
          )}
          {isValidJson && query.trim() && (
            <p className="mt-2 text-xs text-green-600 dark:text-green-400">
              ✓ Valid JSON
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <Button 
              onClick={handleApply} 
              className="flex-1" 
              disabled={!query.trim() || !isValidJson}
            >
              <Play className="mr-2 h-4 w-4" />
              Apply Filter
            </Button>
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
          </div>
        </div>

        {/* Query Snippets */}
        <div className="flex-1 overflow-auto p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Query Snippets</h3>
          <div className="space-y-2">
            {QUERY_SNIPPETS.map((snippet, index) => (
              <div
                key={index}
                className="group rounded-lg border border-border bg-background p-3 transition-colors hover:border-primary/50 hover:bg-accent"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-foreground">{snippet.name}</h4>
                    <p className="text-xs text-muted-foreground">{snippet.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => handleCopySnippet(snippet.query, index)}
                    >
                      {copiedIndex === index ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
                <code
                  className="block cursor-pointer rounded bg-muted p-2 text-xs font-mono text-foreground hover:bg-muted/80"
                  onClick={() => handleSnippetClick(snippet.query)}
                >
                  {snippet.query}
                </code>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="border-t border-border bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">
            Click on any snippet to use it, or write your own MongoDB query. The query will be sent to the API to filter
            results.
          </p>
        </div>
      </div>
    </div>
  )
}
