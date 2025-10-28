"use client"

import type React from "react"
import { useMemo, useRef, useState, useCallback, useEffect } from "react"
import {
  ChevronDown,
  ChevronRight,
  FolderOpen,
  MoreHorizontal,
  Search,
  Upload,
  Plus,
  FilePlus2,
  FolderPlus,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { cn } from "@/lib/utils"
import {
  METHOD_CLASS,
  type PMCollection,
  type TreeNode,
  buildTree,
  filterTree,
  insertChild,
  updateNodeName,
  removeNode,
  duplicateBranch,
  exportToPMCollection,
  updateRequestFields,
  mergeTrees, // import merge helper
} from "./tree-utils"
import { generateUniqueKey, extractExistingKeys } from "@/lib/key-utils"
import { EnvironmentManager, type EnvironmentVariable } from "./environment-manager"

type SecondarySidebarProps = {
  collection: PMCollection
  onChange?: (collection: PMCollection) => void
  onSelect?: (node: Extract<TreeNode, { type: "request" }>) => void
  onExposeApi?: (api: {
    patchRequest: (id: string, patch: Partial<Extract<TreeNode, { type: "request" }>>) => void
  }) => void
  selectedId?: string
  loading?: boolean
  environmentVariables?: EnvironmentVariable[]
  onUpdateEnvironment?: (variables: EnvironmentVariable[]) => void
}

export function SecondarySidebar({
  collection,
  onChange,
  onSelect,
  onExposeApi,
  selectedId,
  loading,
  environmentVariables = [],
  onUpdateEnvironment,
}: SecondarySidebarProps) {
  const idRef = useRef(1000)
  const nextId = () => `n-${++idRef.current}`

  const [query, setQuery] = useState("")
  const [tree, setTree] = useState<TreeNode[]>(() => buildTree(collection))
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({})
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverInfo, setDragOverInfo] = useState<{ id: string; position: 'before' | 'after' | 'inside' } | null>(null)

  const [addingFolder, setAddingFolder] = useState<string | null>(null)
  const [addingRequest, setAddingRequest] = useState<string | null>(null)
  const [newName, setNewName] = useState("")
  const [newMethod, setNewMethod] = useState<"GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS">("GET")

  const emitChange = useCallback(
    (nextTree: TreeNode[]) => {
      const next = exportToPMCollection(collection.info || {}, nextTree)
      onChange?.(next)
    },
    [collection.info, onChange],
  )

  const emitChangeRef = useRef(emitChange)
  useEffect(() => {
    emitChangeRef.current = emitChange
  }, [emitChange])

  // Update tree when collection prop changes
  useEffect(() => {
    setTree(buildTree(collection))
  }, [collection])

  const setTreeAndEmit = useCallback((updater: (prev: TreeNode[]) => TreeNode[]) => {
    setTree((prev) => {
      const next = updater(prev)
      emitChangeRef.current(next)
      return next
    })
  }, [])

  // Helpers to manipulate tree and extract nodes
  const removeNodeById = (nodes: TreeNode[], id: string): { node: TreeNode | null; tree: TreeNode[] } => {
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]
      if (n.id === id) {
        const copy = [...nodes]
        copy.splice(i, 1)
        return { node: n, tree: copy }
      }
      if (n.type === 'folder' && n.children) {
        const res = removeNodeById(n.children, id)
        if (res.node) {
          const copy = nodes.map((x) => ({ ...x }))
          copy[i] = { ...n, children: res.tree }
          return { node: res.node, tree: copy }
        }
      }
    }
    return { node: null, tree: nodes }
  }

  const insertNodeAt = (nodes: TreeNode[], parentId: string | null, index: number | null, nodeToInsert: TreeNode): TreeNode[] => {
    if (!parentId) {
      const copy = [...nodes]
      if (index === null) copy.push(nodeToInsert)
      else copy.splice(index, 0, nodeToInsert)
      return copy
    }

    return nodes.map((n) => {
      if (n.id === parentId && n.type === 'folder') {
        const children = n.children ? [...n.children] : []
        if (index === null) children.push(nodeToInsert)
        else children.splice(index, 0, nodeToInsert)
        return { ...n, children }
      }
      if (n.type === 'folder' && n.children) {
        return { ...n, children: insertNodeAt(n.children, parentId, index, nodeToInsert) }
      }
      return n
    })
  }

  const findParentId = (nodes: TreeNode[], id: string, parentId: string | null = null): string | null => {
    for (const n of nodes) {
      if (n.id === id) return parentId
      if (n.type === 'folder' && n.children) {
        const found = findParentId(n.children, id, n.id)
        if (found) return found
      }
    }
    return null
  }

  const findIndexInParent = (nodes: TreeNode[], id: string, parentId: string | null): number => {
    if (!parentId) return nodes.findIndex((x) => x.id === id)
    const parent = (function find(nodes: TreeNode[]): TreeNode | undefined {
      for (const n of nodes) {
        if (n.id === parentId) return n
        if (n.type === 'folder' && n.children) {
          const f = find(n.children)
          if (f) return f
        }
      }
      return undefined
    })(nodes)
    if (!parent || parent.type !== 'folder' || !parent.children) return -1
    return parent.children.findIndex((x) => x.id === id)
  }

  const handleDragStart = (e: React.DragEvent, node: Extract<TreeNode, { type: 'request' }>) => {
    e.stopPropagation()
    const parentId = findParentId(tree, node.id)
    e.dataTransfer?.setData('application/json', JSON.stringify({ id: node.id, sourceParentId: parentId }))
    setDraggingId(node.id)
    try {
      const text = `Move ${node.name}`
      const padding = 10
      const fontSize = 13
      const font = `${fontSize}px sans-serif`
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.font = font
        const textWidth = Math.ceil(ctx.measureText(text).width)
        canvas.width = textWidth + padding * 2
        canvas.height = fontSize + padding * 2
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#111827'
        ctx.font = font
        ctx.fillText(text, padding, padding + fontSize - 2)
        e.dataTransfer?.setDragImage(canvas, -10, canvas.height / 2)
      }
    } catch (err) {}
  }

  const handleDragOver = (e: React.DragEvent, node: TreeNode) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer!.dropEffect = 'move'
    const cur = e.currentTarget as HTMLElement
    const rect = cur.getBoundingClientRect()
    const y = e.clientY - rect.top
    const height = rect.height
    let position: 'before' | 'after' | 'inside' = 'inside'
    if (node.type === 'folder') {
      position = 'inside'
    } else {
      position = y < height / 2 ? 'before' : 'after'
    }
    setDragOverInfo({ id: node.id, position })
  }

  const handleDrop = (e: React.DragEvent, target: TreeNode) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const raw = e.dataTransfer?.getData('application/json')
      if (!raw) return
      const data = JSON.parse(raw)
      const draggedId: string = data.id

      setTreeAndEmit((prev) => {
        // remove dragged node
        const removed = removeNodeById(prev, draggedId)
        if (!removed.node) return prev
        const nodeToInsert = removed.node

        // if dropping on folder -> put inside
        if (target.type === 'folder') {
          // ensure folder exists and expand
          setOpenMap((m) => ({ ...m, [target.id]: true }))
          return insertNodeAt(removed.tree, target.id, null, nodeToInsert)
        }

        // dropping on request -> insert before/after depending on dragOverInfo
        const parentId = findParentId(removed.tree, target.id)
        let idx = findIndexInParent(removed.tree, target.id, parentId)
        const pos = dragOverInfo?.id === target.id ? dragOverInfo.position : 'after'
        if (pos === 'after') idx = idx + 1
        return insertNodeAt(removed.tree, parentId, idx, nodeToInsert)
      })
    } catch (err) {
      console.error('drop error', err)
    } finally {
      setDraggingId(null)
      setDragOverInfo(null)
    }
  }

  const handleDragEndLocal = (e?: React.DragEvent) => {
    setDraggingId(null)
    setDragOverInfo(null)
  }

  const filtered = useMemo(() => filterTree(tree, query), [tree, query])

  const addFolder = (parentId: string | null) => {
    console.log("addFolder called")
    // Use "root" for root level instead of null
    const targetParent = parentId === null ? "root" : parentId
    setAddingFolder(targetParent)
    setNewName("")
  }

  const confirmAddFolder = () => {
    if (!newName.trim()) return
    const folder: TreeNode = { id: nextId(), type: "folder", name: newName.trim(), children: [] }
    // Convert "root" back to null for the tree insertion
    const parentId = addingFolder === "root" ? null : addingFolder
    setTreeAndEmit((t) => insertChild(t, parentId, folder))
    if (parentId) setOpenMap((m) => ({ ...m, [parentId]: true }))
    setAddingFolder(null)
    setNewName("")
  }

  const addRequest = (parentId: string | null) => {
    console.log("addRequest called")
    // Use "root" for root level instead of null
    const targetParent = parentId === null ? "root" : parentId
    setAddingRequest(targetParent)
    setNewName("")
    setNewMethod("GET")
  }

  const confirmAddRequest = () => {
    if (!newName.trim()) return
    
    // Get existing keys from the current tree to ensure uniqueness
    const flattenTree = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.reduce((acc: TreeNode[], node) => {
        acc.push(node)
        if (node.type === "folder" && node.children) {
          acc.push(...flattenTree(node.children))
        }
        return acc
      }, [])
    }
    
    const allNodes = flattenTree(tree)
    const existingKeys = extractExistingKeys(allNodes)
    const uniqueKey = generateUniqueKey(newName.trim(), existingKeys)
    
    const req: TreeNode = { 
      id: nextId(), 
      type: "request", 
      name: newName.trim(), 
      method: newMethod,
      key: uniqueKey 
    }
    
    // Convert "root" back to null for the tree insertion
    const parentId = addingRequest === "root" ? null : addingRequest
    setTreeAndEmit((t) => insertChild(t, parentId, req))
    if (parentId) setOpenMap((m) => ({ ...m, [parentId]: true }))
    setAddingRequest(null)
    setNewName("")
  }

  const renameNodeById = (id: string, currentName: string) => {
    const name = typeof window !== "undefined" ? window.prompt("Rename", currentName) : ""
    if (!name || name === currentName) return
    setTreeAndEmit((t) => updateNodeName(t, id, name))
  }

  const duplicateNodeById = (id: string, expandParentId?: string) => {
    setTreeAndEmit((t) => duplicateBranch(t, id, () => nextId()))
    if (expandParentId) setOpenMap((m) => ({ ...m, [expandParentId]: true }))
  }

  const deleteNodeById = (id: string, nodeName: string) => {
    const ok =
      typeof window !== "undefined" ? window.confirm(`Delete "${nodeName}"? This action cannot be undone.`) : true
    if (!ok) return
    setTreeAndEmit((t) => removeNode(t, id))
  }

  const exposedOnceRef = useRef(false)
  useEffect(() => {
    if (!onExposeApi || exposedOnceRef.current) return

    const patchRequest = (id: string, patch: Partial<Extract<TreeNode, { type: "request" }>>) => {
      setTree((prev) => {
        const next = updateRequestFields(prev, id, patch)
        emitChangeRef.current(next)
        return next
      })
    }

    onExposeApi({ patchRequest })
    exposedOnceRef.current = true
  }, [onExposeApi])

  const fileRef = useRef<HTMLInputElement | null>(null) // hidden file input ref

  const handleImportJson = useCallback(async (file: File) => {
    try {
      const text = await file.text()
      const raw = JSON.parse(text)

      // accept full collection or raw item[]
      const importedCollection: PMCollection =
        raw && Array.isArray(raw.item)
          ? raw
          : Array.isArray(raw)
            ? { info: { name: "Imported" }, item: raw }
            : { info: raw?.info || { name: "Imported" }, item: raw?.item || [] }

      const incomingTree = buildTree(importedCollection)
      
      // Check if the imported collection has an info.name to create a folder structure
      if (importedCollection.info?.name && importedCollection.info.name !== "Imported" && incomingTree.length > 0) {
        // Create a folder with the collection name and put all imported items inside
        const collectionFolder: TreeNode = {
          id: nextId(),
          type: "folder",
          name: importedCollection.info.name,
          children: incomingTree
        }
        
        setTree((prev) => {
          const merged = mergeTrees(prev, [collectionFolder])
          // emit change with merged tree
          emitChangeRef.current(merged)
          return merged
        })
      } else {
        // Import items directly at root level (existing behavior)
        setTree((prev) => {
          const merged = mergeTrees(prev, incomingTree)
          // emit change with merged tree
          emitChangeRef.current(merged)
          return merged
        })
      }
    } catch (err: any) {
      console.error("[v0] Import JSON failed:", err?.message || err)
      if (typeof window !== "undefined") {
        window.alert("Failed to import JSON. Please ensure it's a valid Postman collection or item array.")
      }
    } finally {
      if (fileRef.current) fileRef.current.value = ""
    }
  }, [])

  return (
    <aside className="bg-pm-surface-2 border-r h-full flex flex-col">
      {/* Header */}
      <div className="h-12 border-b flex items-center justify-between px-3 flex-shrink-0">
        {/* Project Name - Left Aligned */}
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground/90 truncate">API</span>
        </div>

        {/* Action Buttons - Right Aligned */}
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleImportJson(f)
            }}
          />
          
          {/* Environment Manager */}
          {onUpdateEnvironment && (
            <EnvironmentManager 
              variables={environmentVariables}
              onUpdate={onUpdateEnvironment}
            />
          )}
          
          <button
            className="h-7 rounded-md bg-pm-brand px-2 text-xs font-medium text-pm-on-brand hover:opacity-95"
            aria-label="Import JSON"
            title="Import JSON"
            onClick={() => fileRef.current?.click()}
          >
            <span className="inline-flex items-center gap-1">
              <Upload className="h-4 w-4" />
              <span>Import</span>
            </span>
          </button>
        </div>
      </div>

      {/* Search + Add */}
      <div className="px-3 py-2 flex items-center gap-2 flex-shrink-0">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
          <Input
            placeholder="Search collections"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 h-8 bg-card"
            aria-label="Search collections"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="h-8 rounded-md border px-2 text-xs font-medium hover:bg-muted/50 inline-flex items-center gap-1"
              aria-label="Add" 
              title="Add"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onSelect={() => {
                addRequest(null)
              }}
            >
              <FilePlus2 className="mr-2 h-4 w-4" /> New request
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                addFolder(null)
              }}
            >
              <FolderPlus className="mr-2 h-4 w-4" /> New folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Environment Indicator */}
      {/* {environmentVariables.length > 0 && (
        <div className="px-3 pb-2 text-xs text-muted-foreground flex items-center gap-1">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span>{environmentVariables.filter(v => v.enabled).length} environment variables</span>
        </div>
      )} */}

      {/* Collections tree */}
      <div 
        className="flex-1 overflow-y-auto px-2 pb-3"
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
          // Allow drop on root (empty space)
          setDragOverInfo(null)
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          // Drop on root level (outside any folder)
          try {
            const raw = e.dataTransfer?.getData('application/json')
            if (!raw) return
            const data = JSON.parse(raw)
            const draggedId: string = data.id

            setTreeAndEmit((prev) => {
              const removed = removeNodeById(prev, draggedId)
              if (!removed.node) return prev
              // Insert at root level
              return insertNodeAt(removed.tree, null, null, removed.node)
            })
          } catch (err) {
            console.error('drop error on root', err)
          } finally {
            setDraggingId(null)
            setDragOverInfo(null)
          }
        }}
      >
        {/* <div className="px-2 py-1 text-xs text-foreground/70">Collections</div> */}

        {loading ? (
          <ul className="space-y-2 px-2 py-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className="h-6 rounded bg-muted/60 animate-pulse" />
            ))}
          </ul>
        ) : (
          <>
            {addingRequest !== null && (
              <div className="px-2 py-1 flex items-center gap-2">
                <select
                  className="h-7 rounded border bg-card text-xs font-mono px-2"
                  value={newMethod}
                  onChange={(e) => setNewMethod(e.target.value as any)}
                  aria-label="HTTP method"
                >
                  <option>GET</option>
                  <option>POST</option>
                  <option>PUT</option>
                  <option>DELETE</option>
                  <option>PATCH</option>
                  <option>HEAD</option>
                  <option>OPTIONS</option>
                </select>
                <Input
                  autoFocus
                  placeholder="New request name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmAddRequest()
                    if (e.key === "Escape") setAddingRequest(null)
                  }}
                  onBlur={() => {
                    if (newName.trim()) confirmAddRequest()
                    else setAddingRequest(null)
                  }}
                  className="h-7 text-sm"
                />
              </div>
            )}

            {addingFolder !== null && (
              <div className="px-2 py-1 flex items-center gap-2">
                <Input
                  autoFocus
                  placeholder="New folder name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmAddFolder()
                    if (e.key === "Escape") setAddingFolder(null)
                  }}
                  onBlur={() => {
                    if (newName.trim()) confirmAddFolder()
                    else setAddingFolder(null)
                  }}
                  className="h-7 text-sm"
                />
              </div>
            )}

            <ul className="space-y-1">
              {filtered.map((n) =>
                n.type === "folder" ? (
                  <FolderNode
                    key={n.id}
                    node={n}
                    openMap={openMap}
                    setOpenMap={setOpenMap}
                    onAddFolder={addFolder}
                    onAddRequest={addRequest}
                    onRename={renameNodeById}
                    onDuplicate={duplicateNodeById}
                    onDelete={deleteNodeById}
                    onSelect={onSelect}
                    selectedId={selectedId}
                    onNodeDragOver={handleDragOver}
                    onNodeDrop={handleDrop}
                    onNodeDragStart={handleDragStart}
                    onNodeDragEnd={handleDragEndLocal}
                    draggingId={draggingId}
                    dragOverInfo={dragOverInfo}
                  />
                ) : (
                  <RequestNode
                    key={n.id}
                    node={n}
                    onRename={renameNodeById}
                    onDuplicate={duplicateNodeById}
                    onDelete={deleteNodeById}
                    onSelect={onSelect}
                    selected={selectedId === n.id}
                    onNodeDragStart={handleDragStart}
                    onNodeDragOver={handleDragOver}
                    onNodeDrop={handleDrop}
                    onNodeDragEnd={handleDragEndLocal}
                    draggingId={draggingId}
                    dragOverInfo={dragOverInfo}
                  />
                ),
              )}
            </ul>
          </>
        )}
      </div>
    </aside>
  )
}

function FolderNode({
  node,
  openMap,
  setOpenMap,
  onAddFolder,
  onAddRequest,
  onRename,
  onDuplicate,
  onDelete,
  onSelect,
  selectedId,
  onNodeDragOver,
  onNodeDrop,
  onNodeDragStart,
  onNodeDragEnd,
  draggingId,
  dragOverInfo,
}: {
  node: Extract<TreeNode, { type: "folder" }>
  openMap: Record<string, boolean>
  setOpenMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  onAddFolder: (parentId: string | null) => void
  onAddRequest: (parentId: string | null) => void
  onRename: (id: string, currentName: string) => void
  onDuplicate: (id: string, expandParentId?: string) => void
  onDelete: (id: string, nodeName: string) => void
  onSelect?: (node: Extract<TreeNode, { type: "request" }>) => void
  selectedId?: string
  onNodeDragOver?: (e: React.DragEvent, node: TreeNode) => void
  onNodeDrop?: (e: React.DragEvent, node: TreeNode) => void
  onNodeDragStart?: (e: React.DragEvent, node: Extract<TreeNode, { type: 'request' }>) => void
  onNodeDragEnd?: (e?: React.DragEvent) => void
  draggingId?: string | null
  dragOverInfo?: { id: string; position: 'before' | 'after' | 'inside' } | null
}) {
  const open = !!openMap[node.id]
  const toggle = () => setOpenMap((m) => ({ ...m, [node.id]: !m[node.id] }))

  return (
    <li>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn("group flex items-center justify-between rounded px-2 py-1.5 hover:bg-muted/60")}
            onDragOver={(e) => onNodeDragOver?.(e, node)}
            onDrop={(e) => onNodeDrop?.(e, node)}
          >
            <button
              className="flex items-center gap-1.5 text-left flex-1"
              onClick={toggle}
              aria-expanded={open}
              aria-label={node.name}
            >
              {open ? (
                <ChevronDown className="h-4 w-4 text-foreground/60" />
              ) : (
                <ChevronRight className="h-4 w-4 text-foreground/60" />
              )}
              <FolderOpen className="h-4 w-4 text-foreground/60" />
              <span className="text-sm text-foreground/90">{node.name}</span>
            </button>

            <KebabFolder
              onAddRequest={() => onAddRequest(node.id)}
              onAddFolder={() => onAddFolder(node.id)}
              onRename={() => onRename(node.id, node.name)}
              onDuplicate={() => onDuplicate(node.id, node.id)}
              onDelete={() => onDelete(node.id, node.name)}
            />
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-56">
          <ContextMenuItem
            onSelect={(e) => {
              e.preventDefault()
              onAddRequest(node.id)
            }}
          >
            Add request
          </ContextMenuItem>
          <ContextMenuItem
            onSelect={(e) => {
              e.preventDefault()
              onAddFolder(node.id)
            }}
          >
            Add folder
          </ContextMenuItem>
          <ContextMenuItem>Run</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem>Share</ContextMenuItem>
          <ContextMenuItem>Copy link</ContextMenuItem>
          <ContextMenuItem>Ask AI</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onSelect={(e) => {
              e.preventDefault()
              onRename(node.id, node.name)
            }}
          >
            Rename
          </ContextMenuItem>
          <ContextMenuItem
            onSelect={(e) => {
              e.preventDefault()
              onDuplicate(node.id, node.id)
            }}
          >
            Duplicate
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            className="text-red-600"
            onSelect={(e) => {
              e.preventDefault()
              onDelete(node.id, node.name)
            }}
          >
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {open && node.children.length > 0 && (
        <ul className="ml-6 mt-1 space-y-1">
          {node.children.map((c) =>
            c.type === "folder" ? (
              <FolderNode
                key={c.id}
                node={c}
                openMap={openMap}
                setOpenMap={setOpenMap}
                onAddFolder={onAddFolder}
                onAddRequest={onAddRequest}
                onRename={onRename}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
                onSelect={onSelect}
                selectedId={selectedId}
                onNodeDragOver={onNodeDragOver}
                onNodeDrop={onNodeDrop}
                onNodeDragStart={onNodeDragStart}
                onNodeDragEnd={onNodeDragEnd}
                draggingId={draggingId}
                dragOverInfo={dragOverInfo}
              />
            ) : (
              <RequestNode
                key={c.id}
                node={c}
                onRename={onRename}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
                onSelect={onSelect}
                selected={selectedId === c.id}
                onNodeDragStart={onNodeDragStart}
                onNodeDragOver={onNodeDragOver}
                onNodeDrop={onNodeDrop}
                onNodeDragEnd={onNodeDragEnd}
                draggingId={draggingId}
                dragOverInfo={dragOverInfo}
              />
            ),
          )}
        </ul>
      )}
    </li>
  )
}

function RequestNode({
  node,
  onRename,
  onDuplicate,
  onDelete,
  onSelect,
  selected,
  onNodeDragStart,
  onNodeDragOver,
  onNodeDrop,
  onNodeDragEnd,
  draggingId,
  dragOverInfo,
}: {
  node: Extract<TreeNode, { type: "request" }>
  onRename: (id: string, currentName: string) => void
  onDuplicate: (id: string, expandParentId?: string) => void
  onDelete: (id: string, nodeName: string) => void
  onSelect?: (node: Extract<TreeNode, { type: "request" }>) => void
  selected?: boolean
  onNodeDragStart?: (e: React.DragEvent, node: Extract<TreeNode, { type: 'request' }>) => void
  onNodeDragOver?: (e: React.DragEvent, node: TreeNode) => void
  onNodeDrop?: (e: React.DragEvent, node: TreeNode) => void
  onNodeDragEnd?: (e?: React.DragEvent) => void
  draggingId?: string | null
  dragOverInfo?: { id: string; position: 'before' | 'after' | 'inside' } | null
}) {
  const badgeCls = METHOD_CLASS[node.method] || "bg-muted text-foreground"
  return (
    <li>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            draggable
            onDragStart={(e) => onNodeDragStart?.(e, node)}
            onDragOver={(e) => onNodeDragOver?.(e, node)}
            onDrop={(e) => onNodeDrop?.(e, node)}
            onDragEnd={(e) => onNodeDragEnd?.(e)}
            className={cn(
              "group flex items-center justify-between rounded px-2 py-1.5 hover:bg-muted/60",
              selected && "bg-muted/70 ring-1 ring-[var(--border)]",
              dragOverInfo?.id === node.id && dragOverInfo.position === 'before' && 'border-t-2 border-t-accent',
              dragOverInfo?.id === node.id && dragOverInfo.position === 'after' && 'border-b-2 border-b-accent',
            )}
            aria-selected={selected || false}
          >
            <button className="flex items-center gap-2 text-left flex-1" onClick={() => {
              console.log('🖱️ API item clicked:', node.name, 'key:', node.key)
              onSelect?.(node)
            }}>
              <span
                className={cn(
                  "inline-flex h-5 w-10 items-center justify-center rounded text-[11px] font-mono",
                  badgeCls,
                )}
                aria-hidden
              >
                {node.method}
              </span>
              <span className="text-sm text-foreground/85">{node.name}</span>
            </button>

            <KebabRequest
              onRename={() => onRename(node.id, node.name)}
              onDuplicate={() => onDuplicate(node.id)}
              onDelete={() => onDelete(node.id, node.name)}
            />
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-56">
          <ContextMenuItem>Add example</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem>Share</ContextMenuItem>
          <ContextMenuItem>Copy link</ContextMenuItem>
          <ContextMenuItem>Ask AI</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onSelect={(e) => {
              e.preventDefault()
              onRename(node.id, node.name)
            }}
          >
            Rename
          </ContextMenuItem>
          <ContextMenuItem
            onSelect={(e) => {
              e.preventDefault()
              onDuplicate(node.id)
            }}
          >
            Duplicate
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            className="text-red-600"
            onSelect={(e) => {
              e.preventDefault()
              onDelete(node.id, node.name)
            }}
          >
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </li>
  )
}

function KebabFolder({
  onAddRequest,
  onAddFolder,
  onRename,
  onDuplicate,
  onDelete,
}: {
  onAddRequest: () => void
  onAddFolder: () => void
  onRename: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted/80" aria-label="Folder options">
          <MoreHorizontal className="h-4 w-4 text-foreground/60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            onAddRequest()
          }}
        >
          Add request
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            onAddFolder()
          }}
        >
          Add folder
        </DropdownMenuItem>
        <DropdownMenuItem>Run</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Share</DropdownMenuItem>
        <DropdownMenuItem>Copy link</DropdownMenuItem>
        <DropdownMenuItem>Ask AI</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            onRename()
          }}
        >
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            onDuplicate()
          }}
        >
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600"
          onSelect={(e) => {
            e.preventDefault()
            onDelete()
          }}
        >
          Delete
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuLabel>More actions</DropdownMenuLabel>
            <DropdownMenuItem>Action 1</DropdownMenuItem>
            <DropdownMenuItem>Action 2</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function KebabRequest({
  onRename,
  onDuplicate,
  onDelete,
}: {
  onRename: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted/80"
          aria-label="Request options"
        >
          <MoreHorizontal className="h-4 w-4 text-foreground/60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuItem>Add example</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Share</DropdownMenuItem>
        <DropdownMenuItem>Copy link</DropdownMenuItem>
        <DropdownMenuItem>Ask AI</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            onRename()
          }}
        >
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            onDuplicate()
          }}
        >
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600"
          onSelect={(e) => {
            e.preventDefault()
            onDelete()
          }}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
