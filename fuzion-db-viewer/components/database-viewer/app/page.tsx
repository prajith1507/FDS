"use client"

import { DatabaseViewer } from "@/components/database-viewer"
import { useEffect, useState } from "react"
import { fetchCollectionData, type ApiResponse } from "@/lib/api"

export default function Home() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        // Pass empty query object for initial load
        const result = await fetchCollectionData(1, 1000, false, {})
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data")
        console.error("[v0] Error loading data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading data...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-lg font-semibold">Failed to Load Data</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </main>
    )
  }

  if (!data) {
    return null
  }

  return (
    <main className="min-h-screen bg-background">
      <DatabaseViewer data={data} />
    </main>
  )
}
