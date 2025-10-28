"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Eye, Pencil, Trash2, Database } from "lucide-react"
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
import {
  getDatasources,
  deleteDatasource,
  updateDatasource,
  createDatasource,
  testDatasourceConnection,
  payloadToConfig,
  configToPayload,
} from "@/lib/api/datasources"
import {
  AnyDatabaseConfig,
  DatabaseProvider,
} from "@/lib/types/datasource"
import { DatabaseSourceSelector } from "@/components/admin/database/database-source-selector-clean-v2"
import { DatabaseConfigForm } from "@/components/admin/database/database-config-form"

export default function DataSourcesListPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [dataSources, setDataSources] = useState<AnyDatabaseConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [selectorOpen, setSelectorOpen] = useState(false)
  const [configFormOpen, setConfigFormOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<DatabaseProvider | null>(null)
  const [editingDataSource, setEditingDataSource] = useState<AnyDatabaseConfig | null>(null)

  // Load data sources
  useEffect(() => {
    loadDataSources()
  }, [])

  const loadDataSources = async () => {
    setIsLoading(true)
    try {
      const response = await getDatasources()
      const configs = response.map(payloadToConfig)
      setDataSources(configs)
    } catch (err) {
      console.error("[DataSourcesListPage] Error loading datasources:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to load data sources",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddNew = () => {
    setSelectorOpen(true)
  }

  const handleProviderSelect = (provider: DatabaseProvider) => {
    setSelectedProvider(provider)
    setEditingDataSource(null)
    setSelectorOpen(false)
    setConfigFormOpen(true)
  }

  const handleEdit = (dataSource: AnyDatabaseConfig) => {
    const provider: DatabaseProvider = {
      id: dataSource.type,
      name: getProviderName(dataSource.type),
      description: getProviderDescription(dataSource.type),
      icon: getProviderIcon(dataSource.type),
      category: getProviderCategory(dataSource.type),
    }

    setSelectedProvider(provider)
    setEditingDataSource(dataSource)
    setConfigFormOpen(true)
  }

  const handleSaveDataSource = async (config: AnyDatabaseConfig) => {
    try {
      const payload = configToPayload(config)

      if (editingDataSource && editingDataSource.id) {
        // Update existing datasource
        const updated = await updateDatasource(editingDataSource.id, payload)
        const updatedConfig = payloadToConfig(updated)
        setDataSources((prev) =>
          prev.map((ds) => (ds.id === editingDataSource.id ? updatedConfig : ds))
        )
        toast({
          title: "Data Source Updated",
          description: `${config.name} has been updated successfully`,
        })
      } else {
        // Create new datasource
        const created = await createDatasource(payload)
        const newConfig = payloadToConfig(created)
        setDataSources((prev) => [...prev, newConfig])
        toast({
          title: "Data Source Added",
          description: `${config.name} has been added successfully`,
        })
      }

      setConfigFormOpen(false)
      setSelectedProvider(null)
      setEditingDataSource(null)
    } catch (error) {
      console.error("[DataSourcesListPage] Error saving datasource:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save data source",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true)
      await deleteDatasource(id)
      setDataSources((prev) => prev.filter((ds) => ds.id !== id))
      toast({
        title: "Data Source Deleted",
        description: "The data source has been removed",
      })
      setDeleteId(null)
    } catch (err) {
      console.error("[DataSourcesListPage] Error deleting datasource:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete data source",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleViewData = (dataSource: AnyDatabaseConfig) => {
    if (!dataSource.id) {
      toast({
        title: "Error",
        description: "Cannot view data for unsaved data source",
        variant: "destructive",
      })
      return
    }

    localStorage.setItem("selectedDatasourceId", dataSource.id)
    localStorage.setItem("selectedDatasourceName", dataSource.name)
    localStorage.setItem("selectedDatasourceType", dataSource.type)

    router.push(`/admin/database-viewer?datasource=${dataSource.id}`)
  }

  const handleCancel = () => {
    setConfigFormOpen(false)
    setSelectedProvider(null)
    setEditingDataSource(null)
  }

  // --- Render Loading ---
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Data Sources</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage and view your connected databases
            </p>
          </div>
          <Button
            onClick={handleAddNew}
            className="bg-[oklch(0.45_0.15_250)] text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Data Source
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="container mx-auto px-6 py-8">
        {dataSources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Database className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-lg font-semibold mb-2">No data sources yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get started by connecting your first database.
            </p>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" /> Add Data Source
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dataSources.map((dataSource) => (
              <div
                key={dataSource.id}
                className="border border-border rounded-lg p-6 hover:border-primary/50 transition-colors bg-card"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-1">{dataSource.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getProviderName(dataSource.type)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewData(dataSource)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(dataSource)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => setDeleteId(dataSource.id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {dataSource.host
                    ? `${dataSource.host}${dataSource.port ? ":" + dataSource.port : ""}`
                    : "Local database"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Data Source</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this data source? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Provider Selector */}
      <DatabaseSourceSelector
        onSelect={handleProviderSelect}
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
      />

      {/* Config Form */}
      {selectedProvider && (
        <DatabaseConfigForm
          provider={selectedProvider}
          initialConfig={editingDataSource || undefined}
          onSave={handleSaveDataSource}
          onCancel={handleCancel}
          isEditing={!!editingDataSource}
          open={configFormOpen}
          onOpenChange={setConfigFormOpen}
        />
      )}
    </div>
  )
}

/* --- Helper functions for provider details --- */
function getProviderName(type: string): string {
  const map: Record<string, string> = {
    postgresql: "PostgreSQL",
    mysql: "MySQL",
    sqlite: "SQLite",
    mongodb: "MongoDB",
    oracle: "Oracle",
    sqlserver: "SQL Server",
    snowflake: "Snowflake",
    bigquery: "BigQuery",
    redshift: "Redshift",
    clickhouse: "ClickHouse",
    mariadb: "MariaDB",
    elasticsearch: "Elasticsearch",
    redis: "Redis",
    cassandra: "Cassandra",
    saphana: "SAP HANA",
    vertica: "Vertica",
    trino: "Trino",
  }
  return map[type] || type
}

function getProviderDescription(type: string): string {
  const map: Record<string, string> = {
    postgresql: "Open source object-relational database system",
    mysql: "Popular open source relational database",
    mongodb: "Document-oriented NoSQL database",
    sqlite: "Lightweight file-based database",
    oracle: "Enterprise-grade relational database",
    sqlserver: "Microsoft SQL Server database",
    snowflake: "Cloud-based data warehousing platform",
    bigquery: "Google Cloud data warehouse",
    redshift: "Amazon data warehouse",
    clickhouse: "Columnar analytics database",
    mariadb: "MySQL-compatible database",
    elasticsearch: "Search and analytics engine",
    redis: "In-memory key-value store",
    cassandra: "Distributed NoSQL database",
    saphana: "In-memory database by SAP",
    vertica: "Columnar analytics platform",
    trino: "Distributed SQL query engine",
  }
  return map[type] || "Database system"
}

function getProviderIcon(type: string): string {
  const map: Record<string, string> = {
    postgresql: "🐘",
    mysql: "🐬",
    mongodb: "🍃",
    sqlite: "📁",
    oracle: "🔴",
    sqlserver: "🪟",
    snowflake: "❄️",
    bigquery: "📊",
    redshift: "🚀",
    clickhouse: "⚡",
    mariadb: "🗄️",
    elasticsearch: "🔍",
    redis: "💾",
    cassandra: "🔗",
    saphana: "🎯",
    vertica: "📈",
    trino: "⚙️",
  }
  return map[type] || "🗄️"
}

function getProviderCategory(
  type: string
): "relational" | "nosql" | "warehouse" | "analytics" | "cache" {
  const map: Record<string, "relational" | "nosql" | "warehouse" | "analytics" | "cache"> = {
    postgresql: "relational",
    mysql: "relational",
    sqlite: "relational",
    mongodb: "nosql",
    oracle: "relational",
    sqlserver: "relational",
    snowflake: "warehouse",
    bigquery: "warehouse",
    redshift: "warehouse",
    clickhouse: "analytics",
    mariadb: "relational",
    elasticsearch: "nosql",
    redis: "cache",
    cassandra: "nosql",
    saphana: "relational",
    vertica: "analytics",
    trino: "analytics",
  }
  return map[type] || "relational"
}
