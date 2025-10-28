"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ResizableCopilot } from "../copilot/resizable-copilot"
import { EditableCodeEditor } from "./editable-code-editor"
import { ErrorPanel } from "./error-panel"
import { SaveFunctionDialog } from "./save-function-dialog"
import type { TransformFunction } from "@/types/transformation"
import type { CopilotConfig, Message } from "@/types/copilot"
import { MessageSquare, Play, Save, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { testFunction, saveGeneratedFunction, updateGeneratedFunction } from "@/lib/api-service"
import { useToast } from "@/hooks/use-toast"

interface TransformationEditorProps {
  copilotConfig: CopilotConfig
  mode: "viewer" | "editor"
  onModeChange: (mode: "viewer" | "editor") => void
  showCopilot: boolean
  onToggleCopilot: () => void
  copilotMessages: Message[]
  setCopilotMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void
  selectedModel: string
  setSelectedModel: (model: string) => void
  transformationCode: string
  setTransformationCode: (code: string) => void
  showDataViewer?: boolean
  onToggleDataViewer?: () => void
  functionId?: string | null
  functionName?: string
  functionData?: any
}

export function TransformationEditor({
  copilotConfig,
  mode,
  onModeChange,
  showCopilot,
  onToggleCopilot,
  copilotMessages,
  setCopilotMessages,
  selectedModel,
  setSelectedModel,
  transformationCode,
  setTransformationCode,
  showDataViewer,
  onToggleDataViewer,
  functionId,
  functionName,
  functionData,
}: TransformationEditorProps) {
  const router = useRouter()
  const [transformFunction, setTransformFunction] = useState<TransformFunction>({
    id: "main-transform",
    name: functionName || "transform",
    description: "Main transformation function",
    code: `// Main transformation function
export function transform(data: any) {
  // Add your transformation logic here
  return data;
}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    sourceFiles: [],
    targetFiles: [],
  })

  const { toast } = useToast()
  const [isRunning, setIsRunning] = useState(false)
  const [executionResult, setExecutionResult] = useState<{
    error?: string
    stack?: string
    result?: any
    success?: boolean
    logs?: any[]
    executionTime?: number
    metadata?: any
  } | null>(null)

  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (functionName) {
      setTransformFunction((prev) => ({
        ...prev,
        name: functionName,
      }))
    }
  }, [functionName])

  useEffect(() => {
    console.log("[v0] TransformationEditor - transformationCode changed:", transformationCode?.substring(0, 100))
    if (transformationCode) {
      setTransformFunction((prev) => ({
        ...prev,
        code: transformationCode,
        updatedAt: new Date(),
      }))
    }
  }, [transformationCode])

  const handleSaveFunction = () => {
    setShowSaveDialog(true)
  }

  const handleSaveSubmit = async (data: {
    name: string
    shortDescription: string
    longDescription: string
    tags: string[]
    status: string
    createdBy: string
  }) => {
    setIsSaving(true)
    try {
      if (functionId) {
        await updateGeneratedFunction(functionId, {
          ...data,
          code: transformFunction.code,
        })
        toast({
          title: "Success",
          description: "Function updated successfully",
        })
      } else {
        await saveGeneratedFunction({
          ...data,
          code: transformFunction.code,
        })
        toast({
          title: "Success",
          description: "Function saved successfully",
        })
      }

      setShowSaveDialog(false)
      router.push("/")
    } catch (error) {
      console.error("[v0] Error saving function:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save function",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleRunFunction = async () => {
    console.log("[v0] Running function:", transformFunction.code)
    setIsRunning(true)
    setExecutionResult(null)

    try {
      const result = await testFunction(transformFunction.code, {})
      console.log("[v0] Test function result:", result)

      if (!result.success && result.error) {
        setExecutionResult({
          error: result.error,
          stack: result.stack,
          success: false,
          logs: result.logs || [],
          executionTime: result.executionTime || 0,
          metadata: result.metadata || {},
        })
      } else {
        setExecutionResult({
          result: result.result,
          success: true,
          logs: result.logs || [],
          executionTime: result.executionTime || 0,
          metadata: result.metadata || {},
        })
      }

      toast({
        title: result.success ? "Success" : "Error",
        description:
          result.message || (result.success ? "Function executed successfully" : "Function execution failed"),
        variant: result.success ? "default" : "destructive",
      })
    } catch (error) {
      console.error("[v0] Error running function:", error)
      setExecutionResult({
        error: error instanceof Error ? error.message : String(error),
        success: false,
        logs: [],
        executionTime: 0,
        metadata: {},
      })

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to execute function",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  const handleCodeChange = (newCode: string) => {
    console.log("[v0] Code changed, updating transformation code")
    setTransformationCode(newCode)
    setTransformFunction((prev) => ({
      ...prev,
      code: newCode,
      updatedAt: new Date(),
    }))
  }

  const editorCopilotConfig: CopilotConfig = {
    ...copilotConfig,
    onSendMessage: async (message, context, model) => {
      const response = copilotConfig.onSendMessage
        ? await copilotConfig.onSendMessage(message, context, model)
        : "I'll help you create a transformation function."

      if (response.includes("```")) {
        const codeMatch = response.match(/```(?:typescript|javascript|ts|js)?\n([\s\S]*?)```/)
        if (codeMatch) {
          const code = codeMatch[1]
          setTransformFunction((prev) => ({
            ...prev,
            code,
            description: `Generated from: ${message.slice(0, 50)}...`,
            updatedAt: new Date(),
            sourceFiles: context.filter((c) => c.startsWith("@")),
          }))
        }
      }

      return response
    },
  }

  return (
    <div className="h-full flex flex-col">
      <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-[var(--color-sidebar-bg)] relative">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")} title="Back to Functions">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-sm font-semibold">
            {functionId ? `Edit: ${functionName || "Function"}` : "New Function"}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {onToggleDataViewer && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleDataViewer}
              title={`${showDataViewer ? "Hide" : "Show"} Data Viewer (Ctrl+1)`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M9 3v18" />
              </svg>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRunFunction}
            disabled={isRunning}
            title={isRunning ? "Running..." : "Run"}
          >
            <Play className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSaveFunction} title="Save">
            <Save className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCopilot}
            title={showCopilot ? "Hide Copilot" : "Show Copilot"}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-hidden">
          {showCopilot ? (
            <ResizableCopilot
              config={editorCopilotConfig}
              onClose={onToggleCopilot}
              messages={copilotMessages}
              setMessages={setCopilotMessages}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              onCodeGenerated={setTransformationCode}
            >
              <div className="h-full flex flex-col bg-[var(--color-editor-bg)]">
                <div className="px-4 py-3 border-b border-border bg-[var(--color-sidebar-bg)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">{transformFunction.name}.js</h3>
                      {transformFunction.description && (
                        <p className="text-xs text-muted-foreground mt-1">{transformFunction.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden">
                  <EditableCodeEditor
                    value={transformFunction.code}
                    onChange={handleCodeChange}
                    language="javascript"
                  />
                </div>
              </div>
            </ResizableCopilot>
          ) : (
            <div className="h-full flex flex-col bg-[var(--color-editor-bg)]">
              <div className="px-4 py-3 border-b border-border bg-[var(--color-sidebar-bg)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">{transformFunction.name}.js</h3>
                    {transformFunction.description && (
                      <p className="text-xs text-muted-foreground mt-1">{transformFunction.description}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                <EditableCodeEditor value={transformFunction.code} onChange={handleCodeChange} language="javascript" />
              </div>
            </div>
          )}
        </div>

        {executionResult && (
          <ErrorPanel
            error={executionResult.error}
            stack={executionResult.stack}
            result={executionResult.result}
            success={executionResult.success}
            logs={executionResult.logs}
            executionTime={executionResult.executionTime}
            metadata={executionResult.metadata}
            onClose={() => setExecutionResult(null)}
          />
        )}
      </div>

      <SaveFunctionDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        onSave={handleSaveSubmit}
        defaultCode={transformFunction.code}
        isSaving={isSaving}
        existingFunction={functionData}
      />
    </div>
  )
}
