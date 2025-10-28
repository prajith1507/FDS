"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createSchedule, getScheduleStatus, updateSchedule } from "@/lib/api-service"
import { useToast } from "@/hooks/use-toast"
import type { SchedulingInfo } from "@/types/api"

interface QuickScheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  functionId: string
  functionName: string
  existingSchedule?: SchedulingInfo
  onScheduleCreated: () => void
}

const CRON_PRESETS = [
  { label: "Every 5 minutes", value: "*/5 * * * *" },
  { label: "Every 15 minutes", value: "*/15 * * * *" },
  { label: "Every 30 minutes", value: "*/30 * * * *" },
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every 6 hours", value: "0 */6 * * *" },
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

export function QuickScheduleDialog({
  open,
  onOpenChange,
  functionId,
  functionName,
  existingSchedule,
  onScheduleCreated,
}: QuickScheduleDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetchingSchedule, setFetchingSchedule] = useState(false)

  const [isEditMode, setIsEditMode] = useState(false)
  const [scheduleId, setScheduleId] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [enabled, setEnabled] = useState(true)
  const [cronPreset, setCronPreset] = useState("*/5 * * * *")
  const [customCron, setCustomCron] = useState("")
  const [timezone, setTimezone] = useState("Asia/Kolkata")

  const isCustom = cronPreset === "custom"
  const cronExpression = isCustom ? customCron : cronPreset

  useEffect(() => {
    async function loadScheduleData() {
      if (!open) {
        // Reset form when dialog closes
        setIsEditMode(false)
        setScheduleId(null)
        setName("")
        setDescription("")
        setEnabled(true)
        setCronPreset("*/5 * * * *")
        setCustomCron("")
        setTimezone("Asia/Kolkata")
        return
      }

      // Check if function has existing schedules
      if (existingSchedule?.hasSchedules && existingSchedule.schedules.length > 0) {
        const firstSchedule = existingSchedule.schedules[0]
        setIsEditMode(true)
        setScheduleId(firstSchedule.id)

        try {
          setFetchingSchedule(true)
          console.log("[v0] Fetching schedule details for ID:", firstSchedule.id)

          const response = await getScheduleStatus(firstSchedule.id)
          console.log("[v0] Schedule details response:", response)

          const scheduleData = response.data?.schedule || response.schedule || response
          console.log("[v0] Extracted schedule data:", scheduleData)

          // Populate form with existing schedule data
          setName(scheduleData.name || "")
          setDescription(scheduleData.description || "")
          setEnabled(scheduleData.enabled ?? true)
          setTimezone(scheduleData.trigger?.timezone || "Asia/Kolkata")

          // Set cron expression
          const cron = scheduleData.trigger?.cron || firstSchedule.cron
          const matchingPreset = CRON_PRESETS.find((p) => p.value === cron)
          if (matchingPreset && matchingPreset.value !== "custom") {
            setCronPreset(cron)
            setCustomCron("")
          } else {
            setCronPreset("custom")
            setCustomCron(cron)
          }

          console.log("[v0] Form populated with:", {
            name: scheduleData.name,
            description: scheduleData.description,
            enabled: scheduleData.enabled,
            cron,
          })
        } catch (error) {
          console.error("[v0] Error fetching schedule details:", error)
          toast({
            title: "Warning",
            description: "Could not load schedule details. Using basic information.",
            variant: "destructive",
          })

          // Fallback to basic schedule info
          setName(`${functionName} Schedule`)
          setDescription("")
          setEnabled(firstSchedule.enabled)
          const matchingPreset = CRON_PRESETS.find((p) => p.value === firstSchedule.cron)
          if (matchingPreset && matchingPreset.value !== "custom") {
            setCronPreset(firstSchedule.cron)
            setCustomCron("")
          } else {
            setCronPreset("custom")
            setCustomCron(firstSchedule.cron)
          }
        } finally {
          setFetchingSchedule(false)
        }
      }
    }

    loadScheduleData()
  }, [open, existingSchedule, functionName, toast])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a schedule name",
        variant: "destructive",
      })
      return
    }

    if (!cronExpression.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a cron expression",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const scheduleData = {
        name: name.trim(),
        description: description.trim(),
        function_id: functionId,
        enabled,
        trigger: {
          cron: cronExpression,
          timezone,
        },
      }

      if (isEditMode && scheduleId) {
        console.log("[v0] Updating schedule:", scheduleId)
        await updateSchedule(scheduleId, scheduleData)
        toast({
          title: "Success",
          description: "Schedule updated successfully",
        })
      } else {
        console.log("[v0] Creating new schedule")
        await createSchedule(scheduleData)
        toast({
          title: "Success",
          description: "Schedule created successfully",
        })
      }

      onScheduleCreated()
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Error saving schedule:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save schedule",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Update Schedule" : "Create Schedule"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? `Update schedule for ${functionName}` : `Schedule ${functionName} to run automatically`}
          </DialogDescription>
        </DialogHeader>

        {fetchingSchedule ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Loading schedule details...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-name">Schedule Name</Label>
              <Input
                id="schedule-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Daily Customer Report"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule-description">Description</Label>
              <Textarea
                id="schedule-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what this schedule does"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Schedule</Label>
                <p className="text-sm text-muted-foreground">
                  {enabled ? "Schedule will run automatically" : "Schedule will be created but disabled"}
                </p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cron-preset">Schedule Frequency</Label>
              <Select value={cronPreset} onValueChange={setCronPreset}>
                <SelectTrigger id="cron-preset">
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

            {isCustom && (
              <div className="space-y-2">
                <Label htmlFor="custom-cron">Custom Cron Expression</Label>
                <Input
                  id="custom-cron"
                  value={customCron}
                  onChange={(e) => setCustomCron(e.target.value)}
                  placeholder="*/5 * * * *"
                />
                <p className="text-xs text-muted-foreground">Format: minute hour day month weekday</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
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
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
