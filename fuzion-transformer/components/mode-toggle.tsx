"use client"

import { Eye, Code2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModeToggleProps {
  mode: "viewer" | "editor"
  onChange: (mode: "viewer" | "editor") => void
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-background p-1">
      <button
        onClick={() => onChange("viewer")}
        className={cn(
          "inline-flex items-center justify-center rounded-md px-3 py-1.5 transition-colors",
          mode === "viewer"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
        title="Viewer"
      >
        <Eye className="h-4 w-4" />
      </button>
      <button
        onClick={() => onChange("editor")}
        className={cn(
          "inline-flex items-center justify-center rounded-md px-3 py-1.5 transition-colors",
          mode === "editor"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
        title="Transform Editor"
      >
        <Code2 className="h-4 w-4" />
      </button>
    </div>
  )
}
