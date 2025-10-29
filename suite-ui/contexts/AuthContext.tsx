'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, getStoredAuth, setStoredAuth, clearStoredAuth, validateCredentials } from '@/lib/auth'

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  login: (username: string, password: string) => boolean
  logout: () => void
  updateProfile: (updates: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load auth state from localStorage on mount
  useEffect(() => {
    const storedAuth = getStoredAuth()
    setIsAuthenticated(storedAuth.isAuthenticated)
    setUser(storedAuth.user)
    setIsInitialized(true)
  }, [])

  const login = (username: string, password: string): boolean => {
    const validatedUser = validateCredentials(username, password)
    
    if (validatedUser) {
      setIsAuthenticated(true)
      setUser(validatedUser)
      setStoredAuth({ isAuthenticated: true, user: validatedUser })
      return true
    }
    
    return false
  }

  const logout = () => {
    setIsAuthenticated(false)
    setUser(null)
    clearStoredAuth()
  }

  const updateProfile = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates }
      setUser(updatedUser)
      setStoredAuth({ isAuthenticated: true, user: updatedUser })
    }
  }

  // Don't render children until auth state is initialized
  if (!isInitialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
