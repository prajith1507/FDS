"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, Folder, FolderOpen, File } from "lucide-react"
import type { FileNode } from "@/types/file-system"
import { cn } from "@/lib/utils"

interface FileTreeProps {
  nodes: FileNode[]
  onFileSelect: (file: FileNode) => void
  selectedFileId?: string
}

export function FileTree({ nodes, onFileSelect, selectedFileId }: FileTreeProps) {
  return (
    <div className="w-full">
      {nodes.map((node) => (
        <TreeNode key={node.id} node={node} onFileSelect={onFileSelect} selectedFileId={selectedFileId} level={0} />
      ))}
    </div>
  )
}

interface TreeNodeProps {
  node: FileNode
  onFileSelect: (file: FileNode) => void
  selectedFileId?: string
  level: number
}

function TreeNode({ node, onFileSelect, selectedFileId, level }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level === 0)
  const isSelected = selectedFileId === node.id
  const isFolder = node.type === "folder"

  const handleClick = () => {
    if (isFolder) {
      setIsExpanded(!isExpanded)
    } else {
      onFileSelect(node)
    }
  }

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-accent/50 text-sm",
          isSelected && "bg-accent text-accent-foreground",
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {isFolder && (
          <span className="flex-shrink-0">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </span>
        )}
        {!isFolder && <span className="w-4" />}

        <span className="flex-shrink-0">
          {isFolder ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 text-primary" />
            ) : (
              <Folder className="h-4 w-4 text-primary" />
            )
          ) : (
            <File className="h-4 w-4 text-muted-foreground" />
          )}
        </span>

        <span className="truncate font-mono text-xs">{node.name}</span>
      </div>

      {isFolder && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              onFileSelect={onFileSelect}
              selectedFileId={selectedFileId}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
