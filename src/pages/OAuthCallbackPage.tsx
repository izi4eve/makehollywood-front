import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function OAuthCallbackPage() {
  const { signIn, token } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)  // ← новый флаг

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const accessToken = params.get('accessToken')
    const refreshToken = params.get('refreshToken')
    const email = params.get('email')
    const role = params.get('role')
    const provider = params.get('provider')

    if (accessToken && refreshToken && email && role) {
      signIn({ accessToken, refreshToken, email, role, provider: provider ?? undefined })
      setReady(true)  // ← разрешаем навигацию только после signIn
    } else {
      setError('OAuth login failed — missing token data.')
      setTimeout(() => navigate('/login', { replace: true }), 3000)
    }
  }, [])

  useEffect(() => {
    if (ready && token) {
      navigate('/ideas', { replace: true })
    }
  }, [ready, token, navigate])

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <p className="text-red-500 text-sm">{error}</p>
        ) : (
          <>
            <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-stone-500 text-sm">Signing you in…</p>
          </>
        )}
      </div>
    </div>
  )
}
