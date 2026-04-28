import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.svg'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<'form' | 'ok' | 'err'>('form')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const token = new URLSearchParams(window.location.search).get('token')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Invalid reset link.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to reset password')
      }
      setStatus('ok')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-stone-200 w-full max-w-md">
        <div className="mb-6 flex justify-center items-center gap-3">
          <img src={logo} alt="MakeHollywood" className="h-9 w-auto" />
          <div className="flex flex-col items-start">
            <span className="text-2xl font-bold tracking-tight leading-none">
              <span className="text-orange-500 italic">Make</span>
              <span className="text-teal-600">Hollywood</span>
            </span>
            <span className="text-[13px] text-stone-400 tracking-wide italic leading-none">
              A few moments later…
            </span>
          </div>
        </div>

        {status === 'ok' ? (
          <div className="text-center">
            <p className="text-teal-600 font-semibold mb-3">✓ Password reset successfully!</p>
            <p className="text-stone-400 text-sm mb-5">You can now sign in with your new password.</p>
            <button
              onClick={() => navigate('/login')}
              className="bg-teal-600 hover:bg-teal-500 text-white font-semibold py-2.5 px-6 rounded-lg text-sm transition"
            >
              Go to Sign In
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-stone-800 mb-1">Set new password</h2>
            <p className="text-sm text-stone-400 mb-5">Enter your new password below.</p>

            {!token && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600 mb-4">
                Invalid or missing reset token. Please request a new reset link.
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New password (min 8 chars)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={!token}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 text-sm pr-14 outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-stone-400 transition disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? 'hide' : 'show'}
                </button>
              </div>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                disabled={!token}
                className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-stone-400 transition disabled:opacity-50"
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading || !token}
                className="bg-teal-600 hover:bg-teal-500 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 text-sm"
              >
                {loading ? 'Saving…' : 'Set new password'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-xs text-stone-400 hover:text-teal-600 transition text-center"
              >
                ← Back to Sign In
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
