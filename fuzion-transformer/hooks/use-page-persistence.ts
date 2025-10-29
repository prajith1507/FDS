"use client"

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

/**
 * Custom hook to handle page persistence across browser refreshes
 * This ensures users stay on the same page after refreshing the browser
 */
export function usePagePersistence() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Store the current page in sessionStorage when the pathname changes
    const storeCurrentPage = () => {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('lastVisitedPage', pathname)
        sessionStorage.setItem('lastVisitedTimestamp', Date.now().toString())
      }
    }

    storeCurrentPage()
  }, [pathname])

  useEffect(() => {
    // Handle page visibility change (when user comes back to the tab)
    const handleVisibilityChange = () => {
      if (!document.hidden && typeof window !== 'undefined') {
        const storedPage = sessionStorage.getItem('lastVisitedPage')
        const storedTimestamp = sessionStorage.getItem('lastVisitedTimestamp')
        
        // Only restore if the stored page is different from current and recent (within 1 hour)
        if (storedPage && 
            storedPage !== pathname && 
            storedTimestamp && 
            (Date.now() - parseInt(storedTimestamp)) < 3600000) {
          
          console.log('[PagePersistence] Restoring last visited page:', storedPage)
          router.push(storedPage)
        }
      }
    }

    // Handle beforeunload to store current state
    const handleBeforeUnload = () => {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('lastVisitedPage', pathname)
        sessionStorage.setItem('lastVisitedTimestamp', Date.now().toString())
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [pathname, router])

  return {
    currentPage: pathname,
    storePage: (page: string) => {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('lastVisitedPage', page)
        sessionStorage.setItem('lastVisitedTimestamp', Date.now().toString())
      }
    },
    getStoredPage: () => {
      if (typeof window !== 'undefined') {
        return sessionStorage.getItem('lastVisitedPage')
      }
      return null
    }
  }
}

/**
 * Utility function to restore the last visited page on app initialization
 */
export function restoreLastVisitedPage() {
  if (typeof window !== 'undefined') {
    const storedPage = sessionStorage.getItem('lastVisitedPage')
    const storedTimestamp = sessionStorage.getItem('lastVisitedTimestamp')
    
    if (storedPage && storedTimestamp) {
      const timeDiff = Date.now() - parseInt(storedTimestamp)
      
      // Only restore if the page was visited within the last hour
      if (timeDiff < 3600000) {
        return storedPage
      }
    }
  }
  
  return null
}