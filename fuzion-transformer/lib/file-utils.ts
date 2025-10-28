import type { FileNode } from "@/types/file-system"

export function getFileExtension(filename: string): string {
  const parts = filename.split(".")
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ""
}

export function getFileIcon(extension: string): string {
  const iconMap: Record<string, string> = {
    ts: "📘",
    tsx: "⚛️",
    js: "📜",
    jsx: "⚛️",
    json: "📋",
    csv: "📊",
    xml: "📄",
    html: "🌐",
    css: "🎨",
    md: "📝",
    txt: "📄",
    sql: "🗄️",
    py: "🐍",
    java: "☕",
    xlsx: "📗",
    xls: "📗",
    doc: "📘",
    docx: "📘",
    pdf: "📕",
  }
  return iconMap[extension] || "📄"
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}

export function findFileById(nodes: FileNode[], id: string): FileNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findFileById(node.children, id)
      if (found) return found
    }
  }
  return null
}
