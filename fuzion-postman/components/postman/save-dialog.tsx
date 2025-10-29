"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"

type SaveDialogProps = {
  open: boolean
  onClose: () => void
  payload: any
}

export function SaveDialog({ open, onClose, payload }: SaveDialogProps) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/apis/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })
      
      if (response.ok) {
        setSaved(true)
        setTimeout(() => {
          setSaved(false)
          onClose()
        }, 1500)
      } else {
        console.error('Failed to save API request')
      }
    } catch (error) {
      console.error('Error saving API request:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Save API Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-foreground/70">
            This is the formatted request payload that will be saved to your database.
          </p>
          <pre className="p-4 rounded-md bg-muted text-xs overflow-auto max-h-96 leading-relaxed">
            {JSON.stringify(payload, null, 2)}
          </pre>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleSave} disabled={saving || saved} style={{ backgroundColor: "#0056a4" }}>
              {saving ? "Saving..." : saved ? "Saved!" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
