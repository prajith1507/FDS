"use client"

import { useState } from "react"
import { FileTree } from "./file-tree"
import { ViewerPane } from "./viewer-pane"
import { SplitPane } from "./split-pane"
import type { FileNode, Tab, PaneConfig } from "@/types/file-system"
import type { CopilotConfig, Message } from "@/types/copilot"
import { getFileExtension } from "@/lib/file-utils"
import { fetchFileContent } from "@/lib/api-service"
import { ChevronsLeft, ChevronsRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FileViewerProps {
  files: FileNode[]
  copilotConfig: CopilotConfig
  mode: "viewer" | "editor"
  onModeChange: (mode: "viewer" | "editor") => void
  showCopilot: boolean
  onToggleCopilot: () => void
  copilotMessages: Message[]
  setCopilotMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void
  selectedModel: string
  setSelectedModel: (model: string) => void
  onCodeGenerated?: (code: string) => void
  onClose?: () => void
}

export function FileViewer({
  files,
  copilotConfig,
  mode,
  onModeChange,
  showCopilot,
  onToggleCopilot,
  copilotMessages,
  setCopilotMessages,
  selectedModel,
  setSelectedModel,
  onCodeGenerated,
  onClose,
}: FileViewerProps) {
  const [selectedFileId, setSelectedFileId] = useState<string>()
  const [splitView, setSplitView] = useState(false)
  const [showExplorer, setShowExplorer] = useState(true)
  const [focusedPane, setFocusedPane] = useState<"left" | "right">("left")

  const [leftPane, setLeftPane] = useState<PaneConfig>({
    id: "left",
    tabs: [],
    activeTabId: null,
  })

  const [rightPane, setRightPane] = useState<PaneConfig>({
    id: "right",
    tabs: [],
    activeTabId: null,
  })

  const [loadingContent, setLoadingContent] = useState<Set<string>>(new Set())

  const handleFileSelect = async (file: FileNode) => {
    if (file.type === "folder") return

    setSelectedFileId(file.id)

    const targetPane = splitView ? (focusedPane === "left" ? leftPane : rightPane) : leftPane
    const setTargetPane = splitView ? (focusedPane === "left" ? setLeftPane : setRightPane) : setLeftPane

    const existingTab = targetPane.tabs.find((tab) => tab.fileId === file.id)

    if (existingTab) {
      setTargetPane({
        ...targetPane,
        activeTabId: existingTab.id,
      })
      return
    }

    let content = file.content || ""

    if (file.metadata && !loadingContent.has(file.id)) {
      try {
        setLoadingContent((prev) => new Set(prev).add(file.id))
        const fetchedContent = await fetchFileContent(file.metadata._id, file.metadata.type)
        content = JSON.stringify(fetchedContent, null, 2)
      } catch (error) {
        console.error("[v0] Failed to fetch file content:", error)
        content = `// Error loading content: ${error instanceof Error ? error.message : "Unknown error"}`
      } finally {
        setLoadingContent((prev) => {
          const newSet = new Set(prev)
          newSet.delete(file.id)
          return newSet
        })
      }
    }

    const newTab: Tab = {
      id: `tab-${Date.now()}`,
      fileId: file.id,
      fileName: file.name,
      filePath: file.path,
      extension: getFileExtension(file.name),
      content,
    }

    setTargetPane({
      ...targetPane,
      tabs: [...targetPane.tabs, newTab],
      activeTabId: newTab.id,
    })
  }

  const handleTabClose = (paneId: string, tabId: string) => {
    const pane = paneId === "left" ? leftPane : rightPane
    const setPane = paneId === "left" ? setLeftPane : setRightPane

    const newTabs = pane.tabs.filter((tab) => tab.id !== tabId)
    const newActiveTabId =
      pane.activeTabId === tabId ? (newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null) : pane.activeTabId

    setPane({
      ...pane,
      tabs: newTabs,
      activeTabId: newActiveTabId,
    })
  }

  const handleContentChange = (paneId: string, tabId: string, content: string) => {
    const pane = paneId === "left" ? leftPane : rightPane
    const setPane = paneId === "left" ? setLeftPane : setRightPane

    const updatedTabs = pane.tabs.map((tab) => (tab.id === tabId ? { ...tab, content } : tab))

    setPane({
      ...pane,
      tabs: updatedTabs,
    })
  }

  const toggleSplitView = () => {
    setSplitView(!splitView)
  }

  const toggleExplorer = () => {
    setShowExplorer(!showExplorer)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-[var(--color-sidebar-bg)]">
        <h1 className="text-sm font-semibold">Data Viewer</h1>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={toggleSplitView} title={splitView ? "Single View" : "Split View"}>
            {splitView ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} title="Close Data Viewer">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {showExplorer && (
          <div className="w-64 border-r border-border bg-[var(--color-sidebar-bg)] flex flex-col">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase text-muted-foreground">Explorer</h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={toggleExplorer}
                title="Collapse Explorer"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              <FileTree nodes={files} onFileSelect={handleFileSelect} selectedFileId={selectedFileId} />
            </div>
          </div>
        )}

        {!showExplorer && (
          <div className="border-r border-border bg-[var(--color-sidebar-bg)] flex flex-col items-center py-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleExplorer} title="Expand Explorer">
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          {splitView ? (
            <SplitPane
              left={
                <ViewerPane
                  tabs={leftPane.tabs}
                  activeTabId={leftPane.activeTabId}
                  onTabSelect={(tabId) => setLeftPane({ ...leftPane, activeTabId: tabId })}
                  onTabClose={(tabId) => handleTabClose("left", tabId)}
                  isFocused={focusedPane === "left"}
                  onFocus={() => setFocusedPane("left")}
                  onContentChange={(tabId, content) => handleContentChange("left", tabId, content)}
                />
              }
              right={
                <ViewerPane
                  tabs={rightPane.tabs}
                  activeTabId={rightPane.activeTabId}
                  onTabSelect={(tabId) => setRightPane({ ...rightPane, activeTabId: tabId })}
                  onTabClose={(tabId) => handleTabClose("right", tabId)}
                  isFocused={focusedPane === "right"}
                  onFocus={() => setFocusedPane("right")}
                  onContentChange={(tabId, content) => handleContentChange("right", tabId, content)}
                />
              }
            />
          ) : (
            <ViewerPane
              tabs={leftPane.tabs}
              activeTabId={leftPane.activeTabId}
              onTabSelect={(tabId) => setLeftPane({ ...leftPane, activeTabId: tabId })}
              onTabClose={(tabId) => handleTabClose("left", tabId)}
              isFocused={true}
              onFocus={() => {}}
              onContentChange={(tabId, content) => handleContentChange("left", tabId, content)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
