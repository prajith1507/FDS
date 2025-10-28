"use client"

import { useMemo, useState, useEffect } from "react"
import { ChevronDown, Settings } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import type { TreeNode } from "./tree-utils"
import { cn } from "@/lib/utils"
import { BodyModeChip } from "./body-mode-chip"
import { ResponsePanel, type ResponseInfo } from "./response-panel"
import { KeyValueTable } from "./key-value-table"
import { AuthorizationPanel } from "./authorization-panel"
import { SettingsPanel } from "./settings-panel"
import { Splitter } from "./splitter"
import { useResizable } from "@/hooks/use-resizable"
import { useToast } from "@/hooks/use-toast"
import { generateApiKey } from "@/lib/key-utils"

const METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"] as const

type RequestEditorProps = {
  selected: Extract<TreeNode, { type: "request" }> | null
  onPatch: (patch: Partial<Extract<TreeNode, { type: "request" }>>) => void
  response: ResponseInfo | null
  onResponseChange: (response: ResponseInfo | null) => void
  isLoadingApiDetails?: boolean
  onSaveSampleResponse?: (sample: any) => void
  onLogRequest?: (method: string, url: string, headers?: Record<string, string>) => void
  onLogResponse?: (method: string, url: string, status: number, statusText: string, timeMs: number, requestHeaders?: Record<string, string>, responseHeaders?: Record<string, string>) => void
  onLogError?: (method: string, url: string, error: string, timeMs: number, requestHeaders?: Record<string, string>) => void
  replaceVariables?: (text: string) => string
  hasVariables?: (text: string) => boolean
}

export function RequestEditor(props: RequestEditorProps) {
  const {
    selected,
    onPatch,
    response,
    onResponseChange,
    isLoadingApiDetails,
    onSaveSampleResponse,
    onLogRequest,
    onLogResponse,
    onLogError,
    replaceVariables,
    hasVariables
  } = props;

  // Restore handleBeautify for the Beautify button
  const handleBeautify = () => {
    if (!selected?.bodyRaw) return
    try {
      const pretty = JSON.stringify(JSON.parse(selected.bodyRaw), null, 2)
      onPatch({ bodyRaw: pretty })
    } catch {
      // ignore if not JSON
    }
  }

  // Restore handleSend for the Send button
  const handleSend = async () => {
    if (!selected || !selected.urlRaw) {
      toast({
        title: "Error",
        description: "Please enter a URL",
        variant: "destructive"
      })
      return
    }

    setSending(true)
    const startTime = Date.now()

    // Build headers outside try block so it's accessible in catch
    const headers: Record<string, string> = {}

    try {
      // Build the complete URL with query params
      let fullUrl = selected.urlRaw
      const enabledParams = queryParams.filter(p => p.key && p.enabled !== false)
      if (enabledParams.length > 0) {
        const queryString = enabledParams.map(p => 
          `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value || '')}`
        ).join('&')
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString
      }

      // Build headers - populate the headers object declared above
      
      // Add headers from the headers table
      if (selected.headers) {
        selected.headers.forEach((h: any) => {
          if (h.key && h.enabled !== false) {
            headers[h.key] = replaceVariables ? replaceVariables(h.value || '') : (h.value || '')
          }
        })
      }

      // Add auth headers
      if (authType === 'basic' && authData.username && authData.password) {
        const encoded = btoa(`${authData.username}:${authData.password}`)
        headers['Authorization'] = `Basic ${encoded}`
      } else if (authType === 'bearer' && authData.token) {
        headers['Authorization'] = `Bearer ${authData.token}`
      } else if (authType === 'api-key' && authData.key) {
        if (authData.addTo === 'header') {
          headers[authData.keyName || 'X-API-Key'] = authData.key
        }
      }

      // Prepare request options
      const requestOptions: RequestInit = {
        method: selected.method,
        headers
      }

      // Add body for methods that support it
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(selected.method)) {
        if (selected.bodyMode === 'raw' && selected.bodyRaw) {
          requestOptions.body = replaceVariables ? replaceVariables(selected.bodyRaw) : selected.bodyRaw
          if (!headers['Content-Type']) {
            headers['Content-Type'] = 'application/json'
          }
        }
      }

      // Log the request
      if (onLogRequest) {
        onLogRequest(selected.method, fullUrl, headers)
      }

      // Use proxy endpoint to avoid CORS issues
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(fullUrl)}`
      
      const response = await fetch(proxyUrl, {
        method: selected.method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: requestOptions.body
      })

      const duration = Date.now() - startTime
      const responseData = await response.json()

      // Handle API errors with enhanced messaging
      if (!response.ok) {
        const errorData = responseData;
        
        // Log the error response
        if (onLogError) {
          onLogError(
            selected.method, 
            fullUrl, 
            errorData.error || `HTTP ${response.status}`, 
            duration, 
            headers
          )
        }

        // Show enhanced error message with suggestions
        let toastDescription = errorData.error || `Request failed with status ${response.status}`;
        if (errorData.suggestions && errorData.suggestions.length > 0) {
          toastDescription += '\n\n' + errorData.suggestions.join('\n');
        }

        toast({
          title: "Request Failed",
          description: toastDescription,
          variant: "destructive"
        })

        // Update response with error details
        if (onResponseChange) {
          onResponseChange({
            ok: false,
            status: response.status,
            statusText: response.statusText,
            timeMs: duration,
            sizeBytes: JSON.stringify(errorData).length,
            headers: errorData.headers || Object.fromEntries(response.headers.entries()),
            body: errorData,
            error: errorData.error
          })
        }
        return;
      }

      // Log the response
      if (onLogResponse) {
        onLogResponse(
          selected.method,
          fullUrl,
          response.status,
          response.statusText,
          duration,
          headers,
          Object.fromEntries(response.headers.entries())
        )
      }

      // Update response state
      if (onResponseChange) {
        onResponseChange({
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          timeMs: duration,
          sizeBytes: JSON.stringify(responseData).length,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseData
        })
      }

      toast({
        title: "Success",
        description: `Request completed in ${duration}ms`
      })

    } catch (error: any) {
      const duration = Date.now() - startTime
      
      // Enhanced error handling
      let errorMessage = error.message;
      let suggestions: string[] = [];

      // Handle specific error types
      if (error.message.includes('fetch')) {
        errorMessage = 'Network error - could not reach the API';
        suggestions.push('💡 Check:');
        suggestions.push('   • URL is correct and accessible');
        suggestions.push('   • API server is running');
        suggestions.push('   • No network connectivity issues');
      } else if (error.message.includes('CORS')) {
        errorMessage = 'CORS error - API does not allow browser requests';
        suggestions.push('💡 This API might:');
        suggestions.push('   • Require authentication to bypass CORS');
        suggestions.push('   • Only allow requests from specific domains');
        suggestions.push('   • Block all browser-based requests');
      }
      
      if (onLogError) {
        onLogError(selected.method, selected.urlRaw, errorMessage, duration, headers)
      }

      // Show error with suggestions
      let toastDescription = errorMessage;
      if (suggestions.length > 0) {
        toastDescription += '\n\n' + suggestions.join('\n');
      }

      toast({
        title: "Request Failed",
        description: toastDescription,
        variant: "destructive"
      })

      // Update response with error
      if (onResponseChange) {
        onResponseChange({
          ok: false,
          status: 0,
          statusText: 'Error',
          timeMs: duration,
          sizeBytes: 0,
          headers: {},
          body: { 
            error: errorMessage,
            suggestions: suggestions.length > 0 ? suggestions : undefined
          },
          error: errorMessage
        })
      }
    } finally {
      setSending(false)
    }
  }
  const { toast } = useToast()
  const [queryParams, setQueryParams] = useState<
    Array<{ key: string; value: string; description?: string; enabled?: boolean }>
  >([])
  const [authType, setAuthType] = useState<"none" | "basic" | "bearer" | "api-key">("none")
  const [authData, setAuthData] = useState<Record<string, string>>({})
  const [settings, setSettings] = useState<any>({
    httpVersion: "HTTP/1.x",
    sslVerification: false,
    followRedirects: true,
    followOriginalMethod: false,
    followAuthHeader: false,
    removeRefererHeader: false,
    strictParser: false,
    encodeUrl: true,
  })

  // Helper function to generate Authorization header based on auth type and data
  const generateAuthorizationHeader = (type: typeof authType, data: Record<string, string>) => {
    switch (type) {
      case "basic":
        if (data.username && data.password) {
          const encoded = btoa(`${data.username}:${data.password}`)
          return `Basic ${encoded}`
        }
        return null
      case "bearer":
        if (data.token) {
          return `Bearer ${data.token}`
        }
        return null
      case "api-key":
        // API Key goes to custom header, not Authorization header
        return null
      default:
        return null
    }
  }

  // Helper function to update headers with/without authorization
  const updateHeadersWithAuth = (headers: any[], type: typeof authType, data: Record<string, string>) => {
    // Remove existing Authorization header
    let filteredHeaders = headers.filter(h => h.key?.toLowerCase() !== 'authorization')
    
    // For API Key, also remove the existing API key header if switching away from API key
    if (type !== "api-key") {
      // Find any existing API key headers and remove them
      const existingApiKeyHeaders = headers.filter(h => 
        h.description === 'Auto-generated from Authorization tab' && h.key !== 'Authorization'
      )
      existingApiKeyHeaders.forEach(apiKeyHeader => {
        filteredHeaders = filteredHeaders.filter(h => h.key !== apiKeyHeader.key)
      })
    }
    
    // Add new Authorization header if needed
    const authHeader = generateAuthorizationHeader(type, data)
    if (authHeader) {
      filteredHeaders.push({
        key: 'Authorization',
        value: authHeader,
        description: 'Auto-generated from Authorization tab',
        enabled: true
      })
    }

    // Handle API Key separately
    if (type === "api-key" && data.key && data.addTo === 'header') {
      const keyName = data.keyName || 'X-API-Key'
      // Remove existing API key header with the same name if it exists
      filteredHeaders = filteredHeaders.filter(h => h.key !== keyName)
      // Add API key header
      filteredHeaders.push({
        key: keyName,
        value: data.key,
        description: 'Auto-generated from Authorization tab',
        enabled: true
      })
    }

    return filteredHeaders
  }
  const [localBodyMode, setLocalBodyMode] = useState<
    "none" | "form-data" | "x-www-form-urlencoded" | "raw" | "binary" | "GraphQL"
  >((selected?.bodyMode as any) || "raw")
  // Local headers state used to reflect pasted headers immediately
  const [localHeaders, setLocalHeaders] = useState<any[]>((selected?.headers as any[]) || [])

  const headersCount = (localHeaders?.length ?? (selected?.headers?.length || 0))
  const currentBodyMode = localBodyMode
  // Local URL state to reflect pasted/trimmed URL immediately
  const [localUrl, setLocalUrl] = useState<string>(selected?.urlRaw || "")
  const paramsCount = queryParams.filter(p => p.key && p.enabled !== false).length
  const hasAuth = authType !== "none" && (
    (authType === "basic" && authData.username && authData.password) ||
    (authType === "bearer" && authData.token) ||
    (authType === "api-key" && authData.key)
  )

  const [sending, setSending] = useState(false)

  const responseResize = useResizable({
    axis: "y",
    initial: 300,
    min: 150,
    max: 600,
    storageKey: "postman-response-height",
    inverse: true, // Inverse drag: dragging down decreases response panel size
  })

  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        if (!selected) return
        
        // Prepare authorization data in the correct format for bulk update
        let authorizationArray: any[] = []
        
        // Use local state values which are always up-to-date from AuthorizationPanel
        const currentAuthType = authType
        const currentAuthData = authData
        
        console.log("=== AUTHORIZATION DEBUG ===")
        console.log("Save Debug - currentAuthType:", currentAuthType, "currentAuthData:", currentAuthData)
        console.log("Save Debug - selected.authType:", (selected as any)?.authType, "selected.authData:", (selected as any)?.authData)
        console.log("Save Debug - local authType:", authType, "local authData:", authData)
        console.log("============================")
        
        // Check if we have any authorization data at all
        const hasAuthData = (
          (currentAuthType && currentAuthType !== "none") &&
          (currentAuthData && Object.keys(currentAuthData).length > 0)
        )
        
        if (hasAuthData) {
          const authEntry = {
            authType: currentAuthType,
            authData: currentAuthData,
            enabled: true
          }
          authorizationArray.push(authEntry)
          console.log("✅ Authorization configured:", authEntry)
        } else {
          console.log("❌ No auth configured - currentAuthType:", currentAuthType, "currentAuthData:", currentAuthData)
          console.log("❌ hasAuthData check failed:", {
            authTypeValid: currentAuthType && currentAuthType !== "none",
            authDataValid: currentAuthData && Object.keys(currentAuthData).length > 0,
            currentAuthType,
            currentAuthData
          })
        }
        
        console.log("Save Debug - authType:", authType, "authData:", authData)
        console.log("Full save payload being prepared...")
        
        const finalPayload = {
          name: selected.name,
          request: {
            method: selected.method,
            header: selected.headers || [],
            body: { 
              mode: selected.bodyMode || "raw", 
              raw: selected.bodyRaw || "" 
            },
            url: (() => {
              try {
                if (!selected.urlRaw) {
                  return {
                    raw: "",
                    host: [],
                    path: [],
                    query: queryParams.map(param => ({
                      key: param.key,
                      value: param.value,
                      description: param.description || "",
                      disabled: param.enabled === false
                    }))
                  }
                }
                
                const url = new URL(selected.urlRaw)
                return {
                  raw: selected.urlRaw,
                  host: [url.hostname],
                  path: url.pathname.split('/').filter(Boolean),
                  query: queryParams.map(param => ({
                    key: param.key,
                    value: param.value,
                    description: param.description || "",
                    disabled: param.enabled === false
                  }))
                }
              } catch (e) {
                // If URL parsing fails, just use raw format
                return {
                  raw: selected.urlRaw || "",
                  host: [],
                  path: [],
                  query: queryParams.map(param => ({
                    key: param.key,
                    value: param.value,
                    description: param.description || "",
                    disabled: param.enabled === false
                  }))
                }
              }
            })(),
            Authorization: authorizationArray  // ✅ Correct format!
          },
          description: selected.description || "",
          sampleResponse: selected.sampleResponse || null,
          key: selected.key || generateApiKey(selected.name)
        }
        
        console.log("=== BULK UPDATE PAYLOAD ===")
        console.log("Final payload:", JSON.stringify(finalPayload, null, 2))
        console.log("Authorization array length:", authorizationArray.length)
        console.log("Authorization array:", authorizationArray)
        console.log("Request.Authorization:", finalPayload.request.Authorization)
        console.log("=============================")
        
        // Make API call directly
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${process.env.NEXT_PUBLIC_SAVE_API_ENDPOINT}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(finalPayload)
          })
          
          if (response.ok) {
            const result = await response.json()
            console.log('API request saved successfully:', result)
            
            // Show success message with auth info
            let authInfo = ""
            if (authorizationArray.length > 0) {
              const authEntry = authorizationArray[0]
              if (authEntry.authType === "basic") {
                authInfo = ` (with Basic Auth: ${authEntry.authData?.username})`
              } else if (authEntry.authType === "bearer") {
                authInfo = ` (with Bearer Token)`
              } else if (authEntry.authType === "api-key") {
                authInfo = ` (with API Key: ${authEntry.authData?.keyName || 'X-API-Key'})`
              } else {
                authInfo = ` (with ${authEntry.authType} auth)`
              }
            }
            
            toast({
              title: "Success",
              description: `API request saved successfully${authInfo}`,
            })
          } else {
            console.error('Failed to save API request:', response.status, response.statusText)
            toast({
              title: "Error",
              description: "Failed to save API request",
              variant: "destructive",
            })
          }
        } catch (error) {
          console.error('Error saving API request:', error)
          toast({
            title: "Error", 
            description: "Error saving API request",
            variant: "destructive",
          })
        }
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [selected, queryParams, authType, authData])

  useEffect(() => {
    // sync when selection changes externally
    setLocalBodyMode((selected?.bodyMode as any) || "raw")
    // sync local headers when selection changes
    setLocalHeaders((selected?.headers as any[]) || [])
    // sync local url when selection changes
    setLocalUrl(selected?.urlRaw || "")
  }, [selected?.id, selected?.bodyMode])

  // Populate auth and query params from backend data when request changes
  useEffect(() => {
    console.log('🔄 RequestEditor: Processing selected request:', selected)

    if (!selected) {
      // Clear all state when no request is selected
      setQueryParams([])
      setAuthType("none")
      setAuthData({})
      return
    }

    // Populate query params if available from backend
    if ((selected as any).queryParams) {
      console.log('🔗 Setting query params:', (selected as any).queryParams)
      setQueryParams((selected as any).queryParams)
    } else {
      setQueryParams([])
    }

    // Populate auth data if available from backend (new format)
    if ((selected as any).authType && (selected as any).authData) {
      const authType = (selected as any).authType
      const authData = (selected as any).authData
      
      console.log('🔐 Setting auth data:', { authType, authData })
      setAuthType(authType)
      setAuthData(authData)
    } 
    // Fallback to old format for backward compatibility
    else if ((selected as any).authConfig) {
      const authConfig = (selected as any).authConfig
      setAuthType(authConfig.type || "none")
      
      if (authConfig.type === "basic") {
        setAuthData({
          username: authConfig.username || "",
          password: authConfig.password || "",
        })
      } else if (authConfig.type === "bearer") {
        setAuthData({
          token: authConfig.token || "",
        })
      } else if (authConfig.type === "api-key") {
        setAuthData({
          key: authConfig.key || "",
          keyName: authConfig.keyName || "X-API-Key",
          addTo: authConfig.addTo || "header",
        })
      } else {
        setAuthData({})
      }
    } else {
      // Clear auth state if no auth config is present
      setAuthType("none")
      setAuthData({})
    }
  }, [selected?.id, (selected as any)?.queryParams, (selected as any)?.authConfig])

  // Parse a pasted curl command and extract URL and headers
  const parseCurlCommand = (text: string) => {
    try {
      // Normalize the curl command
      let curlText = text.trim()
      
      const headers: Array<{ key: string; value: string }> = []
      let url = ""

      // Extract headers first (--header or -H)
      const headerRegex = /(?:--header|-H)\s+['"]([^:]+):\s*([^'"]+)['"]/gi
      let headerMatch
      while ((headerMatch = headerRegex.exec(curlText)) !== null) {
        headers.push({ 
          key: headerMatch[1].trim(), 
          value: headerMatch[2].trim() 
        })
      }
      
      // Remove curl command, --location/-L
      curlText = curlText.replace(/^curl\s+/i, '')
      curlText = curlText.replace(/(?:--location|-L)\s+/gi, '')
      curlText = curlText.replace(/\\\s*\n/g, ' ') // Remove line continuations
      
      // Remove all header flags
      curlText = curlText.replace(/(?:--header|-H)\s+['"][^'"]+['"]/gi, '')
      
      // Remove all backslashes (ignore shell escaping)
      curlText = curlText.replace(/\\/g, '')
      
      curlText = curlText.trim()
      
      // Now extract the URL - match from first quote to last quote
      // After removing backslashes, '\'' becomes ''
      
      // Find the first quote and the last quote, capture everything in between
      const firstQuoteIndex = curlText.indexOf("'")
      if (firstQuoteIndex !== -1) {
        const lastQuoteIndex = curlText.lastIndexOf("'")
        if (lastQuoteIndex > firstQuoteIndex) {
          url = curlText.substring(firstQuoteIndex + 1, lastQuoteIndex)
          // After removing backslashes, '\'' becomes ''
          // Replace pairs of single quotes with just one single quote
          // This handles Company(''value'') -> Company('value')
          while (url.includes("''")) {
            url = url.replace(/''/g, "'")
          }
        }
      } else {
        // Try double quotes
        const firstDoubleQuote = curlText.indexOf('"')
        if (firstDoubleQuote !== -1) {
          const lastDoubleQuote = curlText.lastIndexOf('"')
          if (lastDoubleQuote > firstDoubleQuote) {
            url = curlText.substring(firstDoubleQuote + 1, lastDoubleQuote)
          }
        } else {
          // No quotes - take the URL directly
          const bareUrl = curlText.match(/https?:\/\/[^\s]+/i);
          if (bareUrl) {
            url = bareUrl[0]
          }
        }
      }

      // Clean up the URL
      if (url) {
        url = url.trim()
      }

      return { url, headers }
    } catch (e) {
      console.error('Curl parsing error:', e)
      return { url: "", headers: [] }
    }
  }

  return (
    <section className="h-full flex flex-col overflow-hidden relative">
      {isLoadingApiDetails && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            Loading API details...
          </div>
        </div>
      )}
      
      <div className="px-3 py-2 border-b flex-shrink-0">
        <Input
          className="h-8 bg-card max-w-md"
          placeholder="Request title"
          value={selected?.name || ""}
          onChange={(e) => onPatch({ name: e.target.value })}
          aria-label="Request title"
        />
      </div>

      <header className="min-h-14 border-b flex flex-wrap items-center gap-2 px-3 py-2 flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "h-9 min-w-16 rounded-md px-3 text-sm font-medium inline-flex items-center justify-between gap-2",
                "bg-muted/60 hover:bg-muted/70",
              )}
              aria-label="HTTP method"
            >
              <span className="font-mono">{selected?.method || "GET"}</span>
              <ChevronDown className="h-4 w-4 text-foreground/70" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            {METHODS.map((m) => (
              <DropdownMenuItem
                key={m}
                onSelect={(e) => {
                  e.preventDefault()
                  onPatch({ method: m })
                }}
              >
                {m}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="relative flex-1 min-w-[200px]">
          <Input
            placeholder="Enter request URL"
            value={localUrl || selected?.urlRaw || ""}
            onChange={(e) => { setLocalUrl(e.target.value); onPatch({ urlRaw: e.target.value }) }}
            onPaste={(e) => {
              const pasted = e.clipboardData?.getData('text') || ''
              if (!pasted) return

              if (/^curl\b/i.test(pasted)) {
                e.preventDefault()
                const { url, headers } = parseCurlCommand(pasted)
                if (url) { setLocalUrl(url); onPatch({ urlRaw: url }) }

                if (headers.length > 0) {
                  const existing = (selected?.headers || []).slice() as any[]
                  const merged = existing.slice()
                  headers.forEach(h => {
                    if (h.key.toLowerCase() === 'authorization') {
                      const v = h.value
                      if (/^Basic\s+/i.test(v)) {
                        const b = v.replace(/^Basic\s+/i, '').trim()
                        try {
                          const decoded = atob(b)
                          const [username, password] = decoded.split(':')
                          setAuthType('basic')
                          setAuthData({ username: username || '', password: password || '' })
                        } catch {
                          // if decode fails, still add header row
                          merged.push({ key: h.key, value: h.value })
                        }
                        // Also keep the Authorization header in headers table
                        merged.push({ key: h.key, value: h.value })
                      } else if (/^Bearer\s+/i.test(v)) {
                        const token = v.replace(/^Bearer\s+/i, '').trim()
                        setAuthType('bearer')
                        setAuthData({ token })
                        // Also keep the Authorization header in headers table
                        merged.push({ key: h.key, value: h.value })
                      } else {
                        merged.push({ key: h.key, value: h.value })
                      }
                    } else {
                      merged.push({ key: h.key, value: h.value })
                    }
                  })
                  // Update local headers immediately so UI reflects the paste without waiting for parent
                  try { setLocalHeaders(merged) } catch {}
                  onPatch({ headers: merged })

                  // Capture any Authorization header to forward when calling the server proxy
                  const authH = merged.find((r: any) => r.key && r.key.toLowerCase() === 'authorization')
                  const authHeaderValue = authH ? String(authH.value || '') : undefined

                  // After updating UI, attempt to fetch the URL via server proxy and populate headers table with returned data
                  ;(async () => {
                    try {
                      if (!url) return
                      const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`
                      const fetchOptions: RequestInit = { method: 'GET', headers: {} }
                      if (authHeaderValue) {
                        ;(fetchOptions.headers as any)['authorization'] = authHeaderValue
                      }

                      const res = await fetch(proxyUrl, fetchOptions)
                      if (!res.ok) return
                      const data = await res.json()

                      // Convert response JSON to key/value rows to populate Headers table
                      let rows: Array<{ key: string; value: string }> = []
                      if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
                        const first = data[0]
                        rows = Object.entries(first).map(([k, v]) => ({ key: k, value: typeof v === 'object' ? JSON.stringify(v) : String(v) }))
                      } else if (data && typeof data === 'object') {
                        rows = Object.entries(data).map(([k, v]) => ({ key: k, value: typeof v === 'object' ? JSON.stringify(v) : String(v) }))
                      }

                      if (rows.length > 0) {
                        setLocalHeaders(rows)
                        onPatch({ headers: rows })
                      }
                    } catch (err) {
                      // ignore fetch errors silently; proxy will log server-side
                    }
                  })()
                }
              }
            }}
            className={cn(
              "h-9 bg-card pr-8",
              hasVariables?.(localUrl || selected?.urlRaw || "") && "border-blue-300 bg-blue-50/50"
            )}
          />
          {hasVariables?.(localUrl || selected?.urlRaw || "") && (
            <div 
              className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 text-xs font-mono"
              title="Contains environment variables"
            >
              {"{{}}"}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            className="h-9 rounded-md bg-pm-brand px-4 text-sm font-semibold text-pm-on-brand hover:opacity-95"
            onClick={handleSend}
            disabled={sending}
          >
            {sending ? "Sending..." : "Send"}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Send options"
                className="h-9 w-9 rounded-md border grid place-items-center hover:bg-muted/50"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>Send and download</DropdownMenuItem>
              <DropdownMenuItem>Send with docs</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div
        className="flex-shrink-0 overflow-hidden transition-all duration-75 ease-out"
        style={{ height: `calc(100% - ${responseResize.size}px - 118px)` }}
      >
        <Tabs defaultValue="Body" className="h-full flex flex-col">
          <div className="border-b px-3 flex-shrink-0">
            <div className="flex flex-wrap items-center gap-4">
              <TabsList className="h-10 bg-transparent p-0">
                <TabsTrigger
                  value="Params"
                  className="h-10 data-[state=active]:border-b-2 data-[state=active]:border-pm-brand data-[state=active]:bg-transparent rounded-none flex items-center gap-1 bg-transparent"
                >
                  Params
                  {paramsCount > 0 && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="Authorization"
                  className="h-10 data-[state=active]:border-b-2 data-[state=active]:border-pm-brand data-[state=active]:bg-transparent rounded-none flex items-center gap-1 bg-transparent"
                >
                  Authorization
                  {hasAuth && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="Headers"
                  className="h-10 data-[state=active]:border-b-2 data-[state=active]:border-pm-brand data-[state=active]:bg-transparent rounded-none bg-transparent"
                >
                  Headers <span className="ml-1 text-foreground/60">({headersCount})</span>
                </TabsTrigger>
                <TabsTrigger
                  value="Body"
                  className="h-10 data-[state=active]:border-b-2 data-[state=active]:border-pm-brand data-[state=active]:bg-transparent rounded-none bg-transparent"
                >
                  Body
                </TabsTrigger>
                <TabsTrigger
                  value="Scripts"
                  className="h-10 data-[state=active]:border-b-2 data-[state=active]:border-pm-brand data-[state=active]:bg-transparent rounded-none bg-transparent"
                >
                  Scripts
                </TabsTrigger>
                <TabsTrigger
                  value="Settings"
                  className="h-10 data-[state=active]:border-b-2 data-[state=active]:border-pm-brand data-[state=active]:bg-transparent rounded-none bg-transparent"
                >
                  Settings
                </TabsTrigger>
              </TabsList>

              <div className="ml-auto flex items-center gap-4 text-xs">
                <button className="text-foreground/70 hover:text-foreground">Cookies</button>
                <div className="flex items-center gap-2">
                  <button className="text-foreground/70 hover:text-foreground inline-flex items-center gap-1">
                    <Settings className="h-3.5 w-3.5" />
                    Schema
                  </button>
                  <button className="text-pm-brand hover:opacity-90" onClick={handleBeautify}>
                    Beautify
                  </button>
                </div>
              </div>
            </div>
          </div>

          <TabsContent value="Params" className="flex-1 overflow-auto">
            <KeyValueTable title="Query Params" rows={queryParams} onChange={setQueryParams} />
          </TabsContent>

          <TabsContent value="Authorization" className="flex-1 overflow-auto">
            <AuthorizationPanel
              authType={authType}
              authData={authData}
              onChange={(type, data) => {
                console.log('🔐 Authorization changed:', { type, data })
                setAuthType(type)
                setAuthData(data)
                
                // Automatically update headers with authorization
                const updatedHeaders = updateHeadersWithAuth(localHeaders, type, data)
                console.log('📋 Updated headers:', updatedHeaders)
                setLocalHeaders(updatedHeaders)
                onPatch({ 
                  authType: type,
                  authData: data,
                  headers: updatedHeaders 
                })
              }}
            />
          </TabsContent>

          <TabsContent value="Headers" className="flex-1 overflow-auto">
            <KeyValueTable
              title={`Headers (${headersCount})`}
              rows={localHeaders || (selected?.headers || [])}
              onChange={(rows) => {
                setLocalHeaders(rows)
                onPatch({ headers: rows })
              }}
            />
          </TabsContent>

          <TabsContent value="Body" className="flex-1 overflow-hidden flex flex-col">
            <div className="px-3 py-2 flex flex-wrap items-center gap-4 flex-shrink-0 border-b">
              {/* Body mode radio buttons */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="bodyMode"
                    checked={currentBodyMode === "none"}
                    onChange={() => {
                      setLocalBodyMode("none")
                      onPatch({ bodyMode: "none" })
                    }}
                    className="w-4 h-4"
                  />
                  none
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="bodyMode"
                    checked={currentBodyMode === "form-data"}
                    onChange={() => {
                      setLocalBodyMode("form-data")
                      onPatch({ bodyMode: "form-data" })
                    }}
                    className="w-4 h-4"
                  />
                  form-data
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="bodyMode"
                    checked={currentBodyMode === "x-www-form-urlencoded"}
                    onChange={() => {
                      setLocalBodyMode("x-www-form-urlencoded")
                      onPatch({ bodyMode: "x-www-form-urlencoded" })
                    }}
                    className="w-4 h-4"
                  />
                  x-www-form-urlencoded
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="bodyMode"
                    checked={currentBodyMode === "raw"}
                    onChange={() => {
                      setLocalBodyMode("raw")
                      onPatch({ bodyMode: "raw" })
                    }}
                    className="w-4 h-4"
                  />
                  raw
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="bodyMode"
                    checked={currentBodyMode === "binary"}
                    onChange={() => {
                      setLocalBodyMode("binary")
                      onPatch({ bodyMode: "binary" })
                    }}
                    className="w-4 h-4"
                  />
                  binary
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="bodyMode"
                    checked={currentBodyMode === "GraphQL"}
                    onChange={() => {
                      setLocalBodyMode("GraphQL")
                      onPatch({ bodyMode: "GraphQL" })
                    }}
                    className="w-4 h-4"
                  />
                  GraphQL
                </label>
              </div>

              {currentBodyMode === "raw" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="ml-auto text-xs inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-muted/60 border">
                      JSON <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuItem>JSON</DropdownMenuItem>
                    <DropdownMenuItem>Text</DropdownMenuItem>
                    <DropdownMenuItem>XML</DropdownMenuItem>
                    <DropdownMenuItem>HTML</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className="flex-1 overflow-hidden">
              {currentBodyMode === "none" && (
                <div className="p-6 text-center text-muted-foreground">
                  <p>This request does not have a body.</p>
                </div>
              )}
              {currentBodyMode === "raw" && (
                <div className="h-full flex relative">
                  {/* Line numbers */}
                  <div className="w-12 bg-muted/30 border-r flex-shrink-0 relative">
                    <div className="absolute inset-0 p-2 font-mono text-xs text-muted-foreground leading-6 pointer-events-none">
                      {(selected?.bodyRaw || "\n").split('\n').map((_, index) => (
                        <div key={index} className="text-right pr-2 h-6">
                          {index + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Code editor */}
                  <div className="flex-1 relative">
                    <textarea
                      className="absolute inset-0 w-full h-full border-0 bg-transparent p-2 font-mono text-sm leading-6 resize-none outline-none"
                      placeholder="Enter request body"
                      value={selected?.bodyRaw || ""}
                      onChange={(e) => onPatch({ bodyRaw: e.target.value })}
                      aria-label="Body editor"
                      style={{ 
                        whiteSpace: "pre", 
                        wordBreak: "normal",
                        lineHeight: "1.5rem" // 24px to match line numbers
                      }}
                      onScroll={(e) => {
                        // Sync line numbers scroll with textarea scroll
                        const lineNumbers = e.currentTarget.parentElement?.previousElementSibling?.firstElementChild as HTMLElement
                        if (lineNumbers) {
                          lineNumbers.style.transform = `translateY(-${e.currentTarget.scrollTop}px)`
                        }
                      }}
                    />
                  </div>
                </div>
              )}
              {currentBodyMode === "form-data" && (
                <div className="h-full overflow-auto p-3">
                  <KeyValueTable title="Form Data" rows={[]} onChange={() => {}} showDescription={false} />
                </div>
              )}
              {currentBodyMode === "x-www-form-urlencoded" && (
                <div className="h-full overflow-auto p-3">
                  <KeyValueTable title="URL Encoded" rows={[]} onChange={() => {}} showDescription={false} />
                </div>
              )}
              {currentBodyMode === "binary" && (
                <div className="p-6">
                  <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 text-center">
                    <Input type="file" className="bg-card max-w-sm mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">Select a file to upload</p>
                  </div>
                </div>
              )}
              {currentBodyMode === "GraphQL" && (
                <div className="grid grid-cols-2 gap-4 h-full overflow-hidden p-3">
                  <div className="space-y-2 flex flex-col overflow-hidden">
                    <label className="text-xs font-medium text-foreground/70">QUERY</label>
                    <textarea
                      className="flex-1 rounded border bg-card p-3 font-mono text-sm leading-6 resize-none"
                      placeholder="Enter GraphQL query"
                      style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                    />
                  </div>
                  <div className="space-y-2 flex flex-col overflow-hidden">
                    <label className="text-xs font-medium text-foreground/70">GRAPHQL VARIABLES</label>
                    <textarea
                      className="flex-1 rounded border bg-card p-3 font-mono text-sm leading-6 resize-none overflow-auto"
                      placeholder="Enter variables"
                      style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="Scripts" className="flex-1 overflow-auto">
            <div className="p-4">
              <p className="text-sm text-foreground/60">
                Pre-request and Test scripts are not implemented in this clone yet.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="Settings" className="flex-1 overflow-auto">
            <SettingsPanel settings={settings} onChange={setSettings} />
          </TabsContent>
        </Tabs>
      </div>

      <Splitter orientation="horizontal" onPointerDown={responseResize.onPointerDown} />

      <div 
        className="flex-shrink-0 overflow-hidden transition-all duration-75 ease-out" 
        style={{ height: `${responseResize.size}px` }}
      >
        <ResponsePanel 
          response={response} 
          onSaveSampleResponse={onSaveSampleResponse} 
          savedSample={selected?.sampleResponse}
        />
      </div>
    </section>
  )
}
