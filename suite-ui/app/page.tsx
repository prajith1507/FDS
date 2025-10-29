'use client'

import { useState, useCallback, useEffect } from 'react'
import Sidebar, { Tool } from '../components/Sidebar'
import ToolContainer from '../components/ToolContainer'
import LoginPage from '../components/LoginPage'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const { isAuthenticated } = useAuth()
  const [activeTool, setActiveTool] = useState<Tool>('dashboard')

  // Load active tool from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTool = localStorage.getItem('activeTool')
      if (savedTool && ['dashboard', 'db-viewer', 'postman', 'transformer'].includes(savedTool)) {
        setActiveTool(savedTool as Tool)
      }
    }
  }, [])

  // Optimize tool change handler and persist to localStorage
  const handleToolChange = useCallback((tool: Tool) => {
    setActiveTool(tool)
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeTool', tool)
    }
  }, [])

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        activeTool={activeTool} 
        onToolChange={handleToolChange} 
      />
      <main className="flex-1 overflow-hidden">
        <ToolContainer 
          activeTool={activeTool} 
          onToolChange={handleToolChange}
        />
      </main>
    </div>
  )
}