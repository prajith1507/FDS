'use client'

import { Tool } from './Sidebar'
import { Database, Send, RefreshCw, Activity, Server, CheckCircle } from 'lucide-react'

interface ToolContainerProps {
  activeTool: Tool
}

const toolUrls = {
  'dashboard': null, // Dashboard is handled locally
  'db-viewer': process.env.NEXT_PUBLIC_DB_VIEWER_URL || 'http://localhost:4001',
  'postman': process.env.NEXT_PUBLIC_POSTMAN_URL || 'http://localhost:4002',
  'transformer': process.env.NEXT_PUBLIC_TRANSFORMER_URL || 'http://localhost:4003'
}

const toolConfig = {
  'db-viewer': {
    name: 'Database Explorer',
    icon: Database,
    port: process.env.DB_VIEWER_PORT || '4001',
    description: 'SQL and NoSQL database management with real-time queries',
    features: ['Multi-database support', 'Query builder', 'Schema visualization', 'Data export']
  },
  'postman': {
    name: 'API Testing Suite',
    icon: Send,
    port: process.env.POSTMAN_PORT || '4002',
    description: 'Comprehensive REST API testing and management platform',
    features: ['Request builder', 'Collection management', 'Environment variables', 'Response validation']
  },
  'transformer': {
    name: 'Data Transformer',
    icon: RefreshCw,
    port: process.env.TRANSFORMER_PORT || '4003',
    description: 'Advanced data processing and transformation engine',
    features: ['Data mapping', 'Batch processing', 'Format conversion', 'Workflow automation']
  }
}

export default function ToolContainer({ activeTool }: ToolContainerProps) {
  const url = toolUrls[activeTool]

  if (activeTool === 'dashboard') {
    return (
      <div className="h-full bg-gray-50 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Development Suite Dashboard
            </h1>
            <p className="text-gray-600">
              Monitor and manage your development tools from a unified interface
            </p>
          </div>

          {/* System Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatusCard
              title="System Status"
              value="Operational"
              icon={<CheckCircle className="text-green-600" size={24} />}
              status="success"
            />
            <StatusCard
              title="Active Tools"
              value="3 / 3"
              icon={<Activity className="text-blue-600" size={24} />}
              status="info"
            />
            <StatusCard
              title="Total Services"
              value="Running"
              icon={<Server className="text-purple-600" size={24} />}
              status="info"
            />
          </div>

          {/* Tools Grid */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(toolConfig).map(([key, config]) => (
                <ToolCard key={key} {...config} />
              ))}
            </div>
          </div>

          {/* Usage Information */}
          <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Quick Start Guide
            </h3>
            <div className="space-y-2 text-gray-600">
              <p className="flex items-start gap-2">
                <span className="text-blue-600 font-medium">1.</span>
                Select a tool from the sidebar to access its interface
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-600 font-medium">2.</span>
                All tools run on dedicated ports for isolation and performance
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-600 font-medium">3.</span>
                Use the dashboard to monitor system status and tool availability
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!url) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Server className="text-red-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Service Unavailable
          </h2>
          <p className="text-gray-600">
            The {activeTool} service is not configured. Please check your configuration.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-white">
      <iframe
        src={url}
        className="w-full h-full border-0"
        title={`${activeTool} Tool`}
        sandbox="allow-same-origin allow-scripts allow-forms allow-downloads allow-modals allow-popups"
      />
    </div>
  )
}

interface ToolCardProps {
  name: string
  description: string
  port: string
  icon: any
  features: string[]
}

function ToolCard({ name, description, port, icon: Icon, features }: ToolCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 hover:border-blue-300 transition-all hover:shadow-md">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
          <Icon className="text-blue-600" size={24} />
        </div>
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
          Port {port}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{name}</h3>
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      <div className="space-y-1.5">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
            {feature}
          </div>
        ))}
      </div>
    </div>
  )
}

interface StatusCardProps {
  title: string
  value: string
  icon: React.ReactNode
  status: 'success' | 'info' | 'warning'
}

function StatusCard({ title, value, icon, status }: StatusCardProps) {
  const statusColors = {
    success: 'border-green-200 bg-green-50',
    info: 'border-blue-200 bg-blue-50',
    warning: 'border-yellow-200 bg-yellow-50'
  }

  return (
    <div className={`p-6 rounded-lg border ${statusColors[status]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">{title}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  )
}