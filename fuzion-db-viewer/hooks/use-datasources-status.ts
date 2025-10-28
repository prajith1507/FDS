"use client"

import { useState, useEffect, useCallback } from "react"
import { AnyDatabaseConfig } from "@/lib/types/datasource"
import { testDatasourceConnection } from "@/lib/api/datasources"

export type DataSourceStatus = 'connected' | 'disconnected' | 'testing' | 'error' | 'unknown'

export interface DataSourceStatusState {
  status: DataSourceStatus
  lastChecked: Date | null
  isChecking: boolean
}

export function useDataSourcesStatus(
  dataSources: AnyDatabaseConfig[],
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
) {
  const [statusMap, setStatusMap] = useState<Record<string, DataSourceStatusState>>({})

  const updateStatus = useCallback((id: string, updates: Partial<DataSourceStatusState>) => {
    setStatusMap(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...updates,
        lastChecked: updates.status ? new Date() : prev[id]?.lastChecked || null
      }
    }))
  }, [])

  const checkSingleStatus = useCallback(async (dataSource: AnyDatabaseConfig) => {
    if (!dataSource.id) return

    updateStatus(dataSource.id, { isChecking: true })

    try {
      const result = await testDatasourceConnection(dataSource.id)
      updateStatus(dataSource.id, {
        status: result.success ? 'connected' : 'disconnected',
        isChecking: false
      })
    } catch (error) {
      console.error(`[DataSourcesStatus] Error checking status for ${dataSource.name}:`, error)
      updateStatus(dataSource.id, {
        status: 'error',
        isChecking: false
      })
    }
  }, [updateStatus])

  const checkAllStatuses = useCallback(async () => {
    const validDataSources = dataSources.filter(ds => ds.id)
    
    // Check statuses in batches to avoid overwhelming the server
    const batchSize = 3
    for (let i = 0; i < validDataSources.length; i += batchSize) {
      const batch = validDataSources.slice(i, i + batchSize)
      await Promise.all(batch.map(checkSingleStatus))
      
      // Small delay between batches
      if (i + batchSize < validDataSources.length) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
  }, [dataSources, checkSingleStatus])

  const refreshStatus = useCallback((id: string) => {
    const dataSource = dataSources.find(ds => ds.id === id)
    if (dataSource) {
      checkSingleStatus(dataSource)
    }
  }, [dataSources, checkSingleStatus])

  // Initialize status for new data sources
  useEffect(() => {
    dataSources.forEach(ds => {
      if (ds.id && !statusMap[ds.id]) {
        setStatusMap(prev => ({
          ...prev,
          [ds.id!]: {
            status: 'unknown',
            lastChecked: null,
            isChecking: false
          }
        }))
      }
    })
  }, [dataSources, statusMap])

  // Initial check
  useEffect(() => {
    if (dataSources.length > 0) {
      checkAllStatuses()
    }
  }, [dataSources.length])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || dataSources.length === 0) return

    const interval = setInterval(checkAllStatuses, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, checkAllStatuses, dataSources.length])

  const getStatus = useCallback((id: string): DataSourceStatusState => {
    return statusMap[id] || {
      status: 'unknown',
      lastChecked: null,
      isChecking: false
    }
  }, [statusMap])

  return {
    getStatus,
    refreshStatus,
    checkAllStatuses
  }
}