"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { AnyDatabaseConfig } from "@/lib/types/datasource"
import { testDatasourceConnection } from "@/lib/api/datasources"

export type DataSourceStatus = 'connected' | 'disconnected' | 'testing' | 'error' | 'unknown'

interface DataSourceStatusBadgeProps {
  dataSource: AnyDatabaseConfig
  autoRefresh?: boolean
  refreshInterval?: number // in milliseconds
}

export function DataSourceStatusBadge({ 
  dataSource, 
  autoRefresh = true, 
  refreshInterval = 30000 // 30 seconds
}: DataSourceStatusBadgeProps) {
  const [status, setStatus] = useState<DataSourceStatus>('unknown')
  const [isChecking, setIsChecking] = useState(false)

  const checkStatus = async () => {
    if (!dataSource.id) {
      setStatus('unknown')
      return
    }

    setIsChecking(true)
    try {
      const result = await testDatasourceConnection(dataSource.id)
      setStatus(result.success ? 'connected' : 'disconnected')
    } catch (error) {
      console.error(`[StatusBadge] Error checking status for ${dataSource.name}:`, error)
      setStatus('error')
    } finally {
      setIsChecking(false)
    }
  }

  // Initial status check
  useEffect(() => {
    checkStatus()
  }, [dataSource.id])

  // Auto-refresh status
  useEffect(() => {
    if (!autoRefresh || !dataSource.id) return

    const interval = setInterval(checkStatus, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, dataSource.id])

  const getStatusConfig = () => {
    if (isChecking) {
      return {
        variant: 'secondary' as const,
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
        text: 'Testing',
        className: 'bg-blue-100 text-blue-800 border-blue-200'
      }
    }

    switch (status) {
      case 'connected':
        return {
          variant: 'default' as const,
          icon: <CheckCircle className="h-3 w-3" />,
          text: 'Connected',
          className: 'bg-green-100 text-green-800 border-green-200'
        }
      case 'disconnected':
        return {
          variant: 'destructive' as const,
          icon: <XCircle className="h-3 w-3" />,
          text: 'Disconnected',
          className: 'bg-red-100 text-red-800 border-red-200'
        }
      case 'error':
        return {
          variant: 'destructive' as const,
          icon: <AlertCircle className="h-3 w-3" />,
          text: 'Error',
          className: 'bg-orange-100 text-orange-800 border-orange-200'
        }
      default:
        return {
          variant: 'secondary' as const,
          icon: <AlertCircle className="h-3 w-3" />,
          text: 'Unknown',
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }
  }

  const config = getStatusConfig()

  return (
    <Badge 
      variant={config.variant}
      className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 cursor-pointer hover:opacity-80 transition-opacity ${config.className}`}
      onClick={(e) => {
        e.stopPropagation()
        checkStatus()
      }}
      title={`Click to refresh status. Last checked: ${new Date().toLocaleTimeString()}`}
    >
      {config.icon}
      {config.text}
    </Badge>
  )
}