"use client"

import { usePagePersistence } from "@/hooks/use-page-persistence"

export function PagePersistenceProvider({ children }: { children: React.ReactNode }) {
  // This will automatically handle page persistence
  usePagePersistence()
  
  return <>{children}</>
}