const API = '/api/auth'

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  email: string
  role: string
  provider?: string
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  if (!res.ok) throw new Error('Invalid credentials')
  return res.json()
}

export async function register(email: string, password: string): Promise<void> {
  const res = await fetch(`${API}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Registration failed')
  }
}

export async function forgotPassword(email: string): Promise<void> {
  const res = await fetch(`${API}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
  if (!res.ok) throw new Error('Request failed')
}

export async function refreshTokens(refreshToken: string): Promise<AuthResponse> {
  const res = await fetch(`${API}/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  })
  if (!res.ok) throw new Error('Session expired')
  const data = await res.json()
  // /api/auth/refresh возвращает только новые токены, email/role берём из localStorage
  const stored = JSON.parse(localStorage.getItem('auth_user') || '{}')
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    email: stored.email ?? '',
    role: stored.role ?? ''
  }
}
