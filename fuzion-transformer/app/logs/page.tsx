"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, Filter, X, ChevronLeft, ChevronRight, Clock, CheckCircle2, XCircle, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { fetchScheduleRunLogs, fetchAllSchedules } from "@/lib/api-service"
import type { ScheduleRunLog, ScheduleRunLogsFilters } from "@/types/api"
import { formatDistanceToNow } from "date-fns"

interface ScheduleOption {
  id: string
  name: string
  functionName: string
}

export default function LogsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [logs, setLogs] = useState<ScheduleRunLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLog, setSelectedLog] = useState<ScheduleRunLog | null>(null)
  const [schedules, setSchedules] = useState<ScheduleOption[]>([])
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
    hasNextPage: false,
    hasPrevPage: false,
  })

  // Filter states
  const [filters, setFilters] = useState<ScheduleRunLogsFilters>({
    status: searchParams.get("status") as "success" | "error" | undefined,
    hours: searchParams.get("hours") ? Number(searchParams.get("hours")) : undefined,
    scheduleId: searchParams.get("scheduleId") || undefined,
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
    limit: 20,
  })

  useEffect(() => {
    loadSchedules()
  }, [])

  useEffect(() => {
    loadLogs()
  }, [filters])

  async function loadSchedules() {
    try {
      const response = await fetchAllSchedules()
      console.log("[v0] Schedules response:", response)

      if (response.status === 1 && response.data?.schedules) {
        const scheduleOptions: ScheduleOption[] = response.data.schedules.map((schedule: any) => ({
          id: schedule.id,
          name: schedule.name || "Unnamed Schedule",
          functionName: schedule.function_name || "Unknown Function",
        }))
        setSchedules(scheduleOptions)
        console.log("[v0] Loaded schedules:", scheduleOptions.length)
      }
    } catch (err) {
      console.error("[v0] Error loading schedules:", err)
    }
  }

  async function loadLogs() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetchScheduleRunLogs(filters)

      if (response.status === 1 && response.data) {
        setLogs(response.data.logs || [])
        setPagination(
          response.data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalCount: response.data.logs?.length || 0,
            limit: 20,
            hasNextPage: false,
            hasPrevPage: false,
          },
        )
      } else {
        setLogs([])
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          limit: 20,
          hasNextPage: false,
          hasPrevPage: false,
        })
      }
    } catch (err) {
      console.error("[v0] Error loading logs:", err)
      setError(err instanceof Error ? err.message : "Failed to load logs")
      setLogs([])
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        limit: 20,
        hasNextPage: false,
        hasPrevPage: false,
      })
    } finally {
      setLoading(false)
    }
  }

  function updateFilters(newFilters: Partial<ScheduleRunLogsFilters>) {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }))
  }

  function clearFilters() {
    setFilters({ page: 1, limit: 20 })
  }

  function formatDuration(ms?: number) {
    if (!ms) return "N/A"
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  function formatBytes(bytes?: number) {
    if (!bytes) return "N/A"
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
  }

  function formatRunId(runId: string) {
    if (runId.length <= 16) return runId
    return `${runId.slice(0, 8)}...${runId.slice(-8)}`
  }

  const hasActiveFilters = filters.status || filters.hours || filters.scheduleId

  if (loading && logs.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Schedule Run Logs</h1>
              <p className="text-sm text-muted-foreground mt-1">Monitor and analyze schedule execution history</p>
            </div>
            <Button variant="outline" onClick={() => router.push("/")}>
              Back to Functions
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>

            <Select
              value={filters.status || "all"}
              onValueChange={(v) => updateFilters({ status: v === "all" ? undefined : (v as "success" | "error") })}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.hours?.toString() || "all"}
              onValueChange={(v) => updateFilters({ hours: v === "all" ? undefined : Number(v) })}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="1">Last Hour</SelectItem>
                <SelectItem value="24">Last 24 Hours</SelectItem>
                <SelectItem value="168">Last Week</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.scheduleId || "all"}
              onValueChange={(v) => updateFilters({ scheduleId: v === "all" ? undefined : v })}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Schedules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schedules</SelectItem>
                {schedules.map((schedule) => (
                  <SelectItem key={schedule.id} value={schedule.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{schedule.name}</span>
                      <span className="text-xs text-muted-foreground">{schedule.functionName}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}

            <div className="ml-auto text-sm text-muted-foreground">
              {pagination.totalCount} total log{pagination.totalCount !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-6">
        {error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Failed to Load Logs</h2>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadLogs} style={{ backgroundColor: "#0056a4" }}>Retry</Button>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No logs found</h3>
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters ? "Try adjusting your filters" : "Schedule executions will appear here"}
            </p>
          </div>
        ) : (
          <>
            {/* Logs Table */}
            <div className="border border-border rounded-lg overflow-hidden bg-card">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Function</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Schedule</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Duration</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Started</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {logs.map((log) => (
                      <tr
                        key={log._id}
                        className="hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => setSelectedLog(log)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {log.status === "success" ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : log.status === "error" ? (
                              <XCircle className="h-4 w-4 text-destructive" />
                            ) : (
                              <Clock className="h-4 w-4 text-yellow-600" />
                            )}
                            <span className="text-sm capitalize">{log.status}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm font-medium">{log.functionName}</div>
                            <div className="text-xs text-muted-foreground">{log.functionId?.version || "N/A"}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">{log.scheduleName}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-mono">{formatDuration(log.duration)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            {formatDistanceToNow(new Date(log.startTime), { addSuffix: true })}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              log.metaTags?.priority === "high"
                                ? "destructive"
                                : log.metaTags?.priority === "low"
                                  ? "secondary"
                                  : "default"
                            }
                          >
                            {log.metaTags?.priority || "normal"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasPrevPage}
                    onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasNextPage}
                    onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Sheet open={selectedLog !== null} onOpenChange={() => setSelectedLog(null)}>
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
          {selectedLog && (
            <>
              <SheetHeader className="pb-3 border-b">
                <SheetTitle className="flex items-center gap-3">
                  {selectedLog.status === "success" ? (
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-500" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-lg font-semibold">{selectedLog.functionName}</div>
                    <div className="text-sm font-normal text-muted-foreground">{selectedLog.scheduleName}</div>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="p-4 space-y-5">
                {/* Overview Section */}
                <div>
                  <h3 className="text-base font-semibold mb-3">Overview</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                          Run ID
                        </div>
                        <div className="font-mono text-sm bg-muted px-3 py-1.5 rounded-md break-all">
                          {formatRunId(selectedLog.runId)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                          Status
                        </div>
                        <Badge
                          variant={selectedLog.status === "success" ? "default" : "destructive"}
                          className="text-sm px-3 py-1.5"
                        >
                          {selectedLog.status === "success" ? (
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 mr-1.5" />
                          )}
                          {selectedLog.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                          Duration
                        </div>
                        <div className="text-3xl font-bold tabular-nums">{formatDuration(selectedLog.duration)}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                          Priority
                        </div>
                        <Badge
                          variant={
                            selectedLog.metaTags?.priority === "high"
                              ? "destructive"
                              : selectedLog.metaTags?.priority === "low"
                                ? "secondary"
                                : "default"
                          }
                          className="text-sm px-3 py-1.5"
                        >
                          {selectedLog.metaTags?.priority || "normal"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timing Section */}
                <div className="border-t pt-5">
                  <h3 className="text-base font-semibold mb-3">Timing</h3>
                  <div className="space-y-2">
                    {selectedLog.trigger?.scheduledTime && (
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-muted-foreground">Scheduled Time</span>
                        <span className="text-sm font-medium font-mono">
                          {new Date(selectedLog.trigger.scheduledTime).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-muted-foreground">Actual Start</span>
                      <span className="text-sm font-medium font-mono">
                        {new Date(selectedLog.startTime).toLocaleString()}
                      </span>
                    </div>
                    {selectedLog.endTime && (
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-muted-foreground">End Time</span>
                        <span className="text-sm font-medium font-mono">
                          {new Date(selectedLog.endTime).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Performance Section */}
                <div className="border-t pt-5">
                  <h3 className="text-base font-semibold mb-3">Performance</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    {selectedLog.memoryUsage && (
                      <>
                        <div>
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                            Memory (RSS)
                          </div>
                          <div className="text-2xl font-bold tabular-nums">
                            {formatBytes(selectedLog.memoryUsage.rss)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                            Heap Used
                          </div>
                          <div className="text-2xl font-bold tabular-nums">
                            {formatBytes(selectedLog.memoryUsage.heapUsed)}
                          </div>
                        </div>
                      </>
                    )}
                    {selectedLog.cpuUsage && (
                      <>
                        <div>
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                            CPU User
                          </div>
                          <div className="text-2xl font-bold tabular-nums">
                            {(selectedLog.cpuUsage.user / 1000).toFixed(2)}ms
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                            CPU System
                          </div>
                          <div className="text-2xl font-bold tabular-nums">
                            {(selectedLog.cpuUsage.system / 1000).toFixed(2)}ms
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Environment Section */}
                <div className="border-t pt-5">
                  <h3 className="text-base font-semibold mb-3">Environment</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-muted-foreground">Node Version</span>
                      <span className="text-sm font-medium font-mono bg-muted px-2.5 py-1 rounded">
                        {selectedLog.nodeVersion}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-muted-foreground">Environment</span>
                      <Badge variant="secondary" className="font-mono">
                        {selectedLog.environment}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-muted-foreground">Hostname</span>
                      <span className="text-xs font-mono bg-muted px-2.5 py-1 rounded">{selectedLog.hostname}</span>
                    </div>
                  </div>
                </div>

                {/* Error Section */}
                {selectedLog.error && (
                  <div className="border-t border-destructive/20 pt-5">
                    <h3 className="text-base font-semibold text-destructive flex items-center gap-2 mb-3">
                      <XCircle className="h-4 w-4" />
                      Error Details
                    </h3>
                    <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                      <div className="text-sm font-semibold text-destructive mb-3">{selectedLog.error.message}</div>
                      {selectedLog.error.stack && (
                        <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap text-muted-foreground mt-4 pt-4 border-t border-destructive/20">
                          {selectedLog.error.stack}
                        </pre>
                      )}
                    </div>
                  </div>
                )}

                {/* Console Output Section */}
                {selectedLog.consoleOutput && (
                  <div className="border-t pt-5">
                    <h3 className="text-base font-semibold mb-3">Console Output</h3>
                    <div className="bg-slate-950 dark:bg-slate-900 rounded-lg p-4 max-h-96 overflow-y-auto border">
                      <pre className="text-xs font-mono whitespace-pre-wrap text-slate-50 leading-relaxed">
                        {selectedLog.consoleOutput}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Function Tags Section */}
                {selectedLog.functionId?.tags && selectedLog.functionId.tags.length > 0 && (
                  <div className="border-t pt-5">
                    <h3 className="text-base font-semibold mb-3">Function Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedLog.functionId.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="px-3 py-1.5">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
