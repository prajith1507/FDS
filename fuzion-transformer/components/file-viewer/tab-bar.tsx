"use client"

import { X } from "lucide-react"
import type { Tab } from "@/types/file-system"
import { cn } from "@/lib/utils"
import { getFileIcon } from "@/lib/file-utils"

interface TabBarProps {
  tabs: Tab[]
  activeTabId: string | null
  onTabSelect: (tabId: string) => void
  onTabClose: (tabId: string) => void
}

export function TabBar({ tabs, activeTabId, onTabSelect, onTabClose }: TabBarProps) {
  return (
    <div className="flex items-center gap-0 bg-[var(--color-tab-inactive)] border-b border-border overflow-x-auto">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={cn(
            "flex items-center gap-2 px-3 py-2 border-r border-border cursor-pointer group min-w-[120px] max-w-[200px]",
            activeTabId === tab.id
              ? "bg-[var(--color-tab-active)] text-foreground"
              : "bg-[var(--color-tab-inactive)] text-muted-foreground hover:bg-accent/30",
          )}
          onClick={() => onTabSelect(tab.id)}
        >
          <span className="text-sm">{getFileIcon(tab.extension)}</span>
          <span className="text-xs font-mono truncate flex-1">
            {tab.fileName}
            {tab.isDirty && <span className="ml-1">•</span>}
          </span>
          <button
            className="opacity-0 group-hover:opacity-100 hover:bg-accent/50 rounded p-0.5 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              onTabClose(tab.id)
            }}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  )
}
