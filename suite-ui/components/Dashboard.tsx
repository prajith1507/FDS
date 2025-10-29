'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  Database, 
  Send, 
  RefreshCw,
  CheckCircle,
  Monitor,
  Globe,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { fetchPostmanAnalytics, type PostmanAnalytics } from '../lib/api/postman-analytics'

interface DashboardProps {
  onToolChange: (tool: string) => void
}

// Real-time analytics data interface
interface RealTimeAnalytics {
  totalDataSources: number
  apiConnected: number
  totalFunctions: number
  lastUpdated: string
}

// API endpoints for real-time analytics from local services
const DB_VIEWER_URL = 'http://localhost:4001'
const POSTMAN_URL = 'http://localhost:4002' 
const TRANSFORMER_URL = 'http://localhost:4003'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://obl-syncapi.fuzionest.com'

// Hook for real-time analytics data
const useRealTimeAnalytics = () => {
  const [analytics, setAnalytics] = useState<RealTimeAnalytics>({
    totalDataSources: 0,
    apiConnected: 0,
    totalFunctions: 0,
    lastUpdated: new Date().toISOString()
  })
  const [postmanAnalytics, setPostmanAnalytics] = useState<PostmanAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    try {
      setError(null)
      
      // Initialize counters with fallback values
      let totalDataSources = 0
      let apiConnected = 0
      let totalFunctions = 0
      
      // Create fetch promises with timeout and error handling
      const fetchWithTimeout = async (url: string, timeout = 5000) => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)
        
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal
          })
          clearTimeout(timeoutId)
          return response
        } catch (error) {
          clearTimeout(timeoutId)
          throw error
        }
      }

      // Fetch data sources count from DB Viewer
      try {
        console.log('[Dashboard] Fetching data sources from:', `${DB_VIEWER_URL}/api/datasources`)
        const dataSourcesResponse = await fetchWithTimeout(`${DB_VIEWER_URL}/api/datasources`)
        
        if (dataSourcesResponse.ok) {
          const dataSourcesData = await dataSourcesResponse.json()
          console.log('[Dashboard] Data sources response:', dataSourcesData)
          totalDataSources = Array.isArray(dataSourcesData) ? dataSourcesData.length : 
                           dataSourcesData.data?.datasources ? dataSourcesData.data.datasources.length : 0
        } else {
          console.error('[Dashboard] Failed to fetch data sources:', dataSourcesResponse.status, dataSourcesResponse.statusText)
        }
      } catch (error) {
        console.error('[Dashboard] Error fetching data sources:', error)
        totalDataSources = 0 // Fallback value
      }

      // Fetch API collections count from Postman with detailed analytics
      try {
        console.log('[Dashboard] Fetching Postman analytics...')
        const postmanData = await fetchPostmanAnalytics()
        console.log('[Dashboard] Postman analytics:', postmanData)
        setPostmanAnalytics(postmanData)
        apiConnected = postmanData.totalRequests // Count total API requests, not folders
      } catch (error) {
        console.error('[Dashboard] Error fetching Postman analytics:', error)
        // Fallback to simple collection count
        try {
          console.log('[Dashboard] Falling back to simple collections fetch from:', `${POSTMAN_URL}/api/collections`)
          const apiResponse = await fetchWithTimeout(`${POSTMAN_URL}/api/collections`)
          
          if (apiResponse.ok) {
            const apiData = await apiResponse.json()
            console.log('[Dashboard] API collections response:', apiData)
            const items = Array.isArray(apiData) ? apiData :
                         Array.isArray(apiData.items) ? apiData.items :
                         Array.isArray(apiData.item) ? apiData.item :
                         Array.isArray(apiData.data) ? apiData.data : []
            apiConnected = items.length
          } else {
            console.error('[Dashboard] Failed to fetch API collections:', apiResponse.status, apiResponse.statusText)
          }
        } catch (fallbackError) {
          console.error('[Dashboard] Fallback fetch also failed:', fallbackError)
          apiConnected = 0
        }
      }

      // Fetch transformation functions count from Transformer
      try {
        console.log('[Dashboard] Fetching functions from:', `${TRANSFORMER_URL}/api/generated-functions`)
        const functionsResponse = await fetchWithTimeout(`${TRANSFORMER_URL}/api/generated-functions`)
        
        if (functionsResponse.ok) {
          const functionsData = await functionsResponse.json()
          console.log('[Dashboard] Functions response:', functionsData)
          console.log('[Dashboard] Functions data type:', typeof functionsData)
          console.log('[Dashboard] Is functions data array?', Array.isArray(functionsData))
          
          if (Array.isArray(functionsData)) {
            totalFunctions = functionsData.length
            console.log('[Dashboard] Functions count from array length:', totalFunctions)
          } else if (functionsData.data?.functions && Array.isArray(functionsData.data.functions)) {
            totalFunctions = functionsData.data.functions.length
            console.log('[Dashboard] Functions count from data.functions.length:', totalFunctions)
          } else if (functionsData.data?.pagination?.totalCount) {
            totalFunctions = functionsData.data.pagination.totalCount
            console.log('[Dashboard] Functions count from pagination.totalCount:', totalFunctions)
          } else if (functionsData.data && Array.isArray(functionsData.data)) {
            totalFunctions = functionsData.data.length
            console.log('[Dashboard] Functions count from data.length:', totalFunctions)
          } else if (typeof functionsData.count === 'number') {
            totalFunctions = functionsData.count
            console.log('[Dashboard] Functions count from count property:', totalFunctions)
          } else {
            console.warn('[Dashboard] Unable to parse functions count from:', functionsData)
            totalFunctions = 0
          }
        } else {
          console.error('[Dashboard] Failed to fetch functions:', functionsResponse.status, functionsResponse.statusText)
        }
      } catch (error) {
        console.error('[Dashboard] Error fetching functions:', error)
        totalFunctions = 0 // Fallback value
      }

      // Update analytics with collected data
      setAnalytics({
        totalDataSources,
        apiConnected,
        totalFunctions,
        lastUpdated: new Date().toISOString()
      })
      
      console.log('[Dashboard] Analytics updated:', { totalDataSources, apiConnected, totalFunctions })
    } catch (err) {
      console.error('Error fetching real-time analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
      
      // Set fallback values even on general error
      setAnalytics({
        totalDataSources: 0,
        apiConnected: 0,
        totalFunctions: 0,
        lastUpdated: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchAnalytics()
    
    // Set up real-time updates every 10 seconds
    const interval = setInterval(fetchAnalytics, 10000)
    
    return () => clearInterval(interval)
  }, [])

  return { analytics, postmanAnalytics, loading, error, refetch: fetchAnalytics }
}

// Move analytics data and hook outside of component scope to prevent hook order issues
const initialAnalyticsData = {
  totalRequests: 12847,
  activeUsers: 23,
  responseTime: 142,
  uptime: 99.9,
  toolUsage: {
    'db-viewer': { count: 4521, percentage: 45 },
    'postman': { count: 3200, percentage: 32 },
    'transformer': { count: 2300, percentage: 23 }
  },
  recentActivity: [
    { tool: 'Database Explorer', action: 'Query executed', time: '2 min ago' },
    { tool: 'API Testing', action: 'Collection updated', time: '5 min ago' },
    { tool: 'Data Transformer', action: 'File processed', time: '12 min ago' },
    { tool: 'Database Explorer', action: 'Schema analyzed', time: '18 min ago' }
  ],
  metrics: {
    requestsToday: 1247,
    requestsYesterday: 1156,
    errorRate: 0.3,
    avgResponseTime: 142
  }
}

// Mock analytics data - in real implementation, this would come from API
const useAnalytics = () => {
  const [data, setData] = useState(initialAnalyticsData)

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setData(prev => ({
        ...prev,
        totalRequests: prev.totalRequests + Math.floor(Math.random() * 5),
        activeUsers: Math.max(1, prev.activeUsers + Math.floor(Math.random() * 3) - 1),
        responseTime: 120 + Math.floor(Math.random() * 50),
      }))
    }, 5000)

    return () => {
      clearInterval(interval)
    }
  }, []) // Empty dependency array to run only once on mount

  return data
}

const MetricCard = React.memo(({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  color = "blue" 
}: {
  title: string
  value: string | number
  change?: string
  changeType?: 'up' | 'down'
  icon: any
  color?: 'blue' | 'green' | 'purple' | 'orange'
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-blue-50 text-blue-600 border-blue-200',
    purple: 'bg-blue-50 text-blue-600 border-blue-200',
    orange: 'bg-blue-50 text-blue-600 border-blue-200'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-sm ${
            changeType === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {changeType === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {change}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
})

const ToolUsageChart = React.memo(({ data }: { data: any }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-6">Tool Usage Distribution</h3>
    <div className="space-y-4">
      {Object.entries(data.toolUsage).map(([tool, usage]: [string, any]) => {
        const toolNames: { [key: string]: string } = {
          'db-viewer': 'Database Explorer',
          'postman': 'API Testing',
          'transformer': 'Data Transformer'
        }
        
        return (
          <div key={tool} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">{toolNames[tool]}</span>
              <span className="text-gray-500">{usage.count} requests</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-600 to-blue-700 h-2 rounded-full transition-all duration-500"
                style={{ width: `${usage.percentage}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  </div>
))

const QuickActionsGrid = React.memo(({ onToolChange }: { onToolChange: (tool: string) => void }) => {
  const quickActions = [
    {
      id: 'db-viewer',
      title: 'Database Explorer',
      description: 'Query and manage databases',
      icon: Database,
      color: 'bg-blue-600 hover:bg-blue-700',
      stats: '4.5k queries today'
    },
    {
      id: 'postman',
      title: 'API Testing',
      description: 'Test and document APIs',
      icon: Send,
      color: 'bg-blue-600 hover:bg-blue-700',
      stats: '3.2k requests today'
    },
    {
      id: 'transformer',
      title: 'Data Transformer',
      description: 'Process and transform data',
      icon: RefreshCw,
      color: 'bg-blue-600 hover:bg-blue-700',
      stats: '2.3k transformations'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {quickActions.map((action) => (
        <button
          key={action.id}
          onClick={() => onToolChange(action.id)}
          className="bg-white rounded-xl border border-gray-200 p-6 text-left hover:shadow-lg transition-all duration-200 group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 rounded-lg ${action.color} text-white transition-colors`}>
              <action.icon size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {action.title}
              </h3>
              <p className="text-sm text-gray-600">{action.description}</p>
            </div>
          </div>
          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
            {action.stats}
          </div>
        </button>
      ))}
    </div>
  )
})

const RecentActivity = React.memo(({ activities }: { activities: any[] }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={index} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{activity.tool}</p>
            <p className="text-xs text-gray-600">{activity.action}</p>
          </div>
          <span className="text-xs text-gray-500">{activity.time}</span>
        </div>
      ))}
    </div>
  </div>
))

const Dashboard = React.memo(function Dashboard({ onToolChange }: DashboardProps) {
  const { analytics: realTimeAnalytics, postmanAnalytics, loading: realTimeLoading, error: realTimeError, refetch } = useRealTimeAnalytics()
  const [isClient, setIsClient] = useState(false)
  
  // Prevent hydration mismatch by only rendering time on client
  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <div className="h-full bg-gray-50 overflow-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-slate-900 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Fuzionest Development Suite
              </h1>
              <p className="text-gray-300 text-lg">
                Analytics Dashboard & Control Center
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Analytics Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Real-time Analytics</h2>
            <div className="flex items-center gap-4">
              {realTimeLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  Updating...
                </div>
              )}
              <button
                onClick={refetch}
                disabled={realTimeLoading}
                className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 inline mr-2 ${realTimeLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <div className="text-xs text-gray-500">
                Last updated: {isClient ? new Date(realTimeAnalytics.lastUpdated).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true
                }) : '--'}
              </div>
            </div>
          </div>
          
          {realTimeError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Failed to load real-time data</span>
              </div>
              <p className="text-sm mt-1">{realTimeError}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Data Sources */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500 rounded-lg text-white">
                    <Database size={24} />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-700">
                      {realTimeLoading ? '--' : realTimeAnalytics.totalDataSources}
                    </div>
                    <div className="text-blue-600 text-sm font-medium">Total Data Sources</div>
                  </div>
                </div>
                <div className="text-sm text-blue-600">
                  Connected databases and data sources
                </div>
              </div>

              {/* API Connected with total count only */}
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-500 rounded-lg text-white">
                    <Send size={24} />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-700">
                      {realTimeLoading ? '--' : realTimeAnalytics.apiConnected}
                    </div>
                    <div className="text-green-600 text-sm font-medium">Total APIs</div>
                  </div>
                </div>
                <div className="text-sm text-green-600">
                  Active API collections
                </div>
              </div>

              {/* Total Functions */}
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-500 rounded-lg text-white">
                    <RefreshCw size={24} />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-purple-700">
                      {realTimeLoading ? '--' : realTimeAnalytics.totalFunctions}
                    </div>
                    <div className="text-purple-600 text-sm font-medium">Total Functions</div>
                  </div>
                </div>
                <div className="text-sm text-purple-600">
                  Transformation functions and workflows
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Access Tools</h2>
          <QuickActionsGrid onToolChange={onToolChange} />
        </div>

        {/* System Overview */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">System Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <CheckCircle className="mx-auto text-blue-600 mb-2" size={32} />
              <div className="text-lg font-semibold text-blue-700">All Systems Operational</div>
              <div className="text-sm text-blue-600">No issues detected</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Monitor className="mx-auto text-blue-600 mb-2" size={32} />
              <div className="text-lg font-semibold text-blue-700">3 Tools Active</div>
              <div className="text-sm text-blue-600">All services running</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Globe className="mx-auto text-blue-600 mb-2" size={32} />
              <div className="text-lg font-semibold text-blue-700">Local Network</div>
              <div className="text-sm text-blue-600">Development mode</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
})

export default Dashboard