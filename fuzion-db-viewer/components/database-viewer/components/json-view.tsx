"use client"

import { Copy, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface JsonViewProps {
  data: any[]
  columns: any[]
}

export function JsonView({ data, columns }: JsonViewProps) {
  const [copied, setCopied] = useState(false)

  // Convert array data to objects using column names
  const jsonData = data.map((row) => {
    const obj: Record<string, any> = {}
    columns.forEach((col, idx) => {
      obj[col.name] = row[col.index]
    })
    return obj
  })

  const jsonString = JSON.stringify(jsonData, null, 2)

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const element = document.createElement("a")
    const file = new Blob([jsonString], { type: "application/json" })
    element.href = URL.createObjectURL(file)
    element.download = "data.json"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">JSON View</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2 bg-transparent">
            <Copy className="h-4 w-4" />
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-muted/30 p-4">
        <pre className="rounded-lg border border-border bg-card p-4 font-mono text-sm text-foreground">
          <code>{jsonString}</code>
        </pre>
      </div>
    </div>
  )
}
