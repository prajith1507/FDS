"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DatabaseSourceSelector } from "@/components/admin/database/database-source-selector-clean-v2"
import { DatabaseConfigForm } from "@/components/admin/database/database-config-form"
import { DataSourcesTable } from "@/components/admin/database/data-sources-table"
import { DatabaseProvider, AnyDatabaseConfig } from "@/lib/types/datasource"
import { useToast } from "@/hooks/use-toast"
import {
  getDatasources,
  createDatasource,
  updateDatasource,
  deleteDatasource,
  testDatasourceConnection,
  configToPayload,
  payloadToConfig,
} from "@/lib/api/datasources"

type ViewMode = 'list' | 'add' | 'edit'

export default function DataSourcesPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [dataSources, setDataSources] = useState<AnyDatabaseConfig[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedProvider, setSelectedProvider] = useState<DatabaseProvider | null>(null)
  const [editingDataSource, setEditingDataSource] = useState<AnyDatabaseConfig | null>(null)
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [configFormOpen, setConfigFormOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Load data sources on mount
  useEffect(() => {
    const loadDataSources = async () => {
      setIsLoading(true)
      try {
        console.log('[DataSources Page] Loading datasources...')
        const response = await getDatasources()
        console.log('[DataSources Page] API Response:', response)
        const configs = response.map(payloadToConfig)
        console.log('[DataSources Page] Converted configs:', configs)
        setDataSources(configs)
      } catch (error) {
        console.error('[DataSources Page] Error loading datasources:', error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load data sources",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadDataSources()
  }, [toast])

  // Function to refresh data sources list
  const refreshDataSources = async () => {
    setIsRefreshing(true)
    try {
      console.log('[DataSources Page] Refreshing datasources...')
      const response = await getDatasources()
      const configs = response.map(payloadToConfig)
      setDataSources(configs)
      console.log('[DataSources Page] Data sources refreshed successfully, count:', configs.length)
    } catch (error) {
      console.error('[DataSources Page] Error refreshing datasources:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to refresh data sources",
        variant: "destructive"
      })
      throw error // Re-throw so caller knows refresh failed
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleAddNew = () => {
    setSelectorOpen(true)
  }

  const handleProviderSelect = (provider: DatabaseProvider) => {
    setSelectedProvider(provider)
    setViewMode('add')
    setSelectorOpen(false)
    setEditingDataSource(null) // Ensure no editing config for new data source
    setConfigFormOpen(true)
  }

  const handleSaveDataSource = async (config: AnyDatabaseConfig) => {
    try {
      const payload = configToPayload(config)
      let savedDataSource
      
      if (editingDataSource && editingDataSource.id) {
        // Update existing
        console.log('[DataSources Page] Updating datasource:', editingDataSource.id)
        savedDataSource = await updateDatasource(editingDataSource.id, payload)
        
        // Optimistically update local state for immediate UI feedback
        const updatedConfig = payloadToConfig(savedDataSource)
        setDataSources(prev => 
          prev.map(ds => ds.id === editingDataSource.id ? updatedConfig : ds)
        )
      } else {
        // Add new
        console.log('[DataSources Page] Creating new datasource')
        savedDataSource = await createDatasource(payload)
        
        // Optimistically add to local state for immediate UI feedback
        const newConfig = payloadToConfig(savedDataSource)
        setDataSources(prev => [...prev, newConfig])
      }
      
      console.log('[DataSources Page] Save successful, performing background refresh...')
      
      // Close all forms immediately after optimistic update
      setConfigFormOpen(false)
      setSelectorOpen(false)
      setViewMode('list')
      setSelectedProvider(null)
      setEditingDataSource(null)
      
      // Refresh the data sources list in background to ensure consistency
      // Don't await this to keep UI responsive
      refreshDataSources().catch(error => {
        console.error('[DataSources Page] Background refresh failed:', error)
        // If background refresh fails, the optimistic update is still valid
      })
      
      console.log('[DataSources Page] Optimistic update complete')
      
    } catch (error) {
      console.error('[DataSources Page] Error saving datasource:', error)
      throw error // Re-throw to let the form handle the error toast
    }
  }

  const handleFormSuccess = () => {
    // Close all forms and navigate back to data sources list
    setConfigFormOpen(false)
    setSelectorOpen(false)
    setViewMode('list')
    setSelectedProvider(null)
    setEditingDataSource(null)
  }

  const handleEdit = (dataSource: AnyDatabaseConfig) => {
    setEditingDataSource(dataSource)
    // Find the provider for this data source
    const provider: DatabaseProvider = {
      id: dataSource.type,
      name: getProviderName(dataSource.type),
      description: getProviderDescription(dataSource.type),
      icon: getProviderIcon(dataSource.type),
      category: getProviderCategory(dataSource.type)
    }
    setSelectedProvider(provider)
    setViewMode('edit')
    setConfigFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      console.log('[DataSources Page] Deleting datasource:', id);
      
      // Delete from backend
      await deleteDatasource(id)
      
      console.log('[DataSources Page] Datasource deleted, refreshing list...');
      
      // Refresh the entire list to ensure consistency with backend
      await refreshDataSources()
      
      toast({
        title: "Data Source Deleted",
        description: "The data source has been removed successfully",
      })
    } catch (error) {
      console.error('[DataSources Page] Error deleting datasource:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete data source",
        variant: "destructive"
      })
    }
  }

  const handleTestConnection = async (dataSource: AnyDatabaseConfig) => {
    if (!dataSource.id) {
      toast({
        title: "Error",
        description: "Cannot test connection for unsaved data source",
        variant: "destructive"
      })
      return
    }

    try {
      toast({
        title: "Testing Connection",
        description: "Please wait...",
      })
      
      const result = await testDatasourceConnection(dataSource.id)
      
      if (result.success) {
        toast({
          title: "Connection Successful",
          description: `Connected to ${dataSource.name}${result.latency ? ` in ${result.latency}ms` : ''}`,
        })
      } else {
        toast({
          title: "Connection Failed",
          description: result.message,
          variant: "destructive"
        })
      }
      
      // Trigger a status refresh after manual test
      // This will be handled by the status management system
      
    } catch (error) {
      console.error('Error testing connection:', error)
      toast({
        title: "Connection Test Failed",
        description: error instanceof Error ? error.message : "Failed to test connection",
        variant: "destructive"
      })
    }
  }

  const handleViewTables = (dataSource: AnyDatabaseConfig) => {
    // Navigate to database explorer with datasource ID
    if (!dataSource.id) {
      toast({
        title: "Error",
        description: "Cannot view tables for unsaved data source",
        variant: "destructive"
      })
      return
    }

    // Store the datasource ID in localStorage for the explorer page
    localStorage.setItem('selectedDatasourceId', dataSource.id)
    localStorage.setItem('selectedDatasourceName', dataSource.name)
    localStorage.setItem('selectedDatasourceType', dataSource.type)
    
    // Navigate to the database explorer page
    router.push(`/admin/database-explorer?datasource=${dataSource.id}`)
  }

  const handleViewData = (dataSource: AnyDatabaseConfig) => {
    // Navigate to v0 database viewer with datasource ID
    if (!dataSource.id) {
      toast({
        title: "Error",
        description: "Cannot view data for unsaved data source",
        variant: "destructive"
      })
      return
    }

    // Store the datasource ID in localStorage for the viewer page
    localStorage.setItem('selectedDatasourceId', dataSource.id)
    localStorage.setItem('selectedDatasourceName', dataSource.name)
    localStorage.setItem('selectedDatasourceType', dataSource.type)
    
    // Navigate to the v0 database viewer page
    router.push(`/admin/database-viewer?datasource=${dataSource.id}`)
  }

  const handleCancel = () => {
    setViewMode('list')
    setSelectedProvider(null)
    setEditingDataSource(null)
    setConfigFormOpen(false)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <DataSourcesTable
        dataSources={dataSources}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onTestConnection={handleTestConnection}
        onViewTables={handleViewTables}
        onViewData={handleViewData}
        onAddNew={handleAddNew}
        isLoading={isLoading || isRefreshing}
      />

      <DatabaseSourceSelector
        onSelect={handleProviderSelect}
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
      />

      {selectedProvider && (
        <DatabaseConfigForm
          key={`${selectedProvider.id}-${editingDataSource?.id || 'new'}-${viewMode}`}
          provider={selectedProvider}
          initialConfig={editingDataSource || undefined}
          onSave={handleSaveDataSource}
          onCancel={handleCancel}
          isEditing={!!editingDataSource}
          open={configFormOpen}
          onOpenChange={setConfigFormOpen}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  )
}

// Helper functions to get provider info from database type
function getProviderName(type: string): string {
  const names: Record<string, string> = {
    postgresql: 'PostgreSQL',
    mysql: 'MySQL',
    mongodb: 'MongoDB',
    sqlite: 'SQLite',
    oracle: 'Oracle Database',
    sqlserver: 'SQL Server',
    snowflake: 'Snowflake',
    bigquery: 'BigQuery',
    redshift: 'Amazon Redshift',
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

function getProviderDescription(type: string): string {
  const descriptions: Record<string, string> = {
    postgresql: 'Open source object-relational database system',
    mysql: 'Popular open source relational database',
    mongodb: 'Document-oriented NoSQL database',
    sqlite: 'Lightweight file-based database',
    oracle: 'Enterprise-grade relational database',
    sqlserver: 'Microsoft SQL Server database',
    snowflake: 'Cloud-based data warehousing platform',
    bigquery: 'Google Cloud data warehouse',
    redshift: 'Amazon Web Services data warehouse',
    clickhouse: 'Column-oriented database for analytics',
    mariadb: 'MySQL-compatible relational database',
    elasticsearch: 'Search and analytics engine',
    redis: 'In-memory data structure store',
    cassandra: 'Distributed NoSQL database',
    saphana: 'In-memory relational database',
    vertica: 'Columnar analytics platform',
    trino: 'Distributed SQL query engine'
  }
  return descriptions[type] || 'Database management system'
}

function getProviderIcon(type: string): string {
  const icons: Record<string, string> = {
    postgresql: '🐘',
    mysql: '🐬',
    mongodb: '🍃',
    sqlite: '📁',
    oracle: '🔴',
    sqlserver: '🔷',
    snowflake: '❄️',
    bigquery: '📊',
    redshift: '🚀',
    clickhouse: '⚡',
    mariadb: '🗄️',
    elasticsearch: '🔍',
    redis: '💾',
    cassandra: '🔗',
    saphana: '🎯',
    vertica: '📈',
    trino: '⚙️'
  }
  return icons[type] || '🗄️'
}

function getProviderCategory(type: string): 'relational' | 'nosql' | 'warehouse' | 'analytics' | 'cache' {
  const categories: Record<string, 'relational' | 'nosql' | 'warehouse' | 'analytics' | 'cache'> = {
    postgresql: 'relational',
    mysql: 'relational',
    mongodb: 'nosql',
    sqlite: 'relational',
    oracle: 'relational',
    sqlserver: 'relational',
    snowflake: 'warehouse',
    bigquery: 'warehouse',
    redshift: 'warehouse',
    clickhouse: 'analytics',
    mariadb: 'relational',
    elasticsearch: 'nosql',
    redis: 'cache',
    cassandra: 'nosql',
    saphana: 'relational',
    vertica: 'analytics',
    trino: 'analytics'
  }
  return categories[type] || 'relational'
}