const API = '/api/auth'

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  email: string
  role: string
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