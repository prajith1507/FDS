"use client"

import { Plus, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

type Row = { key: string; value: string; description?: string; enabled?: boolean }

type KeyValueTableProps = {
  title: string
  rows: Row[]
  onChange: (rows: Row[]) => void
  showDescription?: boolean
}

export function KeyValueTable({ title, rows, onChange, showDescription = true }: KeyValueTableProps) {
  const handleAdd = () => {
    onChange([...rows, { key: "", value: "", description: "", enabled: true }])
  }

  const handleRemove = (idx: number) => {
    onChange(rows.filter((_, i) => i !== idx))
  }

  const handleChange = (idx: number, field: keyof Row, val: any) => {
    const updated = [...rows]
    updated[idx] = { ...updated[idx], [field]: val }
    onChange(updated)
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground/70">{title}</h3>
        <button onClick={handleAdd} className="text-xs text-pm-brand hover:opacity-90 inline-flex items-center gap-1">
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              <th className="w-8 p-2"></th>
              <th className="text-left p-2 font-medium text-foreground/70">Key</th>
              <th className="text-left p-2 font-medium text-foreground/70">Value</th>
              {showDescription && <th className="text-left p-2 font-medium text-foreground/70">Description</th>}
              <th className="w-12 p-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={showDescription ? 5 : 4} className="p-4 text-center text-foreground/50 text-xs">
                  No rows yet. Click Add to create one.
                </td>
              </tr>
            )}
            {rows.map((row, idx) => (
              <tr key={idx} className="border-b last:border-b-0 hover:bg-muted/20">
                <td className="p-2 text-center">
                  <Checkbox
                    checked={row.enabled !== false}
                    onCheckedChange={(checked) => handleChange(idx, "enabled", !!checked)}
                  />
                </td>
                <td className="p-2">
                  <Input
                    placeholder="Key"
                    value={row.key}
                    onChange={(e) => handleChange(idx, "key", e.target.value)}
                    className="h-8 bg-card"
                  />
                </td>
                <td className="p-2">
                  <Input
                    placeholder="Value"
                    value={row.value}
                    onChange={(e) => handleChange(idx, "value", e.target.value)}
                    className="h-8 bg-card"
                  />
                </td>
                {showDescription && (
                  <td className="p-2">
                    <Input
                      placeholder="Description"
                      value={row.description || ""}
                      onChange={(e) => handleChange(idx, "description", e.target.value)}
                      className="h-8 bg-card"
                    />
                  </td>
                )}
                <td className="p-2 text-center">
                  <button
                    onClick={() => handleRemove(idx)}
                    className="text-foreground/50 hover:text-foreground"
                    aria-label="Remove row"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
