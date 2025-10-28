"use client"
import { useState, useMemo } from "react"
import { JsonViewer } from "./json-viewer"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { AlertTriangle, Download, ExternalLink } from "lucide-react"

export type ResponseInfo = {
  ok: boolean
  status: number
  statusText: string
  timeMs: number
  sizeBytes: number
  headers: Record<string, string>
  body: any
  error?: string
}

type Props = {
  response: ResponseInfo | null
  onSaveSampleResponse?: (sample: any) => void
  savedSample?: any // Add saved sample prop to display existing samples
}

// Constants for handling large responses
const MAX_SAFE_SIZE = 1024 * 1024 // 1MB
const MAX_RENDER_SIZE = 100 * 1024 // 100KB for rendering
const MAX_ARRAY_ITEMS = 50
const MAX_OBJECT_KEYS = 100

// Function to estimate JSON size
function estimateJsonSize(data: any): number {
  try {
    return JSON.stringify(data).length
  } catch {
    return 0
  }
}

// Function to truncate large responses for safe rendering
function truncateForRendering(data: any, maxSize = MAX_RENDER_SIZE): any {
  const estimatedSize = estimateJsonSize(data)
  
  if (estimatedSize <= maxSize) {
    return data
  }
  
  // For large responses, create a heavily truncated version
  if (Array.isArray(data)) {
    const truncated = data.slice(0, Math.min(10, data.length)).map(item => 
      typeof item === 'object' ? truncateForRendering(item, maxSize / 10) : item
    )
    return {
      __truncated: true,
      __originalLength: data.length,
      __message: `Array truncated: showing 10 of ${data.length} items`,
      data: truncated
    }
  }
  
  if (typeof data === 'object' && data !== null) {
    const keys = Object.keys(data)
    const truncated: any = {
      __truncated: true,
      __originalKeys: keys.length,
      __message: `Object truncated: showing 10 of ${keys.length} properties`
    }
    
    keys.slice(0, 10).forEach(key => {
      truncated[key] = typeof data[key] === 'object' 
        ? truncateForRendering(data[key], maxSize / 10) 
        : data[key]
    })
    
    return truncated
  }
  
  return data
}

// Function to create a sample response by reducing large arrays
function createSampleResponse(data: any, maxArrayItems = 2): any {
  if (data === null || data === undefined) return data
  
  if (Array.isArray(data)) {
    // For arrays, keep only the first few items (maxArrayItems)
    if (data.length === 0) return data
    if (data.length <= maxArrayItems) return data.map(item => createSampleResponse(item, maxArrayItems))
    
    // Take first few items and add a comment about truncation
    const sample = data.slice(0, maxArrayItems).map(item => createSampleResponse(item, maxArrayItems))
    return sample
  }
  
  if (typeof data === 'object' && data !== null) {
    const result: any = {}
    // Limit the number of keys processed to avoid performance issues
    const keys = Object.keys(data)
    const maxKeys = 50 // Limit object keys to prevent slowness
    const keysToProcess = keys.length > maxKeys ? keys.slice(0, maxKeys) : keys
    
    for (const key of keysToProcess) {
      result[key] = createSampleResponse(data[key], maxArrayItems)
    }
    
    // Add indicator if keys were truncated
    if (keys.length > maxKeys) {
      result['_truncated'] = `... ${keys.length - maxKeys} more properties`
    }
    
    return result
  }
  
  return data
}

export function ResponsePanel({ response, onSaveSampleResponse, savedSample }: Props) {
  const [sampleDialogOpen, setSampleDialogOpen] = useState(false)
  const [viewSampleDialogOpen, setViewSampleDialogOpen] = useState(false)
  const [editableSample, setEditableSample] = useState("")
  const [isGeneratingSample, setIsGeneratingSample] = useState(false)
  const [isSavingSample, setIsSavingSample] = useState(false)
  const [isLoadingViewSample, setIsLoadingViewSample] = useState(false)
  const [showFullResponse, setShowFullResponse] = useState(false)
  
  // Memoize the response analysis to avoid recalculating on every render
  const responseAnalysis = useMemo(() => {
    if (!response?.body) return { isLarge: false, isTooLarge: false, estimatedSize: 0 }
    
    const estimatedSize = estimateJsonSize(response.body)
    return {
      isLarge: estimatedSize > MAX_RENDER_SIZE,
      isTooLarge: estimatedSize > MAX_SAFE_SIZE,
      estimatedSize
    }
  }, [response?.body])
  
  // Memoize the safe response to avoid recalculating unless needed
  const safeResponseBody = useMemo(() => {
    if (!response?.body) return null
    if (!responseAnalysis.isLarge) return response.body
    if (showFullResponse) return response.body
    return truncateForRendering(response.body)
  }, [response?.body, responseAnalysis.isLarge, showFullResponse])
  
  const downloadResponse = () => {
    if (!response?.body) return
    
    try {
      const jsonString = JSON.stringify(response.body, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `response-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading response:', error)
    }
  }
  
  const openInNewTab = () => {
    if (!response?.body) return
    
    try {
      let content: string
      let mimeType: string
      
      // Handle different content types
      const contentType = Object.keys(response.headers).find(key => 
        key.toLowerCase() === 'content-type'
      )
      const ct = contentType ? response.headers[contentType] : ''
      
      if (ct.includes('application/json') || typeof response.body === 'object') {
        // For JSON responses, format them nicely
        content = JSON.stringify(response.body, null, 2)
        mimeType = 'application/json'
      } else {
        // For other content types, use as-is
        content = String(response.body)
        mimeType = ct || 'text/plain'
      }
      
      // Create a blob URL and open in new tab
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      
      // Open in new tab
      const newTab = window.open(url, '_blank')
      
      // Clean up the blob URL after a short delay
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 1000)
      
      // Focus on the new tab if possible
      if (newTab) {
        newTab.focus()
      }
    } catch (error) {
      console.error('Error opening response in new tab:', error)
    }
  }
  
  const handleOpenSampleDialog = async () => {
    if (response?.body) {
      setIsGeneratingSample(true)
      setSampleDialogOpen(true)
      
      // Use setTimeout to allow UI to update with loader
      setTimeout(() => {
        try {
          const startTime = Date.now()
          const sample = createSampleResponse(response.body)
          const processingTime = Date.now() - startTime
          
          // Log performance for debugging
          console.log(`Sample generation took ${processingTime}ms`)
          
          setEditableSample(JSON.stringify(sample, null, 2))
        } catch (error) {
          console.error('Error generating sample:', error)
          setEditableSample('{"error": "Failed to generate sample response"}')
        } finally {
          setIsGeneratingSample(false)
        }
      }, 100)
    }
  }
  
  const handleViewSample = () => {
    setIsLoadingViewSample(true)
    setViewSampleDialogOpen(true)
    // Small delay to show loader and then render the JsonViewer
    setTimeout(() => {
      setIsLoadingViewSample(false)
    }, 200)
  }
  
  const handleSaveSample = async () => {
    setIsSavingSample(true)
    
    // Use setTimeout to allow UI to update with loader
    setTimeout(() => {
      try {
        const parsedSample = JSON.parse(editableSample)
        onSaveSampleResponse?.(parsedSample)
        setSampleDialogOpen(false)
      } catch (error) {
        alert("Invalid JSON format. Please check your sample response.")
      } finally {
        setIsSavingSample(false)
      }
    }, 100)
  }
  return (
    <section className="h-full flex flex-col overflow-hidden border-t border-[var(--border)]">
      <div className="flex items-center justify-between py-3 px-1 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--muted-foreground)]">Response</span>
          {response ? (
            <>
              <span
                className={[
                  "text-xs rounded px-2 py-1",
                  response.ok
                    ? "bg-[var(--pm-green-weak)] text-[var(--pm-green-strong)]"
                    : "bg-[var(--destructive)]/10 text-[var(--destructive)]",
                ].join(" ")}
              >
                {response.status} {response.statusText}
              </span>
              <span className="text-xs text-[var(--muted-foreground)]">{response.timeMs} ms</span>
              <span className="text-xs text-[var(--muted-foreground)]">{Math.max(0, response.sizeBytes)} B</span>
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {response && (
            <Dialog 
              open={sampleDialogOpen} 
              onOpenChange={(open) => {
                // Prevent closing during operations
                if (!open && (isGeneratingSample || isSavingSample)) return
                setSampleDialogOpen(open)
                if (!open) {
                  // Reset states when dialog closes
                  setEditableSample("")
                  setIsGeneratingSample(false)
                  setIsSavingSample(false)
                }
              }}
            >
              <DialogTrigger asChild>
                <button 
                  onClick={handleOpenSampleDialog}
                  disabled={isGeneratingSample}
                  className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-muted/50 px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {isGeneratingSample ? (
                    <>
                      <Spinner className="h-3 w-3" />
                      Generating...
                    </>
                  ) : (
                    'Save Sample Response'
                  )}
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-7xl w-[90vw] max-h-[90vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Edit Sample Response</DialogTitle>
                </DialogHeader>
                <div className="flex-1 flex flex-col gap-4 min-h-0">
                  <p className="text-sm text-muted-foreground">
                    Edit the sample response below. Large arrays have been reduced to show structure.
                  </p>
                  
                  {isGeneratingSample ? (
                    <div className="flex-1 flex items-center justify-center min-h-[500px] bg-muted/20 rounded border">
                      <div className="flex flex-col items-center gap-3">
                        <Spinner className="h-8 w-8" />
                        <p className="text-sm text-muted-foreground">Generating sample response...</p>
                      </div>
                    </div>
                  ) : (
                    <Textarea
                      value={editableSample}
                      onChange={(e) => setEditableSample(e.target.value)}
                      className="flex-1 font-mono text-sm min-h-[500px] resize-none"
                      placeholder="Sample response JSON..."
                    />
                  )}
                  
                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => setSampleDialogOpen(false)}
                      disabled={isGeneratingSample || isSavingSample}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSaveSample}
                      disabled={isGeneratingSample || isSavingSample || !editableSample.trim()}
                    >
                      {isSavingSample ? (
                        <>
                          <Spinner className="h-4 w-4 mr-2" />
                          Saving...
                        </>
                      ) : (
                        'Save Sample'
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          
          {savedSample && (
            <Dialog open={viewSampleDialogOpen} onOpenChange={setViewSampleDialogOpen}>
              <DialogTrigger asChild>
                <button 
                  onClick={handleViewSample}
                  className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                >
                  View Sample
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-7xl w-[90vw] max-h-[90vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Saved Sample Response</DialogTitle>
                </DialogHeader>
                <div className="flex-1 flex flex-col gap-4 min-h-0">
                  <p className="text-sm text-muted-foreground">
                    This is the saved sample response for this request.
                  </p>
                  
                  {isLoadingViewSample ? (
                    <div className="flex-1 flex items-center justify-center min-h-[500px] bg-muted/20 rounded border">
                      <div className="flex flex-col items-center gap-3">
                        <Spinner className="h-8 w-8" />
                        <p className="text-sm text-muted-foreground">Loading sample response...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 border rounded overflow-auto min-h-[500px] bg-background p-0">
                      <JsonViewer value={savedSample} />
                    </div>
                  )}
                  
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setViewSampleDialogOpen(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          
          {response && (
            <>
              <button 
                onClick={openInNewTab}
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-muted/50 px-2 py-1 rounded transition-colors flex items-center gap-1"
                title="Open response in new tab (use browser's JSON prettifier)"
              >
                <ExternalLink className="h-3 w-3" />
                Open in Tab
              </button>
              
              <button 
                onClick={downloadResponse}
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-muted/50 px-2 py-1 rounded transition-colors flex items-center gap-1"
                title="Download response as JSON file"
              >
                <Download className="h-3 w-3" />
                Download
              </button>
            </>
          )}
          
          <div className="text-[var(--muted-foreground)] text-xs">•••</div>
        </div>
      </div>

      <div className="flex-1 border border-[var(--border)] rounded-md overflow-hidden flex flex-col">
        <div className="flex items-center gap-4 px-3 py-2 border-b border-[var(--border)] flex-shrink-0">
          <div className="text-sm">Body</div>
          <div className="text-sm text-[var(--muted-foreground)]">Cookies</div>
          <div className="text-sm text-[var(--muted-foreground)]">Headers</div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-[var(--muted-foreground)]">{"{}"} JSON</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {!response ? (
            <div className="text-sm text-[var(--muted-foreground)] p-6">Send a request to see the response here.</div>
          ) : response.error ? (
            <div className="text-sm text-[var(--destructive)] p-6 space-y-2">
              <div className="font-medium">Request Failed</div>
              <pre className="whitespace-pre-wrap font-mono text-xs bg-[var(--muted)] p-3 rounded border overflow-auto">
                {response.error}
              </pre>
              
              {/* Show API-specific suggestions if available */}
              {response.body && response.body.suggestions && (
                <div className="text-xs text-[var(--muted-foreground)] mt-3 bg-blue-50 dark:bg-blue-950 p-3 rounded border">
                  <div className="space-y-1">
                    {response.body.suggestions.map((suggestion: string, index: number) => (
                      <div key={index} className="whitespace-pre-wrap">
                        {suggestion}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="text-xs text-[var(--muted-foreground)] mt-3">
                <strong>General Troubleshooting Tips:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Check if the API endpoint URL is correct</li>
                  <li>Verify your network connection</li>
                  <li>For 403/401 errors, check Authentication in the Authorization tab</li>
                  <li>For APIs like Binance, use proper API keys instead of browser requests</li>
                  <li>Check API documentation for required headers or authentication methods</li>
                </ul>
              </div>
            </div>
          ) : responseAnalysis.isTooLarge ? (
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Response Too Large</span>
              </div>
              <div className="text-sm text-[var(--muted-foreground)] space-y-2">
                <p>
                  This response is too large ({Math.round(responseAnalysis.estimatedSize / 1024)} KB) to display safely 
                  without risking browser performance issues.
                </p>
                <p>
                  You can download the full response as a JSON file to view it in an external editor.
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={openInNewTab}
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in New Tab
                </Button>
                <Button 
                  onClick={downloadResponse}
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  <Download className="h-4 w-4" />
                  Download Full Response
                </Button>
              </div>
            </div>
          ) : responseAnalysis.isLarge ? (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between gap-2 p-3 bg-amber-50 border-b border-amber-200">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Large Response Detected</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-600">
                    {Math.round(responseAnalysis.estimatedSize / 1024)} KB
                  </span>
                  {!showFullResponse ? (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowFullResponse(true)}
                      className="text-xs"
                    >
                      Show Full Response
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowFullResponse(false)}
                      className="text-xs"
                    >
                      Show Truncated
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={openInNewTab}
                    className="text-xs"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open in Tab
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={downloadResponse}
                    className="text-xs"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                <JsonViewer value={safeResponseBody} />
              </div>
            </div>
          ) : (
            <JsonViewer value={response.body} />
          )}
        </div>
      </div>
    </section>
  )
}
