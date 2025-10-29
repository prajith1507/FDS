"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { Input } from "@/components/ui/input"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { 
  Search, 
  Pencil, 
  Trash2, 
  Database,
  Plus,
  Eye,
  RefreshCw
} from "lucide-react"
import { AnyDatabaseConfig, DatabaseProvider } from "@/lib/types/datasource"

interface DataSourcesTableProps {
  dataSources: AnyDatabaseConfig[]
  onEdit: (dataSource: AnyDatabaseConfig) => void
  onDelete: (id: string) => void
  onTestConnection: (dataSource: AnyDatabaseConfig) => void
  onViewTables: (dataSource: AnyDatabaseConfig) => void
  onViewData?: (dataSource: AnyDatabaseConfig) => void
  onAddNew: () => void
  onRefresh?: () => void
  isLoading?: boolean
}

export function DataSourcesTable({
  dataSources,
  onEdit,
  onDelete,
  onTestConnection,
  onViewTables,
  onViewData,
  onAddNew,
  onRefresh,
  isLoading = false
}: DataSourcesTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedDataSource, setSelectedDataSource] = useState<AnyDatabaseConfig | null>(null)

  const filteredDataSources = dataSources.filter(ds =>
    ds.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ds.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ds.host && ds.host.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (ds.database && ds.database.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleDelete = (dataSource: AnyDatabaseConfig) => {
    setSelectedDataSource(dataSource)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (selectedDataSource?.id) {
      onDelete(selectedDataSource.id)
      setDeleteDialogOpen(false)
      setSelectedDataSource(null)
    }
  }

  if (dataSources.length === 0 && !isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <Database className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-medium">No Data Sources</h3>
              <p className="text-muted-foreground">
                Connect your first database to get started with AI-powered dashboards.
              </p>
            </div>
            <Button onClick={onAddNew} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add Data Source
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Search and Refresh Controls */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Data Sources</h2>
          <p className="text-muted-foreground">
            Manage your database connections and generate AI-powered dashboards.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Manual Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          
          {/* Add Data Source Button */}
          <Button onClick={onAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Data Source
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search data sources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded animate-pulse" />
                  <div className="flex-1 space-y-1">
                    <div className="w-24 h-4 bg-muted rounded animate-pulse" />
                    <div className="w-16 h-3 bg-muted rounded animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="w-20 h-4 bg-muted rounded animate-pulse" />
                  <div className="w-32 h-3 bg-muted rounded animate-pulse" />
                  <div className="w-16 h-6 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </Card>
          ))
        ) : filteredDataSources.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <Database className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-medium">No data sources found</h3>
                    <p className="text-muted-foreground">
                      No data sources match your search criteria.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredDataSources.map((dataSource: AnyDatabaseConfig) => {
            return (
              <Card 
                key={dataSource.id} 
                className="transition-all duration-300 hover:shadow-md"
              >
                <CardContent className="p-6">
                  {/* Main Title without Status Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">{dataSource.name}</h3>
                    
                    {/* Action buttons - always visible with consistent styling */}
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (onViewData) {
                            onViewData(dataSource)
                          }
                        }}
                        title="View Data"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          onEdit(dataSource)
                        }}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleDelete(dataSource)
                        }}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Database Type and Connection Info */}
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-muted-foreground">
                      {getDisplayName(dataSource.type)}
                    </p>
                    {dataSource.host && (
                      <p className="text-xs text-muted-foreground">
                        {dataSource.host}{dataSource.port ? `:${dataSource.port}` : ''}
                        {dataSource.database ? ` / ${dataSource.database}` : ''}
                      </p>
                    )}
                    {dataSource.connectionString && !dataSource.host && (
                      <p className="text-xs text-muted-foreground truncate">
                        Connection string configured
                      </p>
                    )}
                  </div>
                  
                  {/* Description */}
                  {dataSource.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {dataSource.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Data Source</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedDataSource?.name}"? This action cannot be undone.
              Any dashboards using this data source will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function getDisplayName(type: string): string {
  const names: Record<string, string> = {
    postgresql: 'PostgreSQL',
    mysql: 'MySQL',
    mongodb: 'MongoDB',
    sqlite: 'SQLite',
    oracle: 'Oracle',
    sqlserver: 'SQL Server',
    snowflake: 'Snowflake',
    bigquery: 'BigQuery',
    redshift: 'Redshift',
    clickhouse: 'ClickHouse',
    mariadb: 'MariaDB',
    elasticsearch: 'Elasticsearch',
    redis: 'Redis',
    cassandra: 'Cassandra',
    saphana: 'SAP HANA',
    vertica: 'Vertica',
    trino: 'Trino'
  }

  return names[type] || type
}