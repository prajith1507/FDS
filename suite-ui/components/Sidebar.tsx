'use client'

import { useState, useMemo, useCallback } from 'react'
import { 
  LayoutDashboard, 
  Database, 
  Send, 
  RefreshCw,
  Menu,
  X,
  Settings,
  HelpCircle,
  User,
  Bell,
  Search,
  ChevronDown,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react'
import clsx from 'clsx'

export type Tool = 'dashboard' | 'db-viewer' | 'postman' | 'transformer'

interface SidebarProps {
  activeTool: Tool
  onToolChange: (tool: Tool) => void
}

// Memoize static data to prevent recreation on each render
const menuItems = [
  {
    id: 'dashboard' as Tool,
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'System overview and analytics',
    category: 'main'
  },
  {
    id: 'db-viewer' as Tool,
    label: 'Database Explorer',
    icon: Database,
    description: 'Database management and queries',
    category: 'tools'
  },
  {
    id: 'postman' as Tool,
    label: 'API Testing',
    icon: Send,
    description: 'REST API testing suite',
    category: 'tools'
  },
  {
    id: 'transformer' as Tool,
    label: 'Data Transformer',
    icon: RefreshCw,
    description: 'Data processing engine',
    category: 'tools'
  }
] as const

const serviceStatus = {
  'db-viewer': 'running',
  'postman': 'running', 
  'transformer': 'running'
} as const

export default function Sidebar({ activeTool, onToolChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  // Memoize filtered items to prevent re-computation
  const mainItems = useMemo(() => menuItems.filter(item => item.category === 'main'), [])
  const toolItems = useMemo(() => menuItems.filter(item => item.category === 'tools'), [])

  // Optimize toggle handlers
  const toggleCollapse = useCallback(() => setIsCollapsed(prev => !prev), [])
  const toggleUserMenu = useCallback(() => setShowUserMenu(prev => !prev), [])

  return (
    <div className={clsx(
      'bg-white h-screen flex flex-col transition-all duration-300 border-r border-gray-200',
      isCollapsed ? 'w-16' : 'w-64'
    )}>
      {/* Header */}
      <div className="px-5 py-6">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex flex-col gap-0.5">
              <h1 className="text-xl font-bold text-black">Fuzionest Suite</h1>
              <p className="text-black text-xs font-medium">Development Tools</p>
            </div>
          )}
          <button
            onClick={toggleCollapse}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 text-black hover:text-black"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={isCollapsed ? { margin: '0 auto' } : { marginLeft: 'auto' }}
          >
            {isCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {/* Main Navigation */}
        <div className="mb-6">
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-black uppercase tracking-wider mb-2 px-2">
              Main
            </h3>
          )}
          <ul className="space-y-1">
            {mainItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTool === item.id
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onToolChange(item.id)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                      isActive 
                        ? 'bg-gray-200 text-gray-900 shadow-sm' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                      isCollapsed && 'justify-center'
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    {!isCollapsed && (
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-sm">{item.label}</div>
                      </div>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Tools */}
        <div className="mb-6">
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-black uppercase tracking-wider mb-2 px-2">
              Tools
            </h3>
          )}
          <ul className="space-y-1">
            {toolItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTool === item.id
              const status = serviceStatus[item.id as keyof typeof serviceStatus]
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onToolChange(item.id)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                      isActive 
                        ? 'bg-gray-200 text-gray-900 shadow-sm' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                      isCollapsed && 'justify-center'
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className="relative">
                      <Icon size={20} className="flex-shrink-0" />
                    </div>
                    {!isCollapsed && (
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-sm">{item.label}</div>
                      </div>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="px-4 py-4 mt-auto bg-gray-50">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <span className="text-xs text-black font-medium">All services running</span>
          </div>
          <div className="text-xs text-black font-medium">
            Version 1.0.0
          </div>
        </div>
      )}
    </div>
  )
}