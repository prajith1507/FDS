import { useState, useEffect, useCallback } from 'react'
import { 
  fetchPostmanAnalytics, 
  watchPostmanRequests,
  PostmanAnalytics 
} from '@/lib/api/postman-analytics'

interface UsePostmanAnalyticsOptions {
  autoRefresh?: boolean
  refreshInterval?: number // in milliseconds
}

interface UsePostmanAnalyticsReturn {
  analytics: PostmanAnalytics | null
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
  totalRequests: number
  totalFolders: number
  requestsInFolders: number
  requestsOutsideFolders: number
  totalCollections: number
}

/**
 * Hook to fetch and monitor Postman analytics in real-time
 * 
 * @param options Configuration options
 * @returns Analytics data and control functions
 * 
 * @example
 * ```tsx
 * const { 
 *   analytics, 
 *   totalRequests, 
 *   requestsInFolders,
 *   requestsOutsideFolders,
 *   isLoading 
 * } = usePostmanAnalytics({ autoRefresh: true, refreshInterval: 30000 })
 * ```
 */
export function usePostmanAnalytics(
  options: UsePostmanAnalyticsOptions = {}
): UsePostmanAnalyticsReturn {
  const { autoRefresh = false, refreshInterval = 30000 } = options
  
  const [analytics, setAnalytics] = useState<PostmanAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log('[usePostmanAnalytics] Fetching analytics...')
      
      const data = await fetchPostmanAnalytics()
      setAnalytics(data)
      
      console.log('[usePostmanAnalytics] Analytics updated:', {
        totalRequests: data.totalRequests,
        totalFolders: data.totalFolders,
        requestsInFolders: data.requestsInFolders,
        requestsOutsideFolders: data.requestsOutsideFolders,
      })
    } catch (err) {
      console.error('[usePostmanAnalytics] Error:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  // Initial fetch
  useEffect(() => {
    refresh()
  }, [refresh])
  
  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return
    
    console.log('[usePostmanAnalytics] Setting up auto-refresh, interval:', refreshInterval)
    
    const cleanup = watchPostmanRequests((newAnalytics) => {
      console.log('[usePostmanAnalytics] New requests detected via watcher')
      setAnalytics(newAnalytics)
    }, refreshInterval)
    
    return cleanup
  }, [autoRefresh, refreshInterval])
  
  return {
    analytics,
    isLoading,
    error,
    refresh,
    totalRequests: analytics?.totalRequests || 0,
    totalFolders: analytics?.totalFolders || 0,
    requestsInFolders: analytics?.requestsInFolders || 0,
    requestsOutsideFolders: analytics?.requestsOutsideFolders || 0,
    totalCollections: analytics?.totalCollections || 0,
  }
}
