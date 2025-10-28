"use client"

import type { Tab } from "@/types/file-system"
import { TabBar } from "./tab-bar"
import { CodeEditor } from "./code-editor"

interface ViewerPaneProps {
  tabs: Tab[]
  activeTabId: string | null
  onTabSelect: (tabId: string) => void
  onTabClose: (tabId: string) => void
  isFocused: boolean
  onFocus: () => void
  onContentChange?: (tabId: string, content: string) => void
}

export function ViewerPane({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  isFocused,
  onFocus,
  onContentChange,
}: ViewerPaneProps) {
  const activeTab = tabs.find((tab) => tab.id === activeTabId)

  const handleContentChange = (content: string) => {
    if (activeTab && onContentChange) {
      onContentChange(activeTab.id, content)
    }
  }

  return (
    <div className={`h-full flex flex-col ${isFocused ? "ring-2 ring-primary/20 ring-inset" : ""}`} onClick={onFocus}>
      <TabBar tabs={tabs} activeTabId={activeTabId} onTabSelect={onTabSelect} onTabClose={onTabClose} />

      <div className="flex-1 overflow-hidden">
        {activeTab ? (
          <CodeEditor
            content={activeTab.content}
            extension={activeTab.extension}
            fileName={activeTab.fileName}
            onChange={handleContentChange}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-lg font-semibold mb-2">No file open</p>
              <p className="text-sm">Select a file from the explorer to view its contents</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
