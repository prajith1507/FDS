"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { GripVertical } from "lucide-react"

interface SplitPaneProps {
  left: React.ReactNode
  right: React.ReactNode
  defaultSplit?: number
}

export function SplitPane({ left, right, defaultSplit = 50 }: SplitPaneProps) {
  const [split, setSplit] = useState(defaultSplit)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      const container = containerRef.current
      const rect = container.getBoundingClientRect()
      const newSplit = ((e.clientX - rect.left) / rect.width) * 100

      if (newSplit > 20 && newSplit < 80) {
        setSplit(newSplit)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging])

  return (
    <div ref={containerRef} className="flex h-full relative">
      <div style={{ width: `${split}%` }} className="h-full overflow-hidden">
        {left}
      </div>

      <div
        className="w-1 bg-border hover:bg-primary cursor-col-resize flex items-center justify-center group relative"
        onMouseDown={() => setIsDragging(true)}
      >
        <div className="absolute inset-y-0 -left-1 -right-1" />
        <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
      </div>

      <div style={{ width: `${100 - split}%` }} className="h-full overflow-hidden">
        {right}
      </div>
    </div>
  )
}
