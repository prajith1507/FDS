"use client"
import { useState, useEffect } from "react"
import { FileText, MessageSquare, Code, Info, Minimize2, Maximize2, Edit3 } from "lucide-react"
import { JsonViewer } from "./json-viewer"

// Simple markdown renderer for basic formatting
function renderMarkdown(text: string): string {
  if (!text) return ""
  
  return text
    // Code blocks (must come before inline code)
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-muted p-3 rounded my-2 overflow-auto"><code class="text-sm font-mono">$1</code></pre>')
    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
    // Lists
    .replace(/^\* (.*$)/gim, '<li class="ml-4">• $1</li>')
    .replace(/^- (.*$)/gim, '<li class="ml-4">• $1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li class="ml-4">$1</li>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    // Code inline
    .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
    // Horizontal rule
    .replace(/^---$/gim, '<hr class="my-4 border-border">')
    // Line breaks (double space + newline or double newline)
    .replace(/  \n/g, '<br>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>')
}

type RightSidebarProps = {
  request: {
    name: string
    method: string
    urlRaw?: string
    headers?: Array<{ key: string; value: string }>
    bodyMode?: string
    bodyRaw?: string
    description?: string
    sampleResponse?: any
  } | null
  onUpdateDescription: (desc: string) => void
  onMinimize?: () => void
  onMaximize?: () => void
  width: number
  activeTab?: "docs" | "comments" | "code" | "info"
}

export function RightSidebar({
  request,
  onUpdateDescription,
  onMinimize,
  onMaximize,
  width,
  activeTab = "docs",
}: RightSidebarProps) {
  const [descEdit, setDescEdit] = useState(request?.description || "")
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  
  useEffect(() => {
    setDescEdit(request?.description || "")
  }, [request?.description])

  const isCollapsed = width < 100
  const isExpanded = width >= 300 // Changed from 500 to 300 to work with our 400px width

  if (isCollapsed) {
    return (
      <div className="h-full flex flex-col items-center overflow-hidden bg-card border-l py-4 gap-4">
        <button 
          onClick={() => request && onMaximize?.()} 
          disabled={!request}
          className={`p-2 rounded transition-colors ${
            request 
              ? "hover:text-foreground text-foreground/60 hover:bg-muted/50" 
              : "text-foreground/30 cursor-not-allowed"
          }`}
          aria-label="Maximize sidebar"
          title={request ? "Expand documentation" : "Select a request to view documentation"}
        >
          <Maximize2 className="h-5 w-5" />
        </button>
       
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-card border-l">
      <header className="h-14 border-b flex items-center justify-between px-4 flex-shrink-0">
        <h2 className="text-base font-semibold">
          {activeTab === "docs"
            ? "Documentation"
            : activeTab === "comments"
              ? "Comments"
              : activeTab === "code"
                ? "Code"
                : "Info"}
        </h2>
        <div className="flex items-center gap-2 text-foreground/60">
          {!isCollapsed ? (
            <button 
              onClick={() => onMinimize?.()} 
              className="hover:text-foreground hover:bg-muted/50 p-1 rounded transition-colors" 
              aria-label="Minimize sidebar"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          ) : (
            <button 
              onClick={() => onMaximize?.()} 
              className="hover:text-foreground hover:bg-muted/50 p-1 rounded transition-colors" 
              aria-label="Maximize sidebar"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          )}
       
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {activeTab === "docs" && (
          <>
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 rounded">
              <FileText className="h-4 w-4 text-foreground/70" />
              <span className="text-sm font-mono break-all">{request?.urlRaw || "No URL"}</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Description</label>
                {!isEditingDescription && (
                  <button
                    onClick={() => setIsEditingDescription(true)}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <Edit3 className="h-3 w-3" />
                    Edit
                  </button>
                )}
              </div>
              
              {isEditingDescription ? (
                <div className="space-y-2">
                  <textarea
                    className="w-full h-32 rounded border bg-card p-3 text-sm font-mono"
                    placeholder="Add description (supports markdown: **bold**, *italic*, `code`, # headers, [links](url))"
                    value={descEdit}
                    onChange={(e) => setDescEdit(e.target.value)}
                    onBlur={() => {
                      setIsEditingDescription(false)
                      onUpdateDescription(descEdit)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setIsEditingDescription(false)
                        setDescEdit(request?.description || "")
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>Press Esc to cancel</span>
                    <span>•</span>
                    <span>Click outside to save</span>
                  </div>
                </div>
              ) : (
                <div
                  className="min-h-[60px] p-3 rounded border bg-card cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setIsEditingDescription(true)}
                >
                  {descEdit ? (
                    <div 
                      className="prose prose-sm max-w-none text-sm"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(descEdit) }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Click to add description (supports markdown)
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "comments" && <div className="text-sm text-foreground/70">Comments UI placeholder</div>}
        {activeTab === "code" && <div className="text-sm text-foreground/70">Code snippets UI placeholder</div>}
        {activeTab === "info" && <div className="text-sm text-foreground/70">Request metadata UI placeholder</div>}
      </div>
    </div>
  )
}
