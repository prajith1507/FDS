"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { GripVertical } from "lucide-react"
import { Copilot } from "./copilot"
import type { CopilotConfig, Message } from "@/types/copilot"

interface ResizableCopilotProps {
  config: CopilotConfig
  children: React.ReactNode
  defaultWidth?: number
  onClose?: () => void
  messages: Message[]
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void
  selectedModel: string
  setSelectedModel: (model: string) => void
  onCodeGenerated?: (code: string) => void
}

export function ResizableCopilot({
  config,
  children,
  defaultWidth = 400,
  onClose,
  messages,
  setMessages,
  selectedModel,
  setSelectedModel,
  onCodeGenerated,
}: ResizableCopilotProps) {
  const [copilotWidth, setCopilotWidth] = useState(defaultWidth)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      const container = containerRef.current
      const rect = container.getBoundingClientRect()
      const newWidth = rect.right - e.clientX

      if (newWidth >= 300 && newWidth <= 800) {
        setCopilotWidth(newWidth)
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

  return (
    <div ref={containerRef} className="flex h-full relative">
      <div className="flex-1 h-full overflow-hidden">{children}</div>

      <div
        className="w-1 bg-border hover:bg-primary cursor-col-resize flex items-center justify-center group relative flex-shrink-0"
        onMouseDown={() => setIsDragging(true)}
      >
        <div className="absolute inset-y-0 -left-1 -right-1" />
        <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
      </div>

      <div style={{ width: `${copilotWidth}px` }} className="h-full overflow-hidden flex-shrink-0">
        <Copilot
          config={config}
          onClose={onClose}
          messages={messages}
          setMessages={setMessages}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          onCodeGenerated={onCodeGenerated}
        />
      </div>
    </div>
  )
}
