"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Database, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getDatasource, getDatasourceCollections } from "@/lib/api/datasources"
import { listMongoCollections } from "@/lib/api/database-explorer"
import { CollectionSelector } from "@/components/admin/database/collection-selector"
import { DatabaseExplorer } from "@/components/admin/database/database-explorer"
import { ModernMongoExplorer } from "@/components/admin/database/modern-mongo-explorer"

function DataViewerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [datasourceId, setDatasourceId] = useState<string | null>(null)
  const [datasourceName, setDatasourceName] = useState<string>("")
  const [datasourceType, setDatasourceType] = useState<string>("")
  const [collections, setCollections] = useState<string[]>([])
  const [selectedCollection, setSelectedCollection] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)

  // Set page title
  useEffect(() => {
    document.title = 'Data Viewer | Admin'
  }, [])

  // Debug: Log collections when they change
  useEffect(() => {
    console.log('[DataViewer] Collections state updated:', collections, 'length:', collections.length)
  }, [collections])

  useEffect(() => {
    // Get datasource ID from URL params or localStorage
    const dsId = searchParams.get('datasource') || localStorage.getItem('selectedDatasourceId')
    const dsName = localStorage.getItem('selectedDatasourceName') || 'Database'
    const dsType = localStorage.getItem('selectedDatasourceType') || 'unknown'
    
    if (dsId) {
      setDatasourceId(dsId)
      setDatasourceName(dsName)
      setDatasourceType(dsType)
      loadDatasourceInfo(dsId, dsType)
    } else {
      toast({
        title: "No Datasource Selected",
        description: "Please select a datasource from the Data Sources page",
        variant: "destructive"
      })
      router.push('/admin/data-sources')
    }
  }, [searchParams, router, toast])

  const loadDatasourceInfo = async (id: string, type: string) => {
    setIsLoading(true)
    try {
      console.log('[DataViewer] Loading collections for datasource:', id, 'type:', type)
      // For MongoDB, use the direct MongoDB API
      if (type === 'mongodb') {
        const collections = await listMongoCollections(id)
        console.log('[DataViewer] Collections received:', collections)
        setCollections(collections)
      } else {
        // For other databases, try the datasource collections endpoint
        const collections = await getDatasourceCollections(id)
        console.log('[DataViewer] Collections received:', collections)
        setCollections(collections)
      }
    } catch (error) {
      console.error('Error loading datasource collections:', error)
      
      // If API doesn't support collection listing yet, show a message
      toast({
        title: "Collections Unavailable",
        description: error instanceof Error ? error.message : "Failed to load collections",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/admin/data-sources')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Loading datasource...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-4 space-y-4">
        {/* Compact Header - Single Row */}
        <div className="flex items-center justify-between gap-4 pb-3 border-b">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBack} className="h-8">
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              Back
            </Button>
            
            <div className="h-6 w-px bg-border" />
            
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">{datasourceName}</h1>
                <Badge variant="outline" className="text-xs">
                  {datasourceType.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          {/* Collection Selector Inline */}
          <CollectionSelector
            collections={collections}
            selectedCollection={selectedCollection}
            onCollectionChange={setSelectedCollection}
            isLoading={false}
            total={total}
          />
        </div>

        {/* Data Viewer */}
        {selectedCollection ? (
          datasourceType === 'mongodb' ? (
            <ModernMongoExplorer
              selectedCollection={selectedCollection}
              datasourceId={datasourceId || undefined}
              setTotal={setTotal}
              total={total}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Data Viewer</CardTitle>
                <CardDescription>
                  Table viewer for {datasourceType.toUpperCase()} is coming soon
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 space-y-4">
                  <Database className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-medium">Viewer Not Available</h3>
                    <p className="text-muted-foreground">
                      Table/Schema viewer for {datasourceType.toUpperCase()} databases is under development.
                      Currently, only MongoDB collections are supported.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <Database className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-medium">
                    Select a {datasourceType === 'mongodb' ? 'Collection' : 'Table'}
                  </h3>
                  <p className="text-muted-foreground">
                    Choose from the dropdown above to view your data
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        <p className="text-muted-foreground">Loading page...</p>
      </div>
    </div>
  )
}

export default function DataViewerPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DataViewerContent />
    </Suspense>
  )
}
