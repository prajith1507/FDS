/**
 * ModernMongoExplorer Component
 * Modern MongoDB collection explorer using AdvancedDataViewer
 */

"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { AdvancedDataViewer } from "./advanced-data-viewer"
import { DataRow, DatabaseInfo } from "@/lib/types/data-viewer"
import { Loader2 } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

interface ModernMongoExplorerProps {
  selectedCollection: string
  datasourceId?: string
  setTotal?: (total: number) => void
  total?: number
}

export function ModernMongoExplorer({
  selectedCollection,
  datasourceId,
  setTotal,
  total,
}: ModernMongoExplorerProps) {
  const [docs, setDocs] = useState<DataRow[]>([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (!selectedCollection) return
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCollection, datasourceId])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Build URL with datasourceId parameter
      const queryParams = new URLSearchParams({
        page: '1',
        limit: '1000',
      })
      
      if (datasourceId) {
        queryParams.append('datasourceId', datasourceId)
      }
      
      const url = `${API_BASE_URL}/mongo/api/${selectedCollection}?${queryParams.toString()}`
      console.log('[ModernMongoExplorer] Fetching data from:', url)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Transform MongoDB documents to DataRow format
      const rows: DataRow[] = (data.docs || []).map((doc: any, index: number) => ({
        ...doc,
        _rowId: doc._id || doc.id || `row-${index}`,
      }))

      console.log('[ModernMongoExplorer] Loaded', rows.length, 'documents')
      setDocs(rows)
      setTotalRecords(data.total || rows.length)
      setTotal?.(data.total || rows.length)
    } catch (error) {
      console.error('Error loading collection data:', error)
      toast({
        title: "Error Loading Data",
        description: error instanceof Error ? error.message : "Failed to load collection data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const databaseInfo: DatabaseInfo = {
    type: 'mongodb',
    name: 'MongoDB',
    table: selectedCollection,
    isNoSQL: true,
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Loading collection data...</p>
        </div>
      </div>
    )
  }

  return (
    <AdvancedDataViewer
      database={databaseInfo}
      initialData={docs}
      initialTotal={totalRecords}
      onDataChange={(result) => {
        setTotal?.(result.total)
      }}
      onError={(error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      }}
      features={{
        export: true,
        filter: true,
        sort: true,
        search: true,
        statistics: true,
        viewToggle: true,
      }}
    />
  )
}
