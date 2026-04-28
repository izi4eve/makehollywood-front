import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { type AuthResponse, refreshTokens } from '../api/auth'

interface AuthContextType {
  user: AuthResponse | null
  token: string | null
  signIn: (data: AuthResponse) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const STORAGE_KEY = 'auth_user'

function loadFromStorage(): AuthResponse | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthResponse | null>(loadFromStorage)
  const [token, setToken] = useState<string | null>(() => loadFromStorage()?.accessToken ?? null)

  const signIn = useCallback((data: AuthResponse) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    setUser(data)
    setToken(data.accessToken)
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
    setToken(null)
  }, [])

  useEffect(() => {
    const interval = setInterval(async () => {
      const stored = loadFromStorage()
      if (!stored?.refreshToken) {
        signOut()
        return
      }
      try {
        const fresh = await refreshTokens(stored.refreshToken)
        signIn(fresh)
      } catch {
        signOut()
      }
    }, 14 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
