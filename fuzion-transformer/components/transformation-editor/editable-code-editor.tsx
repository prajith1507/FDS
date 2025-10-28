"use client"

import { useRef, useState, useEffect } from "react"
import CodeMirror from "@uiw/react-codemirror"
import { javascript } from "@codemirror/lang-javascript"
import { EditorView } from "@codemirror/view"
import { autocompletion, type CompletionContext, type CompletionResult } from "@codemirror/autocomplete"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Wand2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { fetchKeys } from "@/lib/api-service"
import type { ApiKeysResponse } from "@/types/api"

interface EditableCodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  className?: string
}

const vsCodeLightTheme = EditorView.theme(
  {
    "&": {
      color: "#000000",
      backgroundColor: "#ffffff",
      fontSize: "13px",
      fontFamily: "'Consolas', 'Courier New', monospace",
    },
    ".cm-content": {
      caretColor: "#000000",
      padding: "16px 0",
      userSelect: "text",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "#000000",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
      backgroundColor: "#add6ff !important",
    },
    ".cm-content ::selection": {
      backgroundColor: "#add6ff !important",
    },
    ".cm-line ::selection": {
      backgroundColor: "#add6ff !important",
    },
    // Removed active line highlighting
    ".cm-activeLine": {
      backgroundColor: "transparent",
    },
    ".cm-gutters": {
      backgroundColor: "#f3f3f3",
      color: "#237893",
      border: "none",
      borderRight: "1px solid #e7e7e7",
      paddingLeft: "8px",
      paddingRight: "8px",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "transparent",
    },
    ".cm-lineNumbers .cm-gutterElement": {
      padding: "0 8px 0 0",
      minWidth: "30px",
      textAlign: "right",
    },
    ".cm-tooltip-autocomplete": {
      backgroundColor: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: "6px",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      maxHeight: "300px",
      overflow: "auto",
    },
    ".cm-tooltip-autocomplete ul": {
      fontFamily: "'Inter', sans-serif",
      fontSize: "13px",
    },
    ".cm-tooltip-autocomplete ul li": {
      padding: "6px 12px",
      cursor: "pointer",
    },
    ".cm-tooltip-autocomplete ul li[aria-selected]": {
      backgroundColor: "#f3f4f6",
    },
    ".cm-completionLabel": {
      color: "#111827",
    },
    ".cm-completionDetail": {
      color: "#6b7280",
      fontSize: "12px",
      marginLeft: "8px",
    },
  },
  { dark: false },
)

const vsCodeLightHighlightStyle = [
  { tag: "keyword", color: "#0000ff" },
  { tag: "string", color: "#a31515" },
  { tag: "comment", color: "#008000" },
  { tag: "number", color: "#098658" },
  { tag: "function", color: "#795e26" },
  { tag: "variableName", color: "#001080" },
  { tag: "operator", color: "#000000" },
  { tag: "propertyName", color: "#001080" },
  { tag: "typeName", color: "#267f99" },
  { tag: "className", color: "#267f99" },
  { tag: "punctuation", color: "#000000" },
]

export function EditableCodeEditor({ value, onChange, language = "javascript", className }: EditableCodeEditorProps) {
  const editorRef = useRef<any>(null)
  const [isFormatting, setIsFormatting] = useState(false)
  const [keysData, setKeysData] = useState<ApiKeysResponse["data"] | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchKeys()
      .then((response) => {
        setKeysData(response.data)
      })
      .catch((error) => {
        console.error("[v0] Failed to fetch keys for autocompletion:", error)
      })
  }, [])

  const atMentionCompletion = (context: CompletionContext): CompletionResult | null => {
    if (!keysData) return null

    const word = context.matchBefore(/@\w*/)
    if (!word) return null
    if (word.from === word.to && !context.explicit) return null

    const searchQuery = word.text.slice(1).toLowerCase() // Remove @ and lowercase

    const options: Array<{ label: string; type: string; detail?: string; info?: string }> = []

    // Add keys from APIs
    keysData.apis.forEach((api) => {
      api.keys.forEach((key) => {
        if (key.toLowerCase().includes(searchQuery)) {
          options.push({
            label: key,
            type: "variable",
            detail: `🔌 API: ${api.api_name}`,
            info: `API key from ${api.api_name}`,
          })
        }
      })
    })

    // Add keys from collections
    keysData.collections.forEach((collection) => {
      collection.keys.forEach((key) => {
        if (key.toLowerCase().includes(searchQuery)) {
          options.push({
            label: key,
            type: "variable",
            detail: `🗄️ DB: ${collection.collection_name}`,
            info: `Database key from ${collection.collection_name}`,
          })
        }
      })
    })

    // Sort by relevance (exact matches first, then alphabetically)
    options.sort((a, b) => {
      const aKey = a.label.toLowerCase()
      const bKey = b.label.toLowerCase()
      const aExact = aKey === searchQuery
      const bExact = bKey === searchQuery
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      return aKey.localeCompare(bKey)
    })

    return {
      from: word.from + 1, // Start after the @ symbol
      options: options.slice(0, 50), // Limit to 50 suggestions
    }
  }

  const handleFormat = async () => {
    setIsFormatting(true)
    try {
      const response = await fetch("/api/format-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: value,
          parser: language === "typescript" ? "typescript" : "babel",
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || error.error || "Failed to format code")
      }

      const { formatted } = await response.json()
      onChange(formatted)

      toast({
        title: "Code formatted",
        description: "Your code has been formatted successfully.",
      })
    } catch (error) {
      console.error("[v0] Format error:", error)
      toast({
        title: "Format failed",
        description: error instanceof Error ? error.message : "Failed to format code",
        variant: "destructive",
      })
    } finally {
      setIsFormatting(false)
    }
  }

  return (
    <div className={cn("h-full w-full overflow-hidden relative", className)}>
      <div className="absolute top-2 right-2 z-10">
        <Button
          size="sm"
          variant="outline"
          onClick={handleFormat}
          disabled={isFormatting}
          className="bg-white/90 backdrop-blur-sm hover:bg-white"
        >
          <Wand2 className="h-3.5 w-3.5 mr-1.5" />
          {isFormatting ? "Formatting..." : "Format"}
        </Button>
      </div>

      <CodeMirror
        value={value}
        height="100%"
        extensions={[
          javascript({ jsx: true, typescript: true }),
          autocompletion({
            override: [atMentionCompletion],
            activateOnTyping: true,
            maxRenderedOptions: 50,
          }),
        ]}
        onChange={(value) => onChange(value)}
        theme={vsCodeLightTheme}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: false,
          highlightActiveLine: false,
          foldGutter: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          searchKeymap: true,
          foldKeymap: true,
          completionKeymap: true,
          lintKeymap: true,
        }}
        style={{
          height: "100%",
          fontSize: "13px",
        }}
      />
    </div>
  )
}
