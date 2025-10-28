export interface FileNode {
  id: string
  name: string
  type: "file" | "folder"
  path: string
  extension?: string
  children?: FileNode[]
  content?: string
  size?: number
  modified?: Date
  metadata?: {
    _id: string
    type: "api" | "function" | "collection"
  }
}

export interface Tab {
  id: string
  fileId: string
  fileName: string
  filePath: string
  extension: string
  content: string
  isDirty?: boolean
}

export interface PaneConfig {
  id: string
  tabs: Tab[]
  activeTabId: string | null
}
