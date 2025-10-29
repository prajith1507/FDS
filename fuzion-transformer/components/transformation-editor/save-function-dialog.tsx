"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface SaveFunctionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: {
    name: string
    shortDescription: string
    longDescription: string
    tags: string[]
    status: string
    createdBy: string
  }) => void
  defaultCode?: string
  isSaving?: boolean
  existingFunction?: any
}

export function SaveFunctionDialog({
  open,
  onOpenChange,
  onSave,
  defaultCode,
  isSaving,
  existingFunction,
}: SaveFunctionDialogProps) {
  const [name, setName] = useState("")
  const [shortDescription, setShortDescription] = useState("")
  const [longDescription, setLongDescription] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [status, setStatus] = useState("active")
  const [createdBy, setCreatedBy] = useState("user123")

  useEffect(() => {
    if (existingFunction && open) {
      setName(existingFunction.name || "")
      setShortDescription(existingFunction.shortDescription || "")
      setLongDescription(existingFunction.longDescription || "")
      setTags(existingFunction.tags || [])
      setStatus(existingFunction.status || "active")
      setCreatedBy(existingFunction.createdBy || "user123")
    } else if (!existingFunction && open) {
      // Reset form for new function
      setName("")
      setShortDescription("")
      setLongDescription("")
      setTags([])
      setStatus("active")
      setCreatedBy("user123")
    }
  }, [existingFunction, open])

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSave = () => {
    if (!name.trim() || !shortDescription.trim()) {
      return
    }

    onSave({
      name: name.trim(),
      shortDescription: shortDescription.trim(),
      longDescription: longDescription.trim(),
      tags,
      status,
      createdBy,
    })
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isSaving) {
      // Only reset if not editing an existing function
      if (!existingFunction) {
        setName("")
        setShortDescription("")
        setLongDescription("")
        setTags([])
        setTagInput("")
        setStatus("active")
      }
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{existingFunction ? "Update Function" : "Save Generated Function"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Function Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Binance BTCUSDT Klines Fetcher"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDescription">Short Description *</Label>
            <Input
              id="shortDescription"
              placeholder="Brief description of what this function does"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="longDescription">Long Description</Label>
            <Textarea
              id="longDescription"
              placeholder="Detailed description including features, error handling, etc."
              value={longDescription}
              onChange={(e) => setLongDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="Add a tag and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="createdBy">Created By</Label>
            <Input id="createdBy" value={createdBy} onChange={(e) => setCreatedBy(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || !shortDescription.trim() || isSaving} style={{ backgroundColor: "#0056a4" }}>
            {isSaving
              ? existingFunction
                ? "Updating..."
                : "Saving..."
              : existingFunction
                ? "Update Function"
                : "Save Function"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
