// app/layout.tsx
import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"
import type { Metadata } from "next"
import type React from "react"
import "./globals.css"
import { SWRConfigProvider } from "./swr-config"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "Database Viewer",
  description: "Database Management and Viewer",
  generator: "v0.app",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`h-full font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <SWRConfigProvider>
          <main className="h-full">
            {children}
          </main>
        </SWRConfigProvider>
        <Toaster />
      </body>
    </html>
  )
}
