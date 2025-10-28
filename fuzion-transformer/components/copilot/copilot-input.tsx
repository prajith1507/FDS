"use client"

import { useState, useRef, useEffect, type KeyboardEvent } from "react"
import { Send, Loader2, Paperclip, Settings2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SuggestionList } from "./suggestion-list"
import type { Suggestion, AIModel, KeySuggestion, SelectedSources, SourceSuggestion } from "@/types/copilot"
import type { ApiKeysResponse } from "@/types/api"
import { fetchKeys } from "@/lib/api-service"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface CopilotInputProps {
  onSend: (message: string, sources: SelectedSources) => void // Updated to pass sources separately
  suggestions: Suggestion[]
  onTriggerChange: (trigger: "@" | "/" | null, query: string) => void
  isLoading?: boolean
  placeholder?: string
  selectedModel: string
  availableModels: AIModel[]
  onModelChange: (modelId: string) => void
}

export function CopilotInput({
  onSend,
  suggestions,
  onTriggerChange,
  isLoading,
  placeholder = "Add keys (@), sources (/)",
  selectedModel,
  availableModels,
  onModelChange,
}: CopilotInputProps) {
  const [input, setInput] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)
  const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0 })
  const [currentTrigger, setCurrentTrigger] = useState<"@" | "/" | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const [keySuggestions, setKeySuggestions] = useState<KeySuggestion[]>([])
  const [sourceSuggestions, setSourceSuggestions] = useState<SourceSuggestion[]>([])
  const [selectedSources, setSelectedSources] = useState<SelectedSources>({ api: [], collection: [] })
  const [recentlyUsedKeys, setRecentlyUsedKeys] = useState<string[]>([])
  const [allKeys, setAllKeys] = useState<ApiKeysResponse["data"] | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem("copilot-recent-keys")
    if (stored) {
      try {
        setRecentlyUsedKeys(JSON.parse(stored))
      } catch (e) {
        console.error("[v0] Failed to parse recent keys:", e)
      }
    }
  }, [])

  useEffect(() => {
    if ((currentTrigger === "@" || currentTrigger === "/") && !allKeys) {
      fetchKeys()
        .then((response) => {
          setAllKeys(response.data)
        })
        .catch((error) => {
          console.error("[v0] Failed to fetch keys:", error)
        })
    }
  }, [currentTrigger, allKeys])

  useEffect(() => {
    if (currentTrigger === "@" && allKeys) {
      const suggestions: KeySuggestion[] = []
      const query = searchQuery.toLowerCase()

      allKeys.apis.forEach((api) => {
        api.keys.forEach((key) => {
          if (key.toLowerCase().includes(query)) {
            suggestions.push({
              type: "field",
              value: key,
              label: key,
              description: api.api_name,
              category: "apis",
              sourceId: api.api_id,
              sourceType: "api",
              sourceName: api.api_name,
              highlightText: searchQuery,
            })
          }
        })
      })

      allKeys.collections.forEach((collection) => {
        collection.keys.forEach((key) => {
          if (key.toLowerCase().includes(query)) {
            suggestions.push({
              type: "field",
              value: key,
              label: key,
              description: collection.collection_name,
              category: "collections",
              sourceId: collection.collection_name,
              sourceType: "collection",
              sourceName: collection.collection_name,
              highlightText: searchQuery,
            })
          }
        })
      })

      suggestions.sort((a, b) => {
        const aRecent = recentlyUsedKeys.indexOf(a.value)
        const bRecent = recentlyUsedKeys.indexOf(b.value)
        if (aRecent !== -1 && bRecent !== -1) return aRecent - bRecent
        if (aRecent !== -1) return -1
        if (bRecent !== -1) return 1
        return 0
      })

      setKeySuggestions(suggestions)
    }
  }, [currentTrigger, searchQuery, allKeys, recentlyUsedKeys])

  useEffect(() => {
    if (currentTrigger === "/" && allKeys) {
      const suggestions: SourceSuggestion[] = []
      const query = searchQuery.toLowerCase()

      allKeys.apis.forEach((api) => {
        if (api.api_name.toLowerCase().includes(query)) {
          suggestions.push({
            type: "file",
            value: api.api_name,
            label: api.api_name,
            description: `${api.keys.length} keys`,
            category: "apis",
            sourceId: api.api_id,
            sourceType: "api",
            sourceName: api.api_name,
          })
        }
      })

      allKeys.collections.forEach((collection) => {
        if (collection.collection_name.toLowerCase().includes(query)) {
          suggestions.push({
            type: "file",
            value: collection.collection_name,
            label: collection.collection_name,
            description: `${collection.keys.length} keys`,
            category: "collections",
            sourceId: collection.collection_name,
            sourceType: "collection",
            sourceName: collection.collection_name,
          })
        }
      })

      setSourceSuggestions(suggestions)
    }
  }, [currentTrigger, searchQuery, allKeys])

  useEffect(() => {
    setSelectedSuggestionIndex(0)
  }, [suggestions, keySuggestions, sourceSuggestions])

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = "auto"

      if (input.trim() === "") {
        // When empty, set to minimum height (2 lines)
        textarea.style.height = "40px"
      } else {
        // Expand to fit content, with a max height
        const newHeight = Math.min(textarea.scrollHeight, 200)
        textarea.style.height = `${newHeight}px`
      }
    }
  }, [input])

  const updateSourcesFromInput = (text: string) => {
    if (!allKeys) return

    console.log("[v0] Updating sources from input:", text)

    const keyMentionRegex = /@(\S+)/g
    const keyMentions = Array.from(text.matchAll(keyMentionRegex)).map((match) => match[1])

    const sourceMentionRegex = /\/(\S+)/g
    const sourceMentions = Array.from(text.matchAll(sourceMentionRegex)).map((match) => match[1])

    console.log("[v0] Extracted key mentions:", keyMentions)
    console.log("[v0] Extracted source mentions:", sourceMentions)

    const newSources: SelectedSources = { api: [], collection: [] }

    keyMentions.forEach((mention) => {
      for (const api of allKeys.apis) {
        if (api.keys.includes(mention)) {
          if (!newSources.api.includes(api.api_id)) {
            newSources.api.push(api.api_id)
          }
          console.log("[v0] Found key mention in API:", mention, "->", api.api_name)
          return
        }
      }

      for (const collection of allKeys.collections) {
        if (collection.keys.includes(mention)) {
          if (!newSources.collection.includes(collection.collection_name)) {
            newSources.collection.push(collection.collection_name)
          }
          console.log("[v0] Found key mention in Collection:", mention, "->", collection.collection_name)
          return
        }
      }

      console.log("[v0] No source found for key mention:", mention)
    })

    sourceMentions.forEach((mention) => {
      const api = allKeys.apis.find((a) => a.api_name === mention)
      if (api) {
        if (!newSources.api.includes(api.api_id)) {
          newSources.api.push(api.api_id)
        }
        console.log("[v0] Found source mention (API):", mention)
        return
      }

      const collection = allKeys.collections.find((c) => c.collection_name === mention)
      if (collection) {
        if (!newSources.collection.includes(collection.collection_name)) {
          newSources.collection.push(collection.collection_name)
        }
        console.log("[v0] Found source mention (Collection):", mention)
        return
      }

      console.log("[v0] No source found for source mention:", mention)
    })

    console.log("[v0] New sources:", newSources)
    setSelectedSources(newSources)
  }

  const handleInputChange = (value: string) => {
    setInput(value)

    updateSourcesFromInput(value)

    const cursorPosition = textareaRef.current?.selectionStart || 0
    const textBeforeCursor = value.slice(0, cursorPosition)

    const atMatch = textBeforeCursor.lastIndexOf("@")
    const slashMatch = textBeforeCursor.lastIndexOf("/")

    const matches = [
      { trigger: "@" as const, pos: atMatch },
      { trigger: "/" as const, pos: slashMatch },
    ].filter((m) => m.pos !== -1)

    if (matches.length === 0) {
      setShowSuggestions(false)
      setCurrentTrigger(null)
      setSearchQuery("")
      onTriggerChange(null, "")
      return
    }

    const lastMatch = matches.reduce((prev, curr) => (curr.pos > prev.pos ? curr : prev))

    const textAfterTrigger = textBeforeCursor.slice(lastMatch.pos + 1)
    if (textAfterTrigger.includes(" ")) {
      setShowSuggestions(false)
      setCurrentTrigger(null)
      setSearchQuery("")
      onTriggerChange(null, "")
      return
    }

    setShowSuggestions(true)
    setCurrentTrigger(lastMatch.trigger)
    setSearchQuery(textAfterTrigger)
    onTriggerChange(lastMatch.trigger, textAfterTrigger)

    if (textareaRef.current && containerRef.current) {
      setSuggestionPosition({
        top: -400,
        left: 0,
      })
    }
  }

  const handleSuggestionSelect = (suggestion: Suggestion) => {
    const cursorPosition = textareaRef.current?.selectionStart || 0
    const textBeforeCursor = input.slice(0, cursorPosition)

    const atMatch = textBeforeCursor.lastIndexOf("@")
    const slashMatch = textBeforeCursor.lastIndexOf("/")

    const triggerPos = Math.max(atMatch, slashMatch)

    if (triggerPos !== -1) {
      if (currentTrigger === "@") {
        setRecentlyUsedKeys((prev) => {
          const newRecent = [suggestion.value, ...prev.filter((k) => k !== suggestion.value)].slice(0, 10)
          localStorage.setItem("copilot-recent-keys", JSON.stringify(newRecent))
          return newRecent
        })
      }

      const prefix = currentTrigger === "@" ? "@" : "/"
      const newInput = input.slice(0, triggerPos) + prefix + suggestion.value + " " + input.slice(cursorPosition)
      setInput(newInput)

      updateSourcesFromInput(newInput)

      setShowSuggestions(false)
      setCurrentTrigger(null)
      setSearchQuery("")
      onTriggerChange(null, "")

      setTimeout(() => {
        textareaRef.current?.focus()
        const newCursorPos = triggerPos + prefix.length + suggestion.value.length + 1
        textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos)
      }, 0)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const currentSuggestions =
      currentTrigger === "@" ? keySuggestions : currentTrigger === "/" ? sourceSuggestions : suggestions

    if (showSuggestions && currentSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedSuggestionIndex((prev) => (prev + 1) % currentSuggestions.length)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedSuggestionIndex((prev) => (prev - 1 + currentSuggestions.length) % currentSuggestions.length)
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSuggestionSelect(currentSuggestions[selectedSuggestionIndex])
      } else if (e.key === "Escape") {
        setShowSuggestions(false)
        setCurrentTrigger(null)
        setSearchQuery("")
        onTriggerChange(null, "")
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSend(input.trim(), selectedSources)
      setInput("")
      setShowSuggestions(false)
      setCurrentTrigger(null)
      setSearchQuery("")
      onTriggerChange(null, "")
      setSelectedSources({ api: [], collection: [] })
    }
  }

  const currentModel = availableModels.find((m) => m.id === selectedModel)
  const currentSuggestions =
    currentTrigger === "@" ? keySuggestions : currentTrigger === "/" ? sourceSuggestions : suggestions

  return (
    <div ref={containerRef} className="relative flex flex-col border-t border-border bg-background">
      {showSuggestions && currentSuggestions.length > 0 && (
        <SuggestionList
          suggestions={currentSuggestions}
          selectedIndex={selectedSuggestionIndex}
          onSelect={handleSuggestionSelect}
          position={suggestionPosition}
          highlightText={currentTrigger === "@" ? searchQuery : undefined}
        />
      )}

      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
          <Paperclip className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
          <Settings2 className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-xs">transformation.js</span>
        </div>
      </div>

      <div className="p-2">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="max-h-[200px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 overflow-auto"
          style={{ height: "40px" }}
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-border">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-xs">
                Agent
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>Default Agent</DropdownMenuItem>
              <DropdownMenuItem>Transform Agent</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-xs">
                {currentModel ? `${currentModel.name}` : selectedModel}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[300px]">
              {availableModels.map((model) => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => onModelChange(model.id)}
                  className="flex flex-col items-start"
                >
                  <div className="font-medium">
                    {model.provider} {model.name}
                  </div>
                  {model.description && <div className="text-xs text-muted-foreground">{model.description}</div>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings2 className="h-4 w-4" />
          </Button>
          <Button onClick={handleSend} disabled={!input.trim() || isLoading} size="icon" className="h-8 w-8">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
