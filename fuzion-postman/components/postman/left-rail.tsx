"use client"

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Folder, ChevronDown, ChevronRight, MoreVertical } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { SwapyContainer } from './swapy-wrapper'

interface CollectionItem {
  id: string
  name: string
  method: string
  path?: string
  order: number
  parentId?: string
  isFolder?: boolean
  isExpanded?: boolean
  children?: CollectionItem[]
}

interface DragData {
  id: string
  type: 'item'
  sourceParentId?: string
}

const FALLBACK_ITEMS: CollectionItem[] = [
  { id: 'customer-list', name: 'Customer-list', method: 'GET', order: 0 },
  { id: 'scheme', name: 'scheme', method: 'GET', order: 1 },
  { id: 'hot-lead-old', name: 'Hot-Lead-old', method: 'GET', order: 2 }
]

export function LeftRail() {
  const [searchQuery, setSearchQuery] = useState('')
  const [folders, setFolders] = useState<CollectionItem[]>([
    {
      id: 'obl-folder',
      name: 'OBL',
      method: '',
      order: 0,
      isFolder: true,
      isExpanded: true,
      children: []
    }
  ])
  const [collections, setCollections] = useState<CollectionItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOverInfo, setDragOverInfo] = useState<{ id: string, position: 'before' | 'after' | 'inside' } | null>(null)
  const swapyRef = useRef<any>(null)

  useEffect(() => {
    const setupCollections = () => {
      setLoading(true)
      try {
        setCollections(FALLBACK_ITEMS.map((item, index) => ({
          ...item,
          order: index
        })))
      } catch (err: any) {
        setError('Failed to setup collections')
      } finally {
        setLoading(false)
      }
    }
    setupCollections()
  }, [])

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: CollectionItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      id: item.id,
      type: 'item',
      sourceParentId: item.parentId
    }))
    setDragging(item.id)
    e.dataTransfer.effectAllowed = 'move'

    // create a small canvas showing text "Move <name>" to act as drag cursor text
    try {
      // Create a small canvas showing text "Move <name>" to act as drag cursor text
      const text = `Move ${item.name}`
      const padding = 12
      const fontSize = 14
      const font = `${fontSize}px sans-serif`
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.font = font
        const textWidth = Math.ceil(ctx.measureText(text).width)
        canvas.width = textWidth + padding * 2
        canvas.height = fontSize + padding * 2
        // background
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        // text
        ctx.fillStyle = '#111827' // gray-900
        ctx.font = font
        ctx.fillText(text, padding, padding + fontSize - 3)
        // use as drag image (no need to append to DOM)
        e.dataTransfer.setDragImage(canvas, -10, canvas.height / 2)
      }
    } catch (err) {
      // ignore visual drag-image errors
    }
  }

  // Keyboard-based move: move item up/down when handle has focus and user presses ArrowUp/ArrowDown
  const moveItemByOffset = async (item: CollectionItem, offset: number) => {
    if (!item) return
    // clone arrays
    const updatedCollections = [...collections]
    const updatedFolders = [...folders]

    const sourceParentId = item.parentId
    if (sourceParentId) {
      const folder = updatedFolders.find(f => f.id === sourceParentId)
      if (!folder || !folder.children) return
      const idx = folder.children.findIndex(i => i.id === item.id)
      if (idx === -1) return
      const newIndex = Math.max(0, Math.min(folder.children.length - 1, idx + offset))
      if (newIndex === idx) return
      const [moved] = folder.children.splice(idx, 1)
      folder.children.splice(newIndex, 0, moved)
      setFolders(updatedFolders)

      // call server to persist
      const targetNeighbor = folder.children[newIndex + (offset > 0 ? 0 : 0)]
      const targetId = targetNeighbor ? targetNeighbor.id : folder.id
      const position = newIndex === 0 ? 'before' : 'after'
      try {
        await fetch('/api/collections/move-to-folder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceId: item.id, targetId, position, targetFolderId: folder.id })
        })
      } catch (err) {}
    } else {
      const idx = updatedCollections.findIndex(i => i.id === item.id)
      if (idx === -1) return
      const newIndex = Math.max(0, Math.min(updatedCollections.length - 1, idx + offset))
      if (newIndex === idx) return
      const [moved] = updatedCollections.splice(idx, 1)
      updatedCollections.splice(newIndex, 0, moved)
      setCollections(updatedCollections)

      const targetNeighbor = updatedCollections[newIndex + (offset > 0 ? 0 : 0)]
      const targetId = targetNeighbor ? targetNeighbor.id : undefined
      const position = newIndex === 0 ? 'before' : 'after'
      try {
        await fetch('/api/collections/move-to-folder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceId: item.id, targetId, position, targetFolderId: undefined })
        })
      } catch (err) {}
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, item: CollectionItem) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'

    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const height = rect.height
    
    let position: 'before' | 'after' | 'inside' = 'inside'
    
    if (item.isFolder) {
      // Quick behavior: dropping anywhere on a folder moves the file into it
      position = 'inside'
    } else {
      if (y < height / 2) {
        position = 'before'
      } else {
        position = 'after'
      }
    }

    setDragOverInfo({ id: item.id, position })
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetItem: CollectionItem) => {
    e.preventDefault()
    try {
      const data: DragData = JSON.parse(e.dataTransfer.getData('application/json'))
      if (!dragOverInfo) return
      
      const { id: draggedId, sourceParentId } = data
      const { position } = dragOverInfo

      // Find the dragged item
      let draggedItem: CollectionItem | null = null
      let updatedCollections = [...collections]
      let updatedFolders = [...folders]

      // Remove from source
      if (sourceParentId) {
        // Remove from folder
        const sourceFolder = updatedFolders.find(f => f.id === sourceParentId)
        if (sourceFolder?.children) {
          draggedItem = sourceFolder.children.find(i => i.id === draggedId) || null
          sourceFolder.children = sourceFolder.children.filter(i => i.id !== draggedId)
        }
      } else {
        // Remove from root collections
        draggedItem = collections.find(i => i.id === draggedId) || null
        updatedCollections = updatedCollections.filter(i => i.id !== draggedId)
      }

      if (!draggedItem) return

      // Add to target
      if (targetItem.isFolder && position === 'inside') {
        const targetFolder = updatedFolders.find(f => f.id === targetItem.id)
        if (targetFolder) {
          targetFolder.children = targetFolder.children || []
          draggedItem.parentId = targetItem.id
          targetFolder.children.push(draggedItem)
        }
      } else {
        if (targetItem.parentId) {
          // Add to parent folder
          const parentFolder = updatedFolders.find(f => f.id === targetItem.parentId)
          if (parentFolder?.children) {
            const targetIndex = parentFolder.children.findIndex(i => i.id === targetItem.id)
            draggedItem.parentId = targetItem.parentId
            parentFolder.children.splice(
              position === 'before' ? targetIndex : targetIndex + 1,
              0,
              draggedItem
            )
          }
        } else {
          // Add to root collections
          const targetIndex = updatedCollections.findIndex(i => i.id === targetItem.id)
          draggedItem.parentId = undefined
          updatedCollections.splice(
            position === 'before' ? targetIndex : targetIndex + 1,
            0,
            draggedItem
          )
        }
      }

      setCollections(updatedCollections)
      setFolders(updatedFolders)

      // Update server
      await fetch('/api/collections/move-to-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: draggedId,
          targetId: targetItem.id,
          position,
          targetFolderId: position === 'inside' ? targetItem.id : targetItem.parentId
        })
      })
    } catch (error) {
      console.error('Error handling drop:', error)
    }

    setDragging(null)
    setDragOverInfo(null)
  }

  const handleDragEnd = () => {
    setDragging(null)
    setDragOverInfo(null)
  }

  const renderItem = (item: CollectionItem) => {
    const isDraggedOver = dragOverInfo?.id === item.id
    const position = dragOverInfo?.position

    return (
      <div
        key={item.id}
        className={cn(
          "flex items-center gap-2 p-2 rounded group relative",
          "hover:bg-gray-100",
          dragging === item.id && "opacity-50",
          "border border-transparent",
          isDraggedOver && position === 'inside' && item.isFolder && "bg-blue-50",
          isDraggedOver && position === 'before' && "border-t-2 border-t-blue-500",
          isDraggedOver && position === 'after' && "border-b-2 border-b-blue-500"
        )}
        data-item-id={item.id}
        draggable={!item.isFolder}
        onDragStart={(e) => { if (!item.isFolder) handleDragStart(e, item) }}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => handleDragOver(e, item)}
        onDrop={(e) => handleDrop(e, item)}
      >
  <div className="flex items-center gap-2 flex-1">
          {item.isFolder ? (
            <>
              <button
                onClick={() => {
                  const updatedFolders = folders.map(f =>
                    f.id === item.id ? { ...f, isExpanded: !f.isExpanded } : f
                  )
                  setFolders(updatedFolders)
                }}
                className="flex items-center gap-1"
              >
                {item.isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
                <Folder className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{item.name}</span>
              </button>
            </>
          ) : (
            <>
              <span className={cn(
                "px-1.5 py-0.5 text-[10px] font-medium rounded select-none cursor-pointer",
                item.method.toUpperCase() === 'GET' ? "bg-green-500 text-white" : "bg-blue-500 text-white"
              )}
              onClick={(e) => {
                e.stopPropagation()
                if (swapyRef.current && item.method.toUpperCase() === 'GET') {
                  swapyRef.current.show(item.name)
                }
              }}>
                {item.method.toUpperCase()}
              </span>
              <span className="text-sm text-gray-700 select-none min-w-0 flex-1 truncate">
                {item.name}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 z-30">
          <div
            className={cn(
              item.method?.toUpperCase() === 'GET' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
              'flex items-center justify-center w-8 h-8 hover:bg-gray-200 rounded transition-all'
            )}
            title="Drag to reorder or move to folder"
            role="button"
            tabIndex={0}
            aria-label={`Move ${item.name}`}
            onKeyDown={(e) => {
              // Arrow Up / Down — move the item within its list
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                moveItemByOffset(item, -1)
              } else if (e.key === 'ArrowDown') {
                e.preventDefault()
                moveItemByOffset(item, 1)
              } else if (e.key === 'Enter' || e.key === ' ') {
                // start drag via keyboard: set focus state (visual) but real HTML5 drag needs mouse; we use keyboard moves instead
                e.preventDefault()
                setDragging(item.id)
                setTimeout(() => setDragging(null), 500)
              }
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400">
              <path d="M6 2.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm2 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm-5 4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm8 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm-5 4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm5 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0z" fill="currentColor"/>
            </svg>
          </div>
        </div>
      </div>
    )
  }

  const renderFolder = (folder: CollectionItem) => {
    return (
      <div key={folder.id} className="space-y-1">
        {renderItem(folder)}
        {folder.isExpanded && folder.children && folder.children.length > 0 && (
          <div className="ml-6 space-y-1">
            {folder.children.map(item => renderItem(item))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <SwapyContainer 
        className="hidden" 
        onReady={(swapy) => {
          swapyRef.current = swapy
        }} 
      />

      <div className="p-4 border-b flex items-center justify-between">
        <Input
          placeholder="Search collections"
          className="h-8 flex-grow mr-2"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button 
          className="px-2 py-1 text-sm border rounded hover:bg-gray-50"
          onClick={() => {
            const folderName = prompt('Enter folder name:')
            if (folderName) {
              const newFolder: CollectionItem = {
                id: `folder-${Date.now()}`,
                name: folderName,
                method: '',
                order: folders.length,
                isFolder: true,
                isExpanded: true,
                children: []
              }
              setFolders([...folders, newFolder])
            }
          }}
        >
          + Add Folder
        </button>
      </div>

  <div className="flex-1 overflow-y-auto px-2 pb-3">
        {loading ? (
          <div className="flex justify-center items-center h-20">
            <Spinner className="h-5 w-5" />
          </div>
        ) : error ? (
          <div className="p-4 text-red-500 text-sm">
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 text-blue-500 hover:text-blue-700 underline"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-4 p-1">
            <div className="space-y-1">
              {folders.map(folder => renderFolder(folder))}
            </div>

            <div className="space-y-1">
              <div className="px-2 text-xs font-medium text-gray-500">Other Items</div>
              {collections
                .filter(item => !item.parentId)
                .map(item => renderItem(item))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}