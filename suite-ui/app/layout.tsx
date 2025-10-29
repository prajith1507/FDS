import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { PagePersistence } from '@/components/page-persistence'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Fuzionest Development Suite',
  description: 'Unified developer dashboard for DB Viewer, Postman, and Transformer tools',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <PagePersistence />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}