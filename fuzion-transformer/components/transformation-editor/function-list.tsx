"use client"

import { FileCode, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { TransformFunction } from "@/types/transformation"

interface FunctionListProps {
  functions: TransformFunction[]
  activeFunctionId: string | null
  onFunctionSelect: (id: string) => void
  onNewFunction: () => void
}

export function FunctionList({ functions, activeFunctionId, onFunctionSelect, onNewFunction }: FunctionListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase text-muted-foreground">Transform Functions</h2>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onNewFunction} title="New Function">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-auto">
        {functions.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            <p>No transformation functions yet.</p>
            <p className="mt-2">Use the copilot to generate one!</p>
          </div>
        ) : (
          <div className="p-2">
            {functions.map((func) => (
              <button
                key={func.id}
                onClick={() => onFunctionSelect(func.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors",
                  activeFunctionId === func.id
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50 text-foreground",
                )}
              >
                <FileCode className="h-4 w-4 flex-shrink-0 text-blue-500" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{func.name}</div>
                  {func.description && <div className="text-xs text-muted-foreground truncate">{func.description}</div>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
