"use client"

import { useState, useEffect } from "react"
import { Plus, X, Settings, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export type EnvironmentVariable = {
  id: string
  variable: string
  value: string
  type: "default" | "secret"
  enabled: boolean
}

type EnvironmentManagerProps = {
  variables: EnvironmentVariable[]
  onUpdate: (variables: EnvironmentVariable[]) => void
}

export function EnvironmentManager({ variables, onUpdate }: EnvironmentManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localVariables, setLocalVariables] = useState<EnvironmentVariable[]>(variables)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setLocalVariables(variables)
  }, [variables])

  const addVariable = () => {
    const newVar: EnvironmentVariable = {
      id: `env-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      variable: "",
      value: "",
      type: "default",
      enabled: true
    }
    setLocalVariables(prev => [...prev, newVar])
  }

  const updateVariable = (id: string, updates: Partial<EnvironmentVariable>) => {
    setLocalVariables(prev => 
      prev.map(v => v.id === id ? { ...v, ...updates } : v)
    )
  }

  const removeVariable = (id: string) => {
    setLocalVariables(prev => prev.filter(v => v.id !== id))
  }

  const toggleSecretVisibility = (id: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const handleSave = () => {
    // Filter out empty variables
    const validVariables = localVariables.filter(v => v.variable.trim() !== "")
    onUpdate(validVariables)
    setIsOpen(false)
  }

  const handleCancel = () => {
    setLocalVariables(variables)
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className="h-7 rounded-md bg-muted px-2 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors border"
          aria-label={`Environment Variables (${variables.filter(v => v.enabled).length} active)`}
          title={`Environment Variables (${variables.filter(v => v.enabled).length} active)`}
        >
          <span className="inline-flex items-center gap-1">
            <Settings className="h-4 w-4" />
            <span>Env ({variables.filter(v => v.enabled).length})</span>
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Environment Variables</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Define variables that can be used in requests with <code className="bg-muted px-1 rounded">{"{{variable_name}}"}</code> syntax.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <div className="space-y-4">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
              <div className="col-span-1"></div>
              <div className="col-span-4">Variable</div>
              <div className="col-span-6">Value</div>
              <div className="col-span-1"></div>
            </div>

            {/* Variables List */}
            <div className="space-y-2">
              {localVariables.map((variable) => (
                <div key={variable.id} className="grid grid-cols-12 gap-2 items-center">
                  {/* Enabled Checkbox */}
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      checked={variable.enabled}
                      onChange={(e) => updateVariable(variable.id, { enabled: e.target.checked })}
                      className="w-4 h-4"
                    />
                  </div>

                  {/* Variable Name */}
                  <div className="col-span-4">
                    <Input
                      placeholder="variable_name"
                      value={variable.variable}
                      onChange={(e) => updateVariable(variable.id, { variable: e.target.value })}
                      className="h-8 font-mono text-sm"
                    />
                  </div>

                  {/* Variable Value */}
                  <div className="col-span-6 relative">
                    <Input
                      placeholder="value"
                      type={variable.type === "secret" && !showSecrets[variable.id] ? "password" : "text"}
                      value={variable.value}
                      onChange={(e) => updateVariable(variable.id, { value: e.target.value })}
                      className="h-8 font-mono text-sm pr-16"
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {variable.type === "secret" && (
                        <button
                          type="button"
                          onClick={() => toggleSecretVisibility(variable.id)}
                          className="p-1 hover:bg-muted rounded"
                          title={showSecrets[variable.id] ? "Hide value" : "Show value"}
                        >
                          {showSecrets[variable.id] ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => updateVariable(variable.id, { 
                          type: variable.type === "default" ? "secret" : "default" 
                        })}
                        className={cn(
                          "px-2 py-0.5 text-xs rounded font-mono",
                          variable.type === "secret" 
                            ? "bg-orange-100 text-orange-700 border border-orange-200" 
                            : "bg-muted text-muted-foreground"
                        )}
                        title={variable.type === "secret" ? "Secret variable" : "Regular variable"}
                      >
                        {variable.type === "secret" ? "SECRET" : "TEXT"}
                      </button>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <div className="col-span-1">
                    <button
                      onClick={() => removeVariable(variable.id)}
                      className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-destructive"
                      title="Remove variable"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Variable Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={addVariable}
              className="w-full border-2 border-dashed border-muted-foreground/30 h-10 text-muted-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add variable
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            Use variables in requests with <code className="bg-muted px-1 rounded">{"{{variable_name}}"}</code>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Quick environment indicator component for the main UI
export function EnvironmentIndicator({ variables }: { variables: EnvironmentVariable[] }) {
  const enabledCount = variables.filter(v => v.enabled).length
  
  if (enabledCount === 0) return null

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <Settings className="h-3 w-3" />
      <span>{enabledCount} variables</span>
    </div>
  )
}