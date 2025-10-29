"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Pencil, Trash2, Calendar, CalendarCheck, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { QuickScheduleDialog } from "@/components/quick-schedule-dialog"
import type { SchedulingInfo } from "@/types/api"

interface GeneratedFunction {
  id: string
  name: string
  shortDescription: string
  longDescription?: string
  code: string
  tags?: string[]
  status: string
  createdBy: string
  createdAt: string
  updatedAt: string
  scheduling?: SchedulingInfo
}

export default function FunctionsListPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [functions, setFunctions] = useState<GeneratedFunction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [quickScheduleDialogOpen, setQuickScheduleDialogOpen] = useState(false)
  const [selectedFunctionForSchedule, setSelectedFunctionForSchedule] = useState<GeneratedFunction | null>(null)

  useEffect(() => {
    loadFunctions()
  }, [])

  async function loadFunctions() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/generated-functions")
      if (!response.ok) {
        throw new Error("Failed to fetch functions")
      }

      const data = await response.json()
      console.log("[v0] Functions response data:", data)

      let functionsArray: GeneratedFunction[] = []

      if (Array.isArray(data)) {
        functionsArray = data
      } else if (data && data.data && Array.isArray(data.data.functions)) {
        functionsArray = data.data.functions
      } else if (data && Array.isArray(data.data)) {
        functionsArray = data.data
      } else if (data && Array.isArray(data.functions)) {
        functionsArray = data.functions
      } else {
        console.warn("[v0] Unexpected response format:", data)
        functionsArray = []
      }

      setFunctions(functionsArray)
    } catch (err) {
      console.error("[v0] Error loading functions:", err)
      setError(err instanceof Error ? err.message : "Failed to load functions")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      setDeleting(true)

      const response = await fetch(`/api/generated-functions/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete function")
      }

      toast({
        title: "Success",
        description: "Function deleted successfully",
      })

      setFunctions((prev) => prev.filter((f) => f.id !== id))
      setDeleteId(null)
    } catch (err) {
      console.error("[v0] Error deleting function:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete function",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  function handleCreateSchedule(func: GeneratedFunction) {
    setSelectedFunctionForSchedule(func)
    setQuickScheduleDialogOpen(true)
  }

  function handleScheduleCreated() {
    toast({
      title: "Success",
      description: "Schedule created successfully",
    })
    loadFunctions()
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading functions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">Failed to Load Functions</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <Button onClick={loadFunctions} style={{ backgroundColor: "#0056a4" }}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Generated Functions</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your data transformation functions</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/logs")}>
              <Activity className="h-4 w-4 mr-2" />
              View Logs
            </Button>
            <Button onClick={() => router.push("/editor")} style={{ backgroundColor: "#0056a4" }}>
              <Plus className="h-4 w-4 mr-2" />
              New Function
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {functions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No functions yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Get started by creating your first data transformation function
            </p>
            <Button onClick={() => router.push("/editor")} style={{ backgroundColor: "#0056a4" }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Function
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {functions.map((func) => (
              <div
                key={func.id}
                className="border border-border rounded-lg p-6 hover:border-primary/50 transition-colors bg-card"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg line-clamp-1">{func.name}</h3>
                    {func.scheduling?.hasSchedules && (
                      <div className="flex items-center gap-1 mt-1">
                        <CalendarCheck
                          className={`h-3 w-3 ${func.scheduling.activeSchedules > 0 ? "text-green-600" : "text-muted-foreground"}`}
                        />
                        <span
                          className={`text-xs ${func.scheduling.activeSchedules > 0 ? "text-green-600" : "text-muted-foreground"}`}
                        >
                          {func.scheduling.activeSchedules} active schedule
                          {func.scheduling.activeSchedules !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleCreateSchedule(func)}
                      title={func.scheduling?.hasSchedules ? "Manage schedules" : "Create schedule"}
                    >
                      {func.scheduling?.hasSchedules ? (
                        <CalendarCheck
                          className={`h-4 w-4 ${func.scheduling.activeSchedules > 0 ? "text-green-600" : "text-muted-foreground"}`}
                        />
                      ) : (
                        <Calendar className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => router.push(`/editor/${func.id}`)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(func.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{func.shortDescription}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {func.tags?.map((tag) => (
                    <span key={tag} className="px-2 py-1 text-xs rounded-md bg-primary/10 text-primary">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Function</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this function? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedFunctionForSchedule && (
        <QuickScheduleDialog
          open={quickScheduleDialogOpen}
          onOpenChange={setQuickScheduleDialogOpen}
          functionId={selectedFunctionForSchedule.id}
          functionName={selectedFunctionForSchedule.name}
          existingSchedule={selectedFunctionForSchedule.scheduling}
          onScheduleCreated={handleScheduleCreated}
        />
      )}
    </div>
  )
}
