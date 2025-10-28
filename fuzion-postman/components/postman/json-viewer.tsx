import { useMemo } from "react"

type JsonViewerProps = {
  value: unknown
  className?: string
}

function colorize(jsonString: string) {
  // Very lightweight JSON highlighter
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  const withSpans = esc(jsonString)
    // keys
    .replace(/(&quot;)(.*?)(:&quot;|&quot;:)/g, (_m, q1, key, tail) => {
      return `<span class="text-[var(--muted-foreground)]">${q1}${key}</span>${tail}`
    })
    // strings
    .replace(/&quot;(.*?)&quot;/g, '<span class="text-[var(--pm-json-string)]">&quot;$1&quot;</span>')
    // numbers
    .replace(/\b(-?\d+(?:\.\d+)?)\b/g, '<span class="text-[var(--pm-json-number)]">$1</span>')
    // booleans/null
    .replace(/\b(true|false|null)\b/g, '<span class="text-[var(--pm-json-boolean)]">$1</span>')
  return withSpans
}

export function JsonViewer({ value, className }: JsonViewerProps) {
  const { pretty, lines, isLarge } = useMemo(() => {
    let pretty = ""
    try {
      // Check if the value has truncation indicators
      if (value && typeof value === 'object' && '__truncated' in value) {
        pretty = JSON.stringify(value, null, 2)
      } else {
        pretty = JSON.stringify(value, null, 2)
      }
    } catch {
      pretty = String(value)
    }
    
    const lines = pretty.split('\n')
    const isLarge = lines.length > 1000 || pretty.length > 50000
    
    return { pretty, lines, isLarge }
  }, [value])
  
  // For very large responses, limit the number of lines rendered
  const displayLines = useMemo(() => {
    if (!isLarge) return lines
    
    const maxLines = 500
    if (lines.length <= maxLines) return lines
    
    const truncatedLines = [
      ...lines.slice(0, maxLines - 2),
      `  // ... ${lines.length - maxLines + 2} more lines truncated for performance`,
      '}'
    ]
    return truncatedLines
  }, [lines, isLarge])
  
  const colorizedContent = useMemo(() => {
    const content = displayLines.join('\n')
    return colorize(content)
  }, [displayLines])
  
  return (
    <div className="relative h-full">
      <div className="flex h-full">
        {/* Line numbers */}
        <div className="w-12 bg-muted/30 border-r flex-shrink-0 relative overflow-hidden">
          <div 
            className="absolute top-0 left-0 right-0 p-2 font-mono text-xs text-muted-foreground pointer-events-none"
            style={{ lineHeight: "1.5rem" }}
            id="json-line-numbers"
          >
            {displayLines.map((_, index) => (
              <div key={index} className="text-right pr-2 h-6">
                {index + 1}
              </div>
            ))}
          </div>
        </div>
        {/* Content */}
        <div 
          className="flex-1 overflow-auto"
          onScroll={(e) => {
            // Sync line numbers with content scroll
            const lineNumbers = document.getElementById('json-line-numbers')
            if (lineNumbers) {
              lineNumbers.style.transform = `translateY(-${e.currentTarget.scrollTop}px)`
            }
          }}
        >
          {isLarge && (
            <div className="sticky top-0 z-10 bg-amber-50 border-b border-amber-200 px-2 py-1">
              <div className="text-xs text-amber-700">
                ⚠️ Large response - showing first 500 lines for performance
              </div>
            </div>
          )}
          <pre
            className={[
              "font-mono text-sm bg-[var(--muted)] text-[var(--foreground)] p-2 m-0",
              "w-full whitespace-pre break-words",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ 
              lineHeight: "1.5rem",
              // Optimize rendering for large content
              willChange: isLarge ? 'scroll-position' : 'auto'
            }}
            dangerouslySetInnerHTML={{ __html: colorizedContent }}
          />
        </div>
      </div>
    </div>
  )
}
