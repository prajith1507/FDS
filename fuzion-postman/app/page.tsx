"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import useSWR from "swr"
import { SecondarySidebar } from "@/components/postman/secondary-sidebar"
import { RequestEditor } from "@/components/postman/request-editor"
import { RightSidebar } from "@/components/postman/right-sidebar"
import { ConsolePanel } from "@/components/postman/console-panel"
import { EnvironmentManager, EnvironmentIndicator } from "@/components/postman/environment-manager"
import type { TreeNode } from "@/components/postman/tree-utils"
import type { ResponseInfo } from "@/components/postman/response-panel"
import { Splitter } from "@/components/postman/splitter"
import { cn } from "@/lib/utils"
import { useConsole } from "@/hooks/use-console"
import { useEnvironmentVariables } from "@/hooks/use-environment"

import { updateCollectionKeys } from "@/lib/key-utils"

const COLLECTIONS_URL = process.env.NEXT_PUBLIC_COLLECTIONS_URL || "https://0shfds9x-4001.inc1.devtunnels.ms/api/collections/"
const BULK_UPDATE_URL = process.env.NEXT_PUBLIC_BULK_UPDATE_URL || "https://0shfds9x-4001.inc1.devtunnels.ms/api/collections/bulk-update"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost"
const SAVE_API_ENDPOINT = process.env.NEXT_PUBLIC_SAVE_API_ENDPOINT || "/api/apis/create"

const fetcher = (url: string) => {
  console.log("🌐 Fetching collections from:", url)
  return fetch(url, { cache: "no-store" }).then((r) => {
    console.log("📡 Response status:", r.status)
    return r.json().then(data => {
      console.log("📊 Full response data:", data)
      if (data.item && data.item.length > 0) {
        console.log("🔍 First item structure:", data.item[0])
        console.log("🔍 All item keys:", data.item.map((item: any) => ({ name: item.name, key: item.key, id: item.id })))
      }
      return data
    })
  })
}

export default function Page() {
  console.log("🔧 COLLECTIONS_URL:", COLLECTIONS_URL)
  
  const [collection, setCollection] = useState<{ info?: any; item: any[] }>({ info: { name: "Workspace" }, item: [] })
  const [openTabs, setOpenTabs] = useState<Extract<TreeNode, { type: "request" }>[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [unsavedTabs, setUnsavedTabs] = useState<Set<string>>(new Set())
  const [response, setResponse] = useState<ResponseInfo | null>(null)
  const [rightTab, setRightTab] = useState<"docs" | "comments" | "code" | "info" | null>(null)
  const [isLoadingApiDetails, setIsLoadingApiDetails] = useState<boolean>(false)
  const [userMinimizedSidebar, setUserMinimizedSidebar] = useState<boolean>(false)
  const [hasUserInteractedWithSidebar, setHasUserInteractedWithSidebar] = useState<boolean>(false)

  // Console hook for debugging API calls
  const { entries: consoleEntries, logRequest, logResponse, logError, clearEntries } = useConsole()

  // Environment variables hook
  const { variables, updateVariables, replaceVariables, hasVariables } = useEnvironmentVariables()

  // Get the currently active request
  const selected = openTabs.find(tab => tab.id === activeTabId) || null

  // Clear response when switching to a different request
  useEffect(() => {
    setResponse(null)
  }, [activeTabId])

  // Handle right sidebar visibility based on selected request
  useEffect(() => {
    if (selected) {
      // Only auto-expand if user has previously interacted with sidebar and hasn't manually minimized it
      if (hasUserInteractedWithSidebar && !userMinimizedSidebar) {
        setRightSidebarExpanded(true)
        if (!rightTab) setRightTab("docs")
      }
    } else {
      // Always minimize sidebar when no request is selected
      setRightSidebarExpanded(false)
      setRightTab(null)
      setUserMinimizedSidebar(false) // Reset user preference when no request
      setHasUserInteractedWithSidebar(false) // Reset interaction tracking
    }
  }, [selected, rightTab, userMinimizedSidebar, hasUserInteractedWithSidebar])

  // Function to open a request in a new tab or switch to existing tab
  const openRequestTab = useCallback(async (request: Extract<TreeNode, { type: "request" }>) => {
    console.log('🚀 openRequestTab called with request:', request)
    console.log('🔑 Request has key:', !!request.key, 'Key value:', request.key)
    
    const existingTabIndex = openTabs.findIndex(tab => tab.id === request.id)
    
    if (existingTabIndex >= 0) {
      // Tab already exists, just switch to it
      console.log('↪️ Switching to existing tab')
      setActiveTabId(request.id)
    } else {
      console.log('🆕 Creating new tab for request')
      // If request has a key, fetch details from backend
      let enrichedRequest = request
      if (request.key) {
        setIsLoadingApiDetails(true)
        try {
          console.log(`Fetching API details for key: ${request.key}`)
          const response = await fetch(`https://0shfds9x-4001.inc1.devtunnels.msapi/apis/key/${request.key}`)
          
          if (response.ok) {
            const apiResponse = await response.json()
            console.log('🎯 API response received:', apiResponse)
            
            // Extract the actual API data from the nested response
            const apiData = apiResponse.data || apiResponse
            console.log('📋 API data extracted:', apiData)
            
            // Enrich the request with backend data
            enrichedRequest = {
              ...request,
              urlRaw: apiData.url || request.urlRaw,
              method: apiData.method || request.method,
              headers: apiData.headers || request.headers || [],
              bodyMode: apiData.body?.mode || request.bodyMode || 'raw',
              bodyRaw: apiData.body?.raw || request.bodyRaw || '',
              description: apiData.description || request.description,
              sampleResponse: apiData.sampleResponse || apiData.sample_response || request.sampleResponse,
              // Add query params and auth data for the request editor
              queryParams: apiData.query || [],
              authType: apiData.source?.auth_kind || 'none',
              authData: apiData.source?.headers?.auth_data || {},
            }
            
            console.log('✨ Request enriched with backend data:', enrichedRequest)
          } else {
            console.warn(`Failed to fetch API details for key ${request.key}:`, response.status)
            // Still create the tab with basic data even if API fetch fails
          }
        } catch (error) {
          console.error(`Error fetching API details for key ${request.key}:`, error)
        } finally {
          setIsLoadingApiDetails(false)
        }
      }
      
      // Create new tab with enriched data
      setOpenTabs(prev => [...prev, enrichedRequest])
      setActiveTabId(request.id)
    }
  }, [openTabs])

  // Function to close a tab
  const closeTab = useCallback((tabId: string) => {
    // Check if tab has unsaved changes
    if (unsavedTabs.has(tabId)) {
      const shouldClose = window.confirm('This tab has unsaved changes. Are you sure you want to close it?')
      if (!shouldClose) return
    }

    setOpenTabs(prev => {
      const newTabs = prev.filter(tab => tab.id !== tabId)
      
      // If we're closing the active tab, switch to another tab
      if (activeTabId === tabId) {
        if (newTabs.length > 0) {
          setActiveTabId(newTabs[newTabs.length - 1].id)
        } else {
          setActiveTabId(null)
        }
      }
      
      return newTabs
    })

    // Remove from unsaved tabs
    setUnsavedTabs(prev => {
      const newSet = new Set(prev)
      newSet.delete(tabId)
      return newSet
    })
  }, [activeTabId, unsavedTabs])

  // Function to update a request in the tabs
  const updateRequestInTab = useCallback((updatedRequest: Extract<TreeNode, { type: "request" }>) => {
    setOpenTabs(prev => prev.map(tab => 
      tab.id === updatedRequest.id ? { ...tab, ...updatedRequest } : tab
    ))
    // Mark tab as unsaved when it's updated
    setUnsavedTabs(prev => new Set(prev).add(updatedRequest.id))
  }, [])

  // Function to mark a tab as saved
  const markTabAsSaved = useCallback((tabId: string) => {
    setUnsavedTabs(prev => {
      const newSet = new Set(prev)
      newSet.delete(tabId)
      return newSet
    })
  }, [])

  // Function to save a request
  const saveRequest = useCallback(async (request: Extract<TreeNode, { type: "request" }>) => {
    try {
      // Build the save payload matching the format from request-editor
      const savePayload = {
        name: request.name,
        key: request.id,
        description: request.description || "",
        url: request.urlRaw || null,
        base_url: null,
        path: null,
        method: request.method,
        timeout: 30000,
        headers: request.headers || [],
        query: [], // You might want to extract query params from URL
        body: { 
          mode: request.bodyMode || "raw", 
          raw: request.bodyRaw || "" 
        },
        response_schema: {},
        sample_response: request.sampleResponse ?? {},
        token_api: null,
        mapper_algorithm: "custom_dsl",
        related_collections: [],
        requested_schema_style: {},
        source: {
          base_url: null,
          entity: null,
          auth_kind: "bearer", // Default to bearer, you might want to make this dynamic
          headers: {},
        },
        tags: [],
      }

      console.log('Saving request to API:', `${API_BASE_URL}${SAVE_API_ENDPOINT}`, savePayload)
      
      // Call the actual save API
      const response = await fetch(`${API_BASE_URL}${SAVE_API_ENDPOINT}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // Add any additional headers if needed (auth, etc.)
        },
        body: JSON.stringify(savePayload)
      })

      const responseData = await response.json()
      
      if (response.ok) {
        // Mark as saved after successful save
        markTabAsSaved(request.id)
        console.log('Request saved successfully:', responseData)
        
        return true
      } else {
        console.error('Failed to save request:', responseData)
        showToast(`❌ Failed to save "${request.name}": ${responseData.message || 'Unknown error'}`, 'error', responseData)
        return false
      }
    } catch (error) {
      console.error('Error saving request:', error)
      showToast(`❌ Network error saving "${request.name}": ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
      return false
    }
  }, [markTabAsSaved])

  // Toast notification function
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success', data?: any) => {
    if (typeof window === 'undefined') return
    
    const toast = document.createElement('div')
    const isSuccess = type === 'success'
    
    toast.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${isSuccess ? '#10b981' : '#ef4444'};
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        z-index: 9999;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 400px;
        word-wrap: break-word;
        font-family: system-ui, -apple-system, sans-serif;
      ">
        <div style="font-weight: 500; margin-bottom: 4px;">
          ${message}
        </div>
        ${data ? `<details style="margin-top: 8px; font-size: 12px; opacity: 0.9;">
          <summary style="cursor: pointer;">View response</summary>
          <pre style="margin-top: 4px; font-size: 11px; background: rgba(255,255,255,0.1); padding: 8px; border-radius: 4px; overflow: auto; max-height: 200px;">${JSON.stringify(data, null, 2)}</pre>
        </details>` : ''}
      </div>
    `
    
    document.body.appendChild(toast)
    
    // Auto remove after 5 seconds (longer to allow reading response)
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove()
      }
    }, 5000)
    
    // Allow manual close on click
    toast.addEventListener('click', () => {
      if (toast.parentNode) {
        toast.remove()
      }
    })
  }, [])

  const { data: remoteData, isLoading } = useSWR(COLLECTIONS_URL, fetcher)

  // Keyboard shortcuts for tab management
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S to save current tab
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && activeTabId) {
        e.preventDefault()
        const activeTab = openTabs.find(tab => tab.id === activeTabId)
        if (activeTab) {
          saveRequest(activeTab)
        }
      }
      
      // Cmd/Ctrl + W to close current tab
      if ((e.metaKey || e.ctrlKey) && e.key === 'w' && activeTabId) {
        e.preventDefault()
        closeTab(activeTabId)
      }
      
      // Cmd/Ctrl + T to create a new tab (you could implement this later)
      // Cmd/Ctrl + 1-9 to switch between tabs
      if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '9') {
        e.preventDefault()
        const tabIndex = parseInt(e.key) - 1
        if (openTabs[tabIndex]) {
          setActiveTabId(openTabs[tabIndex].id)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTabId, openTabs, closeTab, saveRequest])

  useEffect(() => {
    if (!remoteData) return
    const items = Array.isArray(remoteData)
      ? remoteData
      : Array.isArray(remoteData?.items)
        ? remoteData.items
        : Array.isArray(remoteData?.item)
          ? remoteData.item
          : []
    const info = remoteData?.info || collection.info || { name: "Workspace" }
    console.log("🔥 Collections API returned items:", items)
    console.log("🔑 Items with keys:", items.filter((item: any) => item.key))
    console.log("📊 Raw remoteData structure:", {
      isArray: Array.isArray(remoteData),
      hasItems: !!remoteData?.items,
      hasItem: !!remoteData?.item,
      keys: Object.keys(remoteData || {}),
      firstItem: items[0]
    })
    setCollection({ info, item: items })
  }, [remoteData])

  const [sidebarApi, setSidebarApi] = useState<{
    patchRequest: (id: string, patch: Partial<Extract<TreeNode, { type: "request" }>>) => void
  } | null>(null)

  const handleExposeApi = useCallback(
    (api: { patchRequest: (id: string, patch: Partial<Extract<TreeNode, { type: "request" }>>) => void }) => {
      setSidebarApi(api)
    },
    [],
  )

  const saveTimerRef = useRef<number | null>(null)
  const queueBulkUpdate = useCallback((next: { info?: any; item: any[] }) => {
    // Ensure all items have consistent keys before updating
    const itemsWithKeys = updateCollectionKeys(next.item)
    const collectionWithKeys = { ...next, item: itemsWithKeys }
    
    setCollection(collectionWithKeys)
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    saveTimerRef.current = window.setTimeout(async () => {
      try {
        console.log("Sending bulk update with consistent keys:", { items: itemsWithKeys })
        await fetch(BULK_UPDATE_URL, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ items: itemsWithKeys }),
        })
      } catch {}
    }, 600)
  }, [])

  // Right sidebar expand/collapse state - start minimized by default
  const [rightSidebarExpanded, setRightSidebarExpanded] = useState(false)
  const rightSidebarWidth = rightSidebarExpanded ? 400 : 60

  const handleMinimize = () => {
    setRightSidebarExpanded(false)
    setRightTab(null)
    setUserMinimizedSidebar(true) // Track that user manually minimized
    setHasUserInteractedWithSidebar(true) // Track that user has interacted with sidebar
  }

  const handleMaximize = () => {
    if (selected) {
      setRightSidebarExpanded(true)
      if (!rightTab) setRightTab("docs")
      setUserMinimizedSidebar(false) // Reset user minimized state when manually expanding
      setHasUserInteractedWithSidebar(true) // Track that user has interacted with sidebar
    }
  }

  return (
    <main className="h-dvh w-dvw flex overflow-hidden">
      <SecondarySidebar
        collection={collection as any}
        onChange={queueBulkUpdate}
        onSelect={(req) => openRequestTab(req)}
        onExposeApi={handleExposeApi}
        selectedId={selected?.id}
        loading={isLoading}
        environmentVariables={variables}
        onUpdateEnvironment={updateVariables}
      />

      <section className="flex-1 border-l bg-card overflow-hidden flex flex-col">
        {/* Tab Bar */}
        {openTabs.length > 0 && (
          <div className="border-b bg-background">
            <div className="flex items-center overflow-x-auto">
              {openTabs.map((tab) => (
                <div
                  key={tab.id}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 border-r cursor-pointer min-w-0 max-w-60 group relative",
                    activeTabId === tab.id
                      ? "bg-card text-foreground border-b-2 border-b-blue-500"
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  <span
                    className={cn(
                      "inline-flex h-5 w-10 items-center justify-center rounded text-[10px] font-mono font-semibold flex-shrink-0",
                      tab.method === "GET" && "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
                      tab.method === "POST" && "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
                      tab.method === "PUT" && "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
                      tab.method === "DELETE" && "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
                      tab.method === "PATCH" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
                      tab.method === "HEAD" && "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
                      tab.method === "OPTIONS" && "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    )}
                  >
                    {tab.method}
                  </span>
                  <span className="text-sm truncate flex-1 min-w-0 flex items-center gap-1">
                    {tab.name}
                    {unsavedTabs.has(tab.id) && (
                      <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" title="Unsaved changes" />
                    )}
                  </span>
                  <button
                    className="ml-2 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      closeTab(tab.id)
                    }}
                    title="Close tab"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Request Editor */}
        <div className="flex-1 overflow-hidden">
          {selected ? (
            <RequestEditor
              selected={selected}
              onPatch={(patch) => {
                if (!selected) return
                const updatedRequest = { ...selected, ...patch }
                sidebarApi?.patchRequest(selected.id, patch)
                updateRequestInTab(updatedRequest)
              }}
              response={response}
              onResponseChange={setResponse}
              isLoadingApiDetails={isLoadingApiDetails}
              onLogRequest={logRequest}
              onLogResponse={logResponse}
              onLogError={logError}
              replaceVariables={replaceVariables}
              hasVariables={hasVariables}
              onSaveSampleResponse={(sample) => {
                if (!selected) return
                const updatedRequest = { ...selected, sampleResponse: sample }
                sidebarApi?.patchRequest(selected.id, { sampleResponse: sample })
                updateRequestInTab(updatedRequest)
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">No request selected</h3>
                <p className="text-sm">Select a request from the sidebar to get started</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <aside
        style={{ width: `${rightSidebarWidth}px`, minWidth: `${rightSidebarWidth}px` }}
        className="flex-none overflow-hidden"
      >
        <RightSidebar
          request={selected}
          onUpdateDescription={(desc) => {
            if (!selected) return
            const updatedRequest = { ...selected, description: desc }
            sidebarApi?.patchRequest(selected.id, { description: desc })
            updateRequestInTab(updatedRequest)
          }}
          onMinimize={handleMinimize}
          onMaximize={handleMaximize}
          width={rightSidebarWidth}
          activeTab={rightTab || "docs"}
        />
      </aside>

      {/* Console Panel */}
      <ConsolePanel 
        entries={consoleEntries}
        onClear={clearEntries}
      />
    </main>
  )
}
