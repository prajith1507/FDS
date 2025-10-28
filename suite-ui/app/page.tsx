'use client'

import { useState } from 'react'
import Sidebar, { Tool } from '../components/Sidebar'
import ToolContainer from '../components/ToolContainer'

export default function Home() {
  const [activeTool, setActiveTool] = useState<Tool>('dashboard')

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        activeTool={activeTool} 
        onToolChange={setActiveTool} 
      />
      <main className="flex-1 overflow-hidden">
        <ToolContainer activeTool={activeTool} />
      </main>
    </div>
  )
}