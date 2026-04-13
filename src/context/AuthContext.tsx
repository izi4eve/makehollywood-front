import { createContext, useContext, useState, type ReactNode } from 'react'
import { type AuthResponse } from '../api/auth'

interface AuthContextType {
  user: AuthResponse | null
  token: string | null
  signIn: (data: AuthResponse) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthResponse | null>(null)
  const [token, setToken] = useState<string | null>(null)

  const signIn = (data: AuthResponse) => {
    setUser(data)
    setToken(data.accessToken)
  }

  const signOut = () => {
    setUser(null)
    setToken(null)
  }

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