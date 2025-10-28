"use client"

import { createContext, useContext, type ReactNode } from "react"
import type { CopilotConfig } from "@/types/copilot"

const CopilotContext = createContext<CopilotConfig | null>(null)

export function CopilotProvider({ config, children }: { config: CopilotConfig; children: ReactNode }) {
  return <CopilotContext.Provider value={config}>{children}</CopilotContext.Provider>
}

export function useCopilot() {
  const context = useContext(CopilotContext)
  if (!context) {
    throw new Error("useCopilot must be used within CopilotProvider")
  }
  return context
}
