'use client'

import { useState } from 'react'
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
  Search,
  ChevronDown,
  Bell
} from 'lucide-react'
import clsx from 'clsx'

export type Tool = 'dashboard' | 'db-viewer' | 'postman' | 'transformer'

interface SidebarProps {
  activeTool: Tool
  onToolChange: (tool: Tool) => void
}

const menuItems = [
  {
    id: 'dashboard' as Tool,
    label: 'Home',
    icon: LayoutDashboard,
    description: 'Overview and quick access',
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
    description: 'REST API testing and documentation',
    category: 'tools'
  },
  {
    id: 'transformer' as Tool,
    label: 'Data Transformer',
    icon: RefreshCw,
    description: 'Data processing and transformation',
    category: 'tools'
  }
]

const serviceStatus = {
  'db-viewer': 'running',
  'postman': 'running', 
  'transformer': 'running'
}

export default function Sidebar({ activeTool, onToolChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const mainItems = menuItems.filter(item => item.category === 'main')
  const toolItems = menuItems.filter(item => item.category === 'tools')

  return (
    <div className={clsx(
      'bg-white border-r-2 border-gray-200 h-screen flex flex-col transition-all duration-300 shadow-lg',
      isCollapsed ? 'w-16' : 'w-72'
    )}>
      {/* Header */}
      <div className="p-4 border-b-2 border-gray-200 bg-black">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-sm">F</span>
              </div>
              <div className="text-white">
                <h1 className="text-lg font-semibold">Fuzionest</h1>
                <p className="text-gray-300 text-xs">Development Suite</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>
      </div>

      {/* Search */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search tools..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {/* Main Navigation */}
        <div className="mb-6">
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Navigation
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
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 font-medium text-sm',
                      isActive 
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    {!isCollapsed && (
                      <div className="flex-1 text-left">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
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
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Development Tools
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
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 font-medium text-sm',
                      isActive 
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    {!isCollapsed && (
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.label}</span>
                          <div className={clsx(
                            'w-2 h-2 rounded-full',
                            status === 'running' ? 'bg-green-500' : 'bg-red-500'
                          )} />
                        </div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </div>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-sm text-gray-900">Developer</div>
                <div className="text-xs text-gray-500">fuzionest@local</div>
              </div>
              <ChevronDown size={16} className="text-gray-400" />
            </button>
          </div>
        ) : (
          <button
            className="w-full p-3 rounded-lg hover:bg-gray-50 transition-colors flex justify-center"
            title="User Profile"
          >
            <User size={18} className="text-gray-600" />
          </button>
        )}
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Version 1.0.0</span>
            <div className="flex items-center gap-2">
              <button className="p-1 hover:text-gray-700" title="Settings">
                <Settings size={14} />
              </button>
              <button className="p-1 hover:text-gray-700" title="Help">
                <HelpCircle size={14} />
              </button>
              <button className="p-1 hover:text-gray-700" title="Notifications">
                <Bell size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}