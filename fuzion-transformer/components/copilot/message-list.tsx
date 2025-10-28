"use client"

import { cn } from "@/lib/utils"
import type { Message } from "@/types/copilot"
import { Bot, User } from "lucide-react"

interface MessageListProps {
  messages: Message[]
}

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-auto p-8">
        <div className="space-y-3 text-center max-w-2xl mx-auto">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div className="select-text">
            <h3 className="font-semibold text-lg">Transform Copilot</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Reference files with <span className="font-mono text-xs bg-muted px-1 rounded">@</span>, fields with{" "}
              <span className="font-mono text-xs bg-muted px-1 rounded">#</span>, and commands with{" "}
              <span className="font-mono text-xs bg-muted px-1 rounded">/</span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-4 space-y-4">
      {messages.map((message) => (
        <div key={message.id} className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}>
          {message.role === "assistant" && (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-primary" />
            </div>
          )}
          <div
            className={cn(
              "max-w-[80%] rounded-lg px-4 py-2.5 select-text",
              message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
            )}
          >
            <div className="text-sm whitespace-pre-wrap break-words">{message.content}</div>
            <div className="text-xs opacity-70 mt-1">
              {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
          {message.role === "user" && (
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
