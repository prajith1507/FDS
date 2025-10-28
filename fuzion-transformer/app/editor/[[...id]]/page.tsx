"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { FileViewer } from "@/components/file-viewer/file-viewer"
import { TransformationEditor } from "@/components/transformation-editor/transformation-editor"
import { fetchMetadata, transformMetadataToFileSystem, extractDataSources } from "@/lib/api-service"
import { aiModels } from "@/lib/mock-data"
import type { FileNode } from "@/types/file-system"
import type { CopilotConfig, Message } from "@/types/copilot"
import { Loader2, GripVertical } from "lucide-react"

export default function EditorPage() {
  const params = useParams()
  const functionId = params.id?.[0] || null

  const [showDataViewer, setShowDataViewer] = useState(false)
  const [dataViewerWidth, setDataViewerWidth] = useState(500)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const [files, setFiles] = useState<FileNode[]>([])
  const [copilotConfig, setCopilotConfig] = useState<CopilotConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCopilot, setShowCopilot] = useState(true)

  const [copilotMessages, setCopilotMessages] = useState<Message[]>([])
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [transformationCode, setTransformationCode] = useState<string>("")
  const [functionName, setFunctionName] = useState<string>("")
  const [functionData, setFunctionData] = useState<any>(null)

  const handleCodeGenerated = (code: string) => {
    console.log("[v0] page.tsx - handleCodeGenerated called with code length:", code?.length)
    setTransformationCode(code)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      const container = containerRef.current
      const rect = container.getBoundingClientRect()
      const newWidth = e.clientX - rect.left

      if (newWidth >= 300 && newWidth <= 800) {
        setDataViewerWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "1") {
        event.preventDefault()
        setShowDataViewer((current) => !current)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        // Load metadata
        const metadata = await fetchMetadata()
        const fileSystem = transformMetadataToFileSystem(metadata.data)
        setFiles(fileSystem)

        const dataSources = extractDataSources(metadata.data)

        if (functionId) {
          const response = await fetch(`/api/generated-functions/${functionId}`)
          if (response.ok) {
            const result = await response.json()
            // Handle nested data structure
            const data = result.data?.function || result.data || result
            console.log("[v0] Loaded function data:", data)
            setFunctionData(data)
            setTransformationCode(data.code || "")
            setFunctionName(data.name || "")
          }
        }

        const config: CopilotConfig = {
          dataSources,
          availableModels: aiModels,
          defaultModel: aiModels[0].id,
          commands: [
            {
              id: "transform",
              name: "Generate Transform Function",
              description: "Generate a data transformation function",
              icon: "⚡",
            },
            {
              id: "map",
              name: "Map Fields",
              description: "Map fields between data sources",
              icon: "🔗",
            },
            {
              id: "validate",
              name: "Validate Data",
              description: "Generate validation logic",
              icon: "✓",
            },
            {
              id: "clean",
              name: "Clean Data",
              description: "Generate data cleaning function",
              icon: "🧹",
            },
          ],
          onSendMessage: async (message, context, model) => {
            await new Promise((resolve) => setTimeout(resolve, 1000))

            const files = context.filter((c) => c.startsWith("@"))
            const fields = context.filter((c) => c.startsWith("#"))

            return `I'll help you with that transformation using **${model || "GPT-4 Turbo"}**. 

**Context:**
${files.length > 0 ? `\nFiles: ${files.join(", ")}` : ""}
${fields.length > 0 ? `\nFields: ${fields.join(", ")}` : ""}

Here's a sample transformation function:

\`\`\`typescript
export function transformData(source: any) {
  return {
    // Your transformation logic here
    ...source
  }
}
\`\`\`

Would you like me to refine this based on specific requirements?`
          },
        }

        setCopilotConfig(config)
        setSelectedModel(config.defaultModel || aiModels[0].id)
      } catch (err) {
        console.error("[v0] Error loading data:", err)
        setError(err instanceof Error ? err.message : "Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [functionId])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">Failed to Load Editor</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!copilotConfig) {
    return null
  }

  return (
    <div ref={containerRef} className="h-screen bg-background flex">
      {showDataViewer && (
        <div
          style={{ width: `${dataViewerWidth}px` }}
          className="h-full overflow-hidden flex-shrink-0 border-r border-border"
        >
          <FileViewer
            files={files}
            copilotConfig={copilotConfig}
            mode="viewer"
            onModeChange={() => {}}
            showCopilot={false}
            onToggleCopilot={() => {}}
            copilotMessages={[]}
            setCopilotMessages={() => {}}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            onCodeGenerated={handleCodeGenerated}
            onClose={() => setShowDataViewer(false)}
          />
        </div>
      )}

      {showDataViewer && (
        <div
          className="w-1 bg-border hover:bg-primary cursor-col-resize flex items-center justify-center group relative flex-shrink-0"
          onMouseDown={() => setIsDragging(true)}
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
          <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <TransformationEditor
          copilotConfig={copilotConfig}
          mode="editor"
          onModeChange={() => {}}
          showCopilot={showCopilot}
          onToggleCopilot={() => setShowCopilot(!showCopilot)}
          copilotMessages={copilotMessages}
          setCopilotMessages={setCopilotMessages}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          transformationCode={transformationCode}
          setTransformationCode={handleCodeGenerated}
          showDataViewer={showDataViewer}
          onToggleDataViewer={() => setShowDataViewer(!showDataViewer)}
          functionId={functionId}
          functionName={functionName}
          functionData={functionData}
          setFunctionData={setFunctionData}
        />
      </div>
    </div>
  )
}
