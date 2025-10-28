"use client"

import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { DataSourceStatus, DataSourceStatusState } from "@/hooks/use-datasources-status"

interface SimpleStatusBadgeProps {
  statusState: DataSourceStatusState
  onRefresh?: () => void
}

export function SimpleStatusBadge({ statusState, onRefresh }: SimpleStatusBadgeProps) {
  const { status, isChecking, lastChecked } = statusState

  const getStatusConfig = () => {
    if (isChecking) {
      return {
        variant: 'secondary' as const,
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
        text: 'Testing',
        className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200'
      }
    }

    switch (status) {
      case 'connected':
        return {
          variant: 'default' as const,
          icon: <CheckCircle className="h-3 w-3" />,
          text: 'Connected',
          className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200'
        }
      case 'disconnected':
        return {
          variant: 'destructive' as const,
          icon: <XCircle className="h-3 w-3" />,
          text: 'Disconnected',
          className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200'
        }
      case 'error':
        return {
          variant: 'destructive' as const,
          icon: <AlertCircle className="h-3 w-3" />,
          text: 'Error',
          className: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200'
        }
      default:
        return {
          variant: 'secondary' as const,
          icon: <AlertCircle className="h-3 w-3" />,
          text: 'Unknown',
          className: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200'
        }
    }
  }

  const config = getStatusConfig()
  const timeString = lastChecked ? lastChecked.toLocaleTimeString() : 'Never'

  return (
    <Badge 
      variant={config.variant}
      className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 cursor-pointer hover:opacity-80 transition-opacity ${config.className}`}
      onClick={(e) => {
        e.stopPropagation()
        if (onRefresh) {
          onRefresh()
        }
      }}
      title={`Click to refresh status. Last checked: ${timeString}`}
    >
      {config.icon}
      {config.text}
    </Badge>
  )
}