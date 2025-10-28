"use client"

import { useState } from "react"
import { MessageList } from "./message-list"
import { CopilotInput } from "./copilot-input"
import type { Message, CopilotConfig, Suggestion } from "@/types/copilot"
import { RotateCcw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { generateFunction } from "@/lib/api-service"

interface CopilotProps {
  config: CopilotConfig
  className?: string
  onClose?: () => void
  messages: Message[]
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void
  selectedModel: string
  setSelectedModel: (model: string) => void
  onCodeGenerated?: (code: string) => void
}

export function Copilot({
  config,
  className,
  onClose,
  messages,
  setMessages,
  selectedModel,
  setSelectedModel,
  onCodeGenerated,
}: CopilotProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [currentContext, setCurrentContext] = useState<string[]>([])

  const handleTriggerChange = (trigger: "@" | "/" | null, query: string) => {
    if (!trigger) {
      setSuggestions([])
      return
    }

    setSuggestions([])
  }

  const handleSendMessage = async (content: string, sources: { api: string[]; collection: string[] }) => {
    const instruction = content.split("\n\nSources:")[0]

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: instruction,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])

    const atMentions = Array.from(content.matchAll(/@(\S+)/g)).map((match) => match[1])
    const slashMentions = Array.from(content.matchAll(/\/(\S+)/g)).map((match) => match[1])
    const context = [...atMentions, ...slashMentions]
    setCurrentContext((prev) => [...new Set([...prev, ...context])])

    setIsLoading(true)

    try {
      console.log("[v0] Calling generateFunction with instruction:", instruction)
      console.log("[v0] onCodeGenerated callback exists:", !!onCodeGenerated)

      const functionResponse = await generateFunction(instruction, sources)

      console.log("[v0] Full API response:", functionResponse)
      console.log("[v0] transformCode from response:", functionResponse.transformCode)
      console.log("[v0] transformCode exists:", !!functionResponse.transformCode)

      if (functionResponse.transformCode && onCodeGenerated) {
        console.log("[v0] Calling onCodeGenerated with code length:", functionResponse.transformCode.length)
        onCodeGenerated(functionResponse.transformCode)
        console.log("[v0] onCodeGenerated called successfully")
      } else {
        console.log(
          "[v0] NOT calling onCodeGenerated - transformCode:",
          !!functionResponse.transformCode,
          "callback:",
          !!onCodeGenerated,
        )
      }

      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: "assistant",
        content: functionResponse.message,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: "assistant",
        content: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleUndo = () => {
    if (messages.length >= 2) {
      setMessages((prev) => prev.slice(0, -2))
    }
  }

  return (
    <div className={cn("flex flex-col h-full bg-background border-l border-border", className)}>
      {/* Header */}
      <div className="h-12 border-b border-border flex items-center justify-between px-4 flex-shrink-0">
        <h2 className="text-sm font-semibold">COPILOT</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleUndo}
            disabled={messages.length < 2}
            title="Undo"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} title="Close">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} />

      {/* Input */}
      <CopilotInput
        onSend={handleSendMessage}
        suggestions={suggestions}
        onTriggerChange={handleTriggerChange}
        isLoading={isLoading}
        selectedModel={selectedModel}
        availableModels={config.availableModels || []}
        onModelChange={setSelectedModel}
      />
    </div>
  )
}
