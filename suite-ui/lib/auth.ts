/**
 * Authentication utilities
 */

export interface User {
  username: string
  email: string
  role: 'admin' | 'user'
  name: string
  avatar?: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
}

// Default admin credentials
export const DEFAULT_CREDENTIALS = {
  username: 'admin',
  password: 'fuzionestadmin#123',
  email: 'admin@fuzionest.com',
  name: 'Administrator',
  role: 'admin' as const
}

/**
 * Validate login credentials
 */
export function validateCredentials(username: string, password: string): User | null {
  if (username === DEFAULT_CREDENTIALS.username && password === DEFAULT_CREDENTIALS.password) {
    return {
      username: DEFAULT_CREDENTIALS.username,
      email: DEFAULT_CREDENTIALS.email,
      name: DEFAULT_CREDENTIALS.name,
      role: DEFAULT_CREDENTIALS.role,
    }
  }
  return null
}

/**
 * Get stored auth state from localStorage
 */
export function getStoredAuth(): AuthState {
  if (typeof window === 'undefined') {
    return { isAuthenticated: false, user: null }
  }

  try {
    const stored = localStorage.getItem('auth')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error reading auth from localStorage:', error)
  }

  return { isAuthenticated: false, user: null }
}

/**
 * Store auth state in localStorage
 */
export function setStoredAuth(authState: AuthState): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem('auth', JSON.stringify(authState))
  } catch (error) {
    console.error('Error storing auth to localStorage:', error)
  }
}

/**
 * Clear auth state from localStorage
 */
export function clearStoredAuth(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem('auth')
  } catch (error) {
    console.error('Error clearing auth from localStorage:', error)
  }
}
