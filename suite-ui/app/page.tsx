'use client'

import { useState, useCallback } from 'react'
import Sidebar, { Tool } from '../components/Sidebar'
import ToolContainer from '../components/ToolContainer'
import LoginPage from '../components/LoginPage'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const { isAuthenticated } = useAuth()
  const [activeTool, setActiveTool] = useState<Tool>('dashboard')

  // Optimize tool change handler
  const handleToolChange = useCallback((tool: Tool) => {
    setActiveTool(tool)
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