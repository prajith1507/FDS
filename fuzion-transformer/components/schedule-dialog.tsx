"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import type { CreateScheduleRequest, UpdateScheduleRequest, ScheduleInfo } from "@/types/api"

interface ScheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  functionId: string
  functionName: string
  existingSchedule?: ScheduleInfo | null
  onScheduleCreated?: () => void
}

const CRON_PRESETS = [
  { label: "Every 5 minutes", value: "*/5 * * * *" },
  { label: "Every 15 minutes", value: "*/15 * * * *" },
  { label: "Every 30 minutes", value: "*/30 * * * *" },
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every 6 hours", value: "0 */6 * * *" },
  { label: "Every 12 hours", value: "0 */12 * * *" },
  { label: "Daily at midnight", value: "0 0 * * *" },
  { label: "Daily at 9 AM", value: "0 9 * * *" },
  { label: "Weekly on Monday", value: "0 0 * * 1" },
  { label: "Custom", value: "custom" },
]

const TIMEZONES = [
  { label: "Asia/Kolkata (IST)", value: "Asia/Kolkata" },
  { label: "America/New_York (EST)", value: "America/New_York" },
  { label: "America/Los_Angeles (PST)", value: "America/Los_Angeles" },
  { label: "Europe/London (GMT)", value: "Europe/London" },
  { label: "UTC", value: "UTC" },
]

export function ScheduleDialog({
  open,
  onOpenChange,
  functionId,
  functionName,
  existingSchedule,
  onScheduleCreated,
}: ScheduleDialogProps) {
  const isEditMode = !!existingSchedule
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: `${functionName} Schedule`,
    description: "",
    enabled: true,
    cronPreset: "0 * * * *",
    customCron: "",
    timezone: "Asia/Kolkata",
    timeout: 60000,
    retryOnFailure: true,
    maxRetries: 3,
    notifyOnSuccess: false,
    notifyOnFailure: true,
    webhook: "",
    notes: "",
    tags: "",
    priority: "normal" as "low" | "normal" | "high",
  })

  useEffect(() => {
    if (existingSchedule && open) {
      // Fetch full schedule details to populate form
      const loadScheduleDetails = async () => {
        try {
          const { getScheduleStatus } = await import("@/lib/api-service")
          const scheduleDetails = await getScheduleStatus(existingSchedule.id)

          // Determine if cron matches a preset
          const matchingPreset = CRON_PRESETS.find((p) => p.value === scheduleDetails.trigger?.cron)

          setFormData({
            name: scheduleDetails.name || `${functionName} Schedule`,
            description: scheduleDetails.description || "",
            enabled: scheduleDetails.enabled ?? true,
            cronPreset: matchingPreset ? matchingPreset.value : "custom",
            customCron: matchingPreset ? "" : scheduleDetails.trigger?.cron || "",
            timezone: scheduleDetails.trigger?.timezone || "Asia/Kolkata",
            timeout: scheduleDetails.params?.timeout || 60000,
            retryOnFailure: scheduleDetails.params?.retryOnFailure ?? true,
            maxRetries: scheduleDetails.params?.maxRetries || 3,
            notifyOnSuccess: scheduleDetails.notifications?.onSuccess ?? false,
            notifyOnFailure: scheduleDetails.notifications?.onFailure ?? true,
            webhook: scheduleDetails.notifications?.webhook || "",
            notes: scheduleDetails.meta?.notes || "",
            tags: scheduleDetails.meta?.tags?.join(", ") || "",
            priority: scheduleDetails.meta?.priority || "normal",
          })
        } catch (error) {
          console.error("[v0] Error loading schedule details:", error)
        }
      }
      loadScheduleDetails()
    } else if (!open) {
      // Reset form when dialog closes
      setFormData({
        name: `${functionName} Schedule`,
        description: "",
        enabled: true,
        cronPreset: "0 * * * *",
        customCron: "",
        timezone: "Asia/Kolkata",
        timeout: 60000,
        retryOnFailure: true,
        maxRetries: 3,
        notifyOnSuccess: false,
        notifyOnFailure: true,
        webhook: "",
        notes: "",
        tags: "",
        priority: "normal",
      })
    }
  }, [existingSchedule, open, functionName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const cronValue = formData.cronPreset === "custom" ? formData.customCron : formData.cronPreset

      if (isEditMode && existingSchedule) {
        // Update existing schedule
        const scheduleData: UpdateScheduleRequest = {
          name: formData.name,
          description: formData.description,
          enabled: formData.enabled,
          trigger: {
            cron: cronValue,
            timezone: formData.timezone,
          },
          params: {
            testData: {},
            timeout: formData.timeout,
            retryOnFailure: formData.retryOnFailure,
            maxRetries: formData.maxRetries,
          },
          notifications: {
            onSuccess: formData.notifyOnSuccess,
            onFailure: formData.notifyOnFailure,
            webhook: formData.webhook || undefined,
          },
          meta: {
            notes: formData.notes,
            tags: formData.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
            priority: formData.priority,
          },
        }

        const { updateSchedule } = await import("@/lib/api-service")
        await updateSchedule(existingSchedule.id, scheduleData)
      } else {
        // Create new schedule
        const scheduleData: CreateScheduleRequest = {
          name: formData.name,
          description: formData.description,
          function_id: functionId,
          enabled: formData.enabled,
          trigger: {
            cron: cronValue,
            timezone: formData.timezone,
          },
          params: {
            testData: {},
            timeout: formData.timeout,
            retryOnFailure: formData.retryOnFailure,
            maxRetries: formData.maxRetries,
          },
          notifications: {
            onSuccess: formData.notifyOnSuccess,
            onFailure: formData.notifyOnFailure,
            webhook: formData.webhook || undefined,
          },
          meta: {
            notes: formData.notes,
            tags: formData.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
            priority: formData.priority,
          },
          createdBy: "admin",
        }

        const { createSchedule } = await import("@/lib/api-service")
        await createSchedule(scheduleData)
      }

      onScheduleCreated?.()
      onOpenChange(false)
    } catch (error) {
      console.error(`[v0] Error ${isEditMode ? "updating" : "creating"} schedule:`, error)
      alert(error instanceof Error ? error.message : `Failed to ${isEditMode ? "update" : "create"} schedule`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Update Schedule" : "Create Schedule"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? `Update schedule for ${functionName}` : `Schedule automatic execution for ${functionName}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Schedule Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Hourly Data Sync"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this schedule does"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="space-y-0.5">
                <Label htmlFor="enabled" className="text-base font-semibold">
                  Enable Schedule
                </Label>
                <p className="text-sm text-muted-foreground">
                  Schedule will {formData.enabled ? "start running" : "be created but not run"} immediately
                </p>
              </div>
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
            </div>
          </div>

          {/* Schedule Configuration */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold">Schedule Configuration</h3>

            <div>
              <Label htmlFor="cronPreset">Frequency</Label>
              <Select
                value={formData.cronPreset}
                onValueChange={(value) => setFormData({ ...formData, cronPreset: value })}
              >
                <SelectTrigger id="cronPreset">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CRON_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.cronPreset === "custom" && (
              <div>
                <Label htmlFor="customCron">Custom Cron Expression</Label>
                <Input
                  id="customCron"
                  value={formData.customCron}
                  onChange={(e) => setFormData({ ...formData, customCron: e.target.value })}
                  placeholder="*/5 * * * *"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Format: minute hour day month weekday</p>
              </div>
            )}

            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) => setFormData({ ...formData, timezone: value })}
              >
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Execution Settings */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold">Execution Settings</h3>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: "low" | "normal" | "high") => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Higher priority schedules are executed first when multiple schedules run simultaneously
              </p>
            </div>

            <div>
              <Label htmlFor="timeout">Timeout (ms)</Label>
              <Input
                id="timeout"
                type="number"
                value={formData.timeout}
                onChange={(e) => setFormData({ ...formData, timeout: Number.parseInt(e.target.value) })}
                min={1000}
                step={1000}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="retryOnFailure">Retry on Failure</Label>
                <p className="text-xs text-muted-foreground">Automatically retry failed executions</p>
              </div>
              <Switch
                id="retryOnFailure"
                checked={formData.retryOnFailure}
                onCheckedChange={(checked) => setFormData({ ...formData, retryOnFailure: checked })}
              />
            </div>

            {formData.retryOnFailure && (
              <div>
                <Label htmlFor="maxRetries">Max Retries</Label>
                <Input
                  id="maxRetries"
                  type="number"
                  value={formData.maxRetries}
                  onChange={(e) => setFormData({ ...formData, maxRetries: Number.parseInt(e.target.value) })}
                  min={1}
                  max={10}
                />
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold">Notifications</h3>

            <div className="flex items-center justify-between">
              <Label htmlFor="notifyOnSuccess">Notify on Success</Label>
              <Switch
                id="notifyOnSuccess"
                checked={formData.notifyOnSuccess}
                onCheckedChange={(checked) => setFormData({ ...formData, notifyOnSuccess: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="notifyOnFailure">Notify on Failure</Label>
              <Switch
                id="notifyOnFailure"
                checked={formData.notifyOnFailure}
                onCheckedChange={(checked) => setFormData({ ...formData, notifyOnFailure: checked })}
              />
            </div>

            {(formData.notifyOnSuccess || formData.notifyOnFailure) && (
              <div>
                <Label htmlFor="webhook">Webhook URL (Optional)</Label>
                <Input
                  id="webhook"
                  type="url"
                  value={formData.webhook}
                  onChange={(e) => setFormData({ ...formData, webhook: e.target.value })}
                  placeholder="https://your-webhook.com/notify"
                />
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold">Additional Information</h3>

            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="production, hourly, critical"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this schedule"
                rows={2}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : isEditMode ? (
                "Update Schedule"
              ) : (
                "Create Schedule"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
