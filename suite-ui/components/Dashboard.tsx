'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  Database, 
  Send, 
  RefreshCw, 
  Activity, 
  Server, 
  CheckCircle, 
  Clock,
  Users,
  TrendingUp,
  Zap,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Monitor,
  Globe,
  Timer,
  Target
} from 'lucide-react'

interface DashboardProps {
  onToolChange: (tool: string) => void
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
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200'
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
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
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
      color: 'bg-blue-500 hover:bg-blue-600',
      stats: '4.5k queries today'
    },
    {
      id: 'postman',
      title: 'API Testing',
      description: 'Test and document APIs',
      icon: Send,
      color: 'bg-green-500 hover:bg-green-600',
      stats: '3.2k requests today'
    },
    {
      id: 'transformer',
      title: 'Data Transformer',
      description: 'Process and transform data',
      icon: RefreshCw,
      color: 'bg-purple-500 hover:bg-purple-600',
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
  const analytics = useAnalytics()
  
  // Memoize calculations to prevent unnecessary re-renders
  const metrics = useMemo(() => [
    {
      title: "Total Requests",
      value: analytics.totalRequests.toLocaleString(),
      change: "+12%",
      changeType: "up" as const,
      icon: BarChart3,
      color: "blue" as const
    },
    {
      title: "Active Users",
      value: analytics.activeUsers,
      change: "+5%", 
      changeType: "up" as const,
      icon: Users,
      color: "green" as const
    },
    {
      title: "Avg Response",
      value: `${analytics.responseTime}ms`,
      change: "-8%",
      changeType: "down" as const,
      icon: Timer,
      color: "purple" as const
    },
    {
      title: "System Uptime",
      value: `${analytics.uptime}%`,
      change: "+0.1%",
      changeType: "up" as const,
      icon: Target,
      color: "orange" as const
    }
  ], [analytics])

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
            <div className="text-right">
              <div className="text-3xl font-bold">{analytics.activeUsers}</div>
              <div className="text-gray-400 text-sm">Active Sessions</div>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
        </div>

        {/* Charts and Activity Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ToolUsageChart data={analytics} />
          <RecentActivity activities={analytics.recentActivity} />
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
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="mx-auto text-green-600 mb-2" size={32} />
              <div className="text-lg font-semibold text-green-700">All Systems Operational</div>
              <div className="text-sm text-green-600">No issues detected</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Monitor className="mx-auto text-blue-600 mb-2" size={32} />
              <div className="text-lg font-semibold text-blue-700">3 Tools Active</div>
              <div className="text-sm text-blue-600">All services running</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Globe className="mx-auto text-purple-600 mb-2" size={32} />
              <div className="text-lg font-semibold text-purple-700">Local Network</div>
              <div className="text-sm text-purple-600">Development mode</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
})

export default Dashboard