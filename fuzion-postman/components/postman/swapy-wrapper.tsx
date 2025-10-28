import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    Swapy: any
  }
}

interface SwapyProps {
  className?: string
  onReady?: (swapy: any) => void
}

export function SwapyContainer({ className, onReady }: SwapyProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const swapyRef = useRef<any>(null)

  useEffect(() => {
    // Load Swapy script dynamically
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/swapy/dist/swapy.min.js'
    script.async = true
    script.onload = () => {
      if (containerRef.current && window.Swapy) {
        swapyRef.current = window.Swapy.createSwapy(containerRef.current)
        if (onReady) {
          onReady(swapyRef.current)
        }
      }
    }
    document.body.appendChild(script)

    return () => {
      // Cleanup
      if (swapyRef.current) {
        swapyRef.current.destroy?.()
      }
      document.body.removeChild(script)
    }
  }, [onReady])

  return <div ref={containerRef} className={className} />
}