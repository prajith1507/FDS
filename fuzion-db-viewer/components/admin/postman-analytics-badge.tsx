"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { usePostmanAnalytics } from "@/hooks/use-postman-analytics"
import { Folder, FileText, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PostmanAnalyticsBadgeProps {
  autoRefresh?: boolean
  refreshInterval?: number
  showDetails?: boolean
}

/**
 * Display Postman API analytics as a compact badge or detailed card
 */
export function PostmanAnalyticsBadge({ 
  autoRefresh = true, 
  refreshInterval = 30000,
  showDetails = false 
}: PostmanAnalyticsBadgeProps) {
  const {
    totalRequests,
    totalFolders,
    requestsInFolders,
    requestsOutsideFolders,
    totalCollections,
    isLoading,
    refresh
  } = usePostmanAnalytics({ autoRefresh, refreshInterval })

  if (showDetails) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Postman API Analytics</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={refresh}
            disabled={isLoading}
            className="h-8 w-8"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Requests</span>
            <Badge variant="secondary" className="font-semibold">
              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : totalRequests}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Folder className="h-3 w-3" />
              In Folders
            </span>
            <Badge variant="outline">
              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : requestsInFolders}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Outside Folders
            </span>
            <Badge variant="outline">
              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : requestsOutsideFolders}
            </Badge>
          </div>
          
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total Folders</span>
              <span className="text-xs font-medium">{totalFolders}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">Collections</span>
              <span className="text-xs font-medium">{totalCollections}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Compact badge view
  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="gap-1">
        <FileText className="h-3 w-3" />
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <span className="font-semibold">{totalRequests}</span>
        )}
        <span className="text-xs text-muted-foreground">APIs</span>
      </Badge>
      
      <Badge variant="outline" className="gap-1">
        <Folder className="h-3 w-3" />
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <span>{requestsInFolders}/{requestsOutsideFolders}</span>
        )}
      </Badge>
    </div>
  )
}
