"use client"

import { useMemo, useState } from "react"
import CodeMirror from "@uiw/react-codemirror"
import { javascript } from "@codemirror/lang-javascript"
import { json } from "@codemirror/lang-json"
import { EditorView } from "@codemirror/view"
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language"
import { tags } from "@lezer/highlight"
import type { Extension } from "@codemirror/state"
import { Button } from "@/components/ui/button"
import { Wand2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CodeEditorProps {
  content: string
  extension: string
  fileName: string
  onChange?: (value: string) => void
}

export function CodeEditor({ content, extension, fileName, onChange }: CodeEditorProps) {
  const [isFormatting, setIsFormatting] = useState(false)
  const { toast } = useToast()

  // Determine language based on file extension
  const language = useMemo(() => {
    const ext = extension.toLowerCase()
    if (ext === "json") return json()
    if (ext === "js" || ext === "jsx" || ext === "ts" || ext === "tsx")
      return javascript({ jsx: true, typescript: ext.includes("ts") })
    return javascript() // Default to JavaScript
  }, [extension])

  // Custom syntax highlighting for JSON with distinct colors for keys and values
  const jsonHighlighting = HighlightStyle.define([
    { tag: tags.propertyName, color: "#0451a5", fontWeight: "bold" }, // JSON keys - blue and bold
    { tag: tags.string, color: "#a31515" }, // String values - red
    { tag: tags.number, color: "#098658" }, // Numbers - green
    { tag: tags.bool, color: "#0000ff" }, // Booleans - blue
    { tag: tags.null, color: "#0000ff" }, // Null - blue
    { tag: tags.keyword, color: "#0000ff" }, // Keywords - blue
    { tag: tags.punctuation, color: "#000000" }, // Brackets, commas - black
    { tag: tags.bracket, color: "#000000" }, // Brackets - black
  ])

  const theme = EditorView.theme(
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
    },
    { dark: false },
  )

  const extensions: Extension[] = [language, theme, syntaxHighlighting(jsonHighlighting), EditorView.lineWrapping]

  const handleFormat = async () => {
    setIsFormatting(true)
    try {
      const response = await fetch("/api/format-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: content,
          parser: extension === "json" ? "json" : extension.includes("ts") ? "typescript" : "babel",
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || error.error || "Failed to format code")
      }

      const { formatted } = await response.json()
      if (onChange) {
        onChange(formatted)
      }

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
    <div className="h-full flex flex-col bg-white relative">
      {/* Breadcrumb */}
      <div className="px-4 py-2 text-xs text-gray-600 border-b border-gray-200 font-mono bg-gray-50 flex items-center justify-between">
        <span>{fileName}</span>
        <Button
          size="sm"
          variant="outline"
          onClick={handleFormat}
          disabled={isFormatting}
          className="h-6 text-xs bg-transparent"
        >
          <Wand2 className="h-3 w-3 mr-1" />
          {isFormatting ? "Formatting..." : "Format"}
        </Button>
      </div>

      {/* Code content with CodeMirror */}
      <div className="flex-1 overflow-auto">
        <CodeMirror
          value={content}
          onChange={onChange}
          extensions={extensions}
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
            rectangularSelection: true,
            crosshairCursor: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            searchKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
          style={{ height: "100%", fontSize: "13px" }}
        />
      </div>
    </div>
  )
}
