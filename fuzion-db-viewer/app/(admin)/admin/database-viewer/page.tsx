"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

// Dynamically import DatabaseViewer to avoid SSR issues
import { DatabaseViewer } from "@/components/database-viewer/components/database-viewer"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Database, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Collection {
  name: string
  documentCount?: number
}

interface ApiResponse {
  samplestate: {
    samplestate: {
      rowCount: number
      colCount: number
      intColCount: number
      dataTypeCount: number
      quality: {
        valid: number
        invalid: number
        missing: number
      }
      columnModel: any[]
      data?: any[][]
    }
  }
  response_status?: {
    status: string
    status_code: number
  }
}

function DatabaseViewerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [datasourceId, setDatasourceId] = useState<string | null>(null)
  const [datasourceName, setDatasourceName] = useState<string>("")
  const [datasourceType, setDatasourceType] = useState<string>("")
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
  const [data, setData] = useState<ApiResponse | null>(null)
  const [isLoadingCollections, setIsLoadingCollections] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)

  // Get datasource from URL params or localStorage
  useEffect(() => {
    const dsId = searchParams.get('datasource') || localStorage.getItem('selectedDatasourceId')
    const dsName = localStorage.getItem('selectedDatasourceName') || 'Database'
    const dsType = localStorage.getItem('selectedDatasourceType') || 'unknown'

    if (dsId) {
      setDatasourceId(dsId)
      setDatasourceName(dsName)
      setDatasourceType(dsType)
      loadCollections(dsId, dsType)
    } else {
      toast({
        title: "No Datasource Selected",
        description: "Please select a datasource from the Data Sources page",
        variant: "destructive"
      })
    }
  }, [searchParams, toast])

  const loadCollections = async (id: string, type: string) => {
    setIsLoadingCollections(true)
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://obl-syncapi.fuzionest.com'
      
      // For MongoDB, fetch collections
      if (type === 'mongodb') {
        const response = await fetch(
          `${API_BASE_URL}/mongo/api/collections?datasourceId=${id}`,
          {
            headers: { 'Content-Type': 'application/json' }
          }
        )
        
        if (!response.ok) {
          throw new Error(`Failed to fetch collections: ${response.statusText}`)
        }
        
        const result = await response.json()
        console.log('[DatabaseViewer] MongoDB collections response:', result)
        
        // Handle both array of strings and array of objects
        const collectionList = (result.collections || []).map((col: any) => 
          typeof col === 'string' ? { name: col } : col
        )
        setCollections(collectionList)
        
        // Auto-select first collection
        if (collectionList.length > 0) {
          const firstCollection = collectionList[0].name
          console.log('[DatabaseViewer] Auto-selecting first collection:', firstCollection)
          setSelectedCollection(firstCollection)
          loadCollectionData(id, firstCollection, 1, 'mongodb')
        } else {
          console.log('[DatabaseViewer] No collections found')
        }
      } else if (type === 'postgresql') {
        // For PostgreSQL, fetch tables
        const response = await fetch(
          `${API_BASE_URL}/pg/api/tables?datasourceId=${id}`,
          {
            headers: { 'Content-Type': 'application/json' }
          }
        )
        
        if (!response.ok) {
          throw new Error(`Failed to fetch tables: ${response.statusText}`)
        }
        
        const result = await response.json()
        console.log('[DatabaseViewer] PostgreSQL tables response:', result)
        
        // Handle both array of strings and array of objects
        const tableList = (result.tables || []).map((table: any) => 
          typeof table === 'string' ? { name: table } : table
        )
        setCollections(tableList)
        
        // Auto-select first table
        if (tableList.length > 0) {
          const firstTable = tableList[0].name
          console.log('[DatabaseViewer] Auto-selecting first table:', firstTable)
          setSelectedCollection(firstTable)
          loadCollectionData(id, firstTable, 1, 'postgresql')
        } else {
          console.log('[DatabaseViewer] No tables found')
        }
      } else {
        toast({
          title: "Unsupported Database",
          description: `This viewer currently supports MongoDB and PostgreSQL. ${type} is not yet supported.`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('[DatabaseViewer] Error loading collections:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load collections",
        variant: "destructive"
      })
    } finally {
      setIsLoadingCollections(false)
    }
  }

  const loadCollectionData = async (dsId: string, collectionName: string, page: number = 1, dbType?: string) => {
    // Only show loading on first page
    if (page === 1) {
      setIsLoadingData(true)
    }
    
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://obl-syncapi.fuzionest.com'
      
      // Use passed dbType or fall back to state
      const type = dbType || datasourceType
      
      // Determine the correct endpoint based on database type
      let url: string
      if (type === 'mongodb') {
        url = `${API_BASE_URL}/mongo/api/collections/${collectionName}/profile?datasourceId=${dsId}&page=${page}&limit=1000&sample=false`
      } else if (type === 'postgresql') {
        url = `${API_BASE_URL}/pg/api/tables/${collectionName}/profile?datasourceId=${dsId}&page=${page}&limit=1000&sample=false`
      } else {
        throw new Error(`Unsupported database type: ${type}`)
      }
      
      console.log('[DatabaseViewer] Fetching data from:', url, 'page:', page)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('[DatabaseViewer] Data loaded:', result.samplestate?.samplestate?.data?.length, 'rows')
      
      // Only set data state on first page, pagination will handle appending
      if (page === 1) {
        setData(result)
      }
      
      return result
    } catch (error) {
      console.error('[DatabaseViewer] Error loading data:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load collection data",
        variant: "destructive"
      })
      throw error
    } finally {
      if (page === 1) {
        setIsLoadingData(false)
      }
    }
  }
  
  const handleFetchMore = async (page: number) => {
    if (!datasourceId || !selectedCollection) {
      throw new Error('No datasource or collection selected')
    }
    return loadCollectionData(datasourceId, selectedCollection, page)
  }

  const handleCollectionChange = (collectionName: string) => {
    setSelectedCollection(collectionName)
    if (datasourceId) {
      loadCollectionData(datasourceId, collectionName, 1, datasourceType)
    }
  }

  const handleBack = () => {
    router.push('/admin/data-sources')
  }

  if (!datasourceId) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-12 text-center">
          <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">No Datasource Selected</h2>
          <p className="text-muted-foreground mb-4">
            Please select a datasource from the Data Sources page
          </p>
          <Button onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Data Sources
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header with Collection Selector */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4">
            {/* Left side - Back button and Title */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="h-6 w-px bg-border" />
              <div className="min-w-0">
                <h1 className="text-lg font-semibold truncate">{datasourceName}</h1>
                <p className="text-xs text-muted-foreground capitalize">{datasourceType} Database</p>
              </div>
            </div>

            {/* Right side - Collection/Table Selector */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm text-muted-foreground">
                {datasourceType === 'mongodb' ? 'Collection:' : 'Table:'}
              </span>
              <Select
                value={selectedCollection || undefined}
                onValueChange={handleCollectionChange}
                disabled={isLoadingCollections || collections.length === 0}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={datasourceType === 'mongodb' ? 'Select collection' : 'Select table'} />
                </SelectTrigger>
                <SelectContent>
                  {collections.map((collection) => (
                    <SelectItem key={collection.name} value={collection.name}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Total Collections/Tables Count Badge */}
              <Badge variant="secondary" className="h-6 text-xs">
                {collections.length} {datasourceType === 'mongodb' ? 'collections' : 'tables'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Viewer Content */}
      <div className="flex-1 overflow-hidden">
        {isLoadingCollections ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading {datasourceType === 'mongodb' ? 'collections' : 'tables'}...
              </p>
            </div>
          </div>
        ) : isLoadingData ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading data...</p>
            </div>
          </div>
        ) : data ? (
          <DatabaseViewer 
            key={`${datasourceId}-${selectedCollection}`}
            data={{
              samplestate: {
                samplestate: {
                  ...data.samplestate.samplestate,
                  data: data.samplestate.samplestate.data || []
                }
              },
              response_status: data.response_status || { status: 'success', status_code: 200 }
            }}
            datasourceId={datasourceId || undefined}
            collectionName={selectedCollection || undefined}
            onFetchMore={handleFetchMore}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <Card className="p-12 text-center max-w-md">
              <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-lg font-semibold mb-2">
                No {datasourceType === 'mongodb' ? 'Collection' : 'Table'} Selected
              </h2>
              <p className="text-muted-foreground">
                Select a {datasourceType === 'mongodb' ? 'collection' : 'table'} from the dropdown above to view its data
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DatabaseViewerPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <DatabaseViewerContent />
    </Suspense>
  )
}
