"use client"

import { useEffect } from 'react'

/**
 * Simple page persistence component that ensures users stay on the current page after browser refresh
 * This component should be added to the root layout of each application
 */
export function PagePersistence() {
  useEffect(() => {
    // Store current page URL before the page unloads
    const storeCurrentPage = () => {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname + window.location.search + window.location.hash
        sessionStorage.setItem('lastVisitedPage', currentPath)
        sessionStorage.setItem('lastVisitedTimestamp', Date.now().toString())
        console.log('[PagePersistence] Stored current page:', currentPath)
      }
    }

    // Store the current page when the component mounts
    storeCurrentPage()

    // Store the current page before the browser tab/window is closed or refreshed
    const handleBeforeUnload = () => {
      storeCurrentPage()
    }

    // Store the current page when the user navigates away
    const handleVisibilityChange = () => {
      if (document.hidden) {
        storeCurrentPage()
      }
    }

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup event listeners
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return null // This component doesn't render anything
}

/**
 * Hook to check if we need to restore a previously visited page
 * Call this in your main page components to handle page restoration
 */
export function usePageRestore() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPage = sessionStorage.getItem('lastVisitedPage')
      const storedTimestamp = sessionStorage.getItem('lastVisitedTimestamp')
      const currentPath = window.location.pathname + window.location.search + window.location.hash

      // Only restore if:
      // 1. There's a stored page
      // 2. The stored page is different from current page
      // 3. The stored page was visited recently (within 5 minutes)
      // 4. We're on the root path or a generic page
      if (storedPage && 
          storedPage !== currentPath && 
          storedTimestamp && 
          (Date.now() - parseInt(storedTimestamp)) < 300000 && // 5 minutes
          (currentPath === '/' || currentPath === '' || currentPath === '/admin')) {
        
        console.log('[PageRestore] Restoring page:', storedPage)
        
        // Clear the stored page to prevent infinite loops
        sessionStorage.removeItem('lastVisitedPage')
        sessionStorage.removeItem('lastVisitedTimestamp')
        
        // Navigate to the stored page
        window.location.href = storedPage
      }
    }
  }, [])
}

export default PagePersistence