'use client'

import React, { useMemo, useCallback } from 'react'
import { Tool } from './Sidebar'
import { Database, Send, RefreshCw, Activity, Server, CheckCircle } from 'lucide-react'
import Dashboard from './Dashboard'

interface ToolContainerProps {
  activeTool: Tool
  onToolChange?: (tool: Tool) => void
}

const toolUrls = {
  'dashboard': null, // Dashboard is handled locally
  'db-viewer': process.env.NEXT_PUBLIC_DB_VIEWER_URL || 'http://145.223.23.191:4001',
  'postman': process.env.NEXT_PUBLIC_POSTMAN_URL || 'http://145.223.23.191:4002',
  'transformer': process.env.NEXT_PUBLIC_TRANSFORMER_URL || 'http://145.223.23.191:4003'
} as const

// Memoize tool configuration to prevent unnecessary re-renders
const toolConfig: Record<Exclude<Tool, 'dashboard'>, {
  name: string;
  icon: any;
  port: string;
  description: string;
  features: string[];
}> = {
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

export default function ToolContainer({ activeTool, onToolChange }: ToolContainerProps) {
  // ALL HOOKS MUST BE CALLED AT THE TOP - BEFORE ANY CONDITIONAL RETURNS
  
  // Memoize URL to prevent unnecessary re-calculations
  const url = useMemo(() => toolUrls[activeTool], [activeTool])
  
  // Memoize tool configuration to prevent unnecessary re-renders
  const currentToolConfig = useMemo(() => 
    activeTool !== 'dashboard' ? toolConfig[activeTool] : null, 
    [activeTool]
  )

  // Handle tool changes with useCallback to prevent re-renders
  const handleToolChange = useCallback((tool: string) => {
    if (onToolChange) {
      onToolChange(tool as Tool)
    }
  }, [onToolChange])

  // Optimized iframe component with error boundaries - MOVED TO TOP
  const IframeComponent = useMemo(() => (
    <div className="h-full bg-white relative">
      {/* Loading indicator */}
      <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-10" id={`loading-indicator-${activeTool}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading {currentToolConfig?.name}...</p>
        </div>
      </div>
      
      {/* Direct embedded iframe */}
      <iframe
        src={url || ''}
        className="w-full h-full border-0"
        title={`${activeTool} Tool`}
        sandbox="allow-same-origin allow-scripts allow-forms allow-downloads allow-modals allow-popups allow-top-navigation allow-pointer-lock"
        allow="clipboard-read; clipboard-write; microphone; camera; geolocation"
        referrerPolicy="no-referrer-when-downgrade"
        loading="eager"
        onLoad={(e) => {
          // Hide loading indicator when iframe loads
          const loadingIndicator = document.getElementById(`loading-indicator-${activeTool}`)
          if (loadingIndicator) {
            loadingIndicator.style.display = 'none'
          }
          console.log(`${activeTool} tool loaded successfully`)
        }}
        onError={(e) => {
          console.error(`Failed to load ${activeTool} tool:`, e)
          // Show error message if iframe fails to load
          const loadingIndicator = document.getElementById(`loading-indicator-${activeTool}`)
          if (loadingIndicator) {
            loadingIndicator.innerHTML = `
              <div class="text-center">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <p class="text-gray-800 font-medium mb-2">Failed to load ${currentToolConfig?.name}</p>
                <p class="text-gray-600 text-sm mb-4">The tool may have iframe restrictions</p>
                <a href="${url}" target="_blank" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Open in New Tab
                </a>
              </div>
            `
          }
        }}
        style={{
          border: 'none',
          outline: 'none'
        }}
      />
    </div>
  ), [url, activeTool, currentToolConfig])

  // NOW CONDITIONAL RENDERING AFTER ALL HOOKS
  
  // Optimized dashboard component
  if (activeTool === 'dashboard') {
    return <Dashboard key="dashboard" onToolChange={handleToolChange} />
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

  return IframeComponent
}