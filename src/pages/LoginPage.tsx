import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register, forgotPassword } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/logo.svg'

type Tab = 'login' | 'register' | 'forgot'

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const resetState = (nextTab: Tab) => {
    setTab(nextTab)
    setError('')
    setInfo('')
  }

  const handleLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(email, password)
      signIn(data)
      navigate('/ideas')
    } catch {
      setError('Incorrect email or password')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setInfo('')
    setLoading(true)
    try {
      await register(email, password)
      setInfo('Account created! Check your email to confirm.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      await forgotPassword(email)
      setInfo('Check your inbox — a reset link is on the way.')
    } catch {
      setError('Something went wrong. Please try again.')
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

        {tab !== 'forgot' && (
          <div className="flex bg-stone-100 rounded-lg p-1 mb-6">
            {(['login', 'register'] as Tab[]).map(t => (
              <button key={t} onClick={() => resetState(t)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition ${tab === t ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'
                  }`}>
                {t === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>
        )}

        {tab !== 'forgot' && (
          <>
            <button
              onClick={() => { window.location.href = '/oauth2/authorization/google' }}
              className="w-full flex items-center justify-center gap-3 border border-stone-200 rounded-lg py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 transition mb-4">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-stone-200" />
              <span className="text-xs text-stone-400">or</span>
              <div className="flex-1 h-px bg-stone-200" />
            </div>
          </>
        )}

        {tab === 'login' && (
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
              className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-stone-400 transition" />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required
              className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-stone-400 transition" />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={loading}
              className="bg-teal-600 hover:bg-teal-500 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 text-sm">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
            <button type="button" onClick={() => resetState('forgot')}
              className="text-xs text-stone-400 hover:text-teal-600 transition text-center mt-1">
              Forgot password?
            </button>
          </form>
        )}

        {tab === 'register' && (
          <form onSubmit={handleRegister} className="flex flex-col gap-3">
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
              className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500 placeholder-stone-400 transition" />
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} placeholder="Password (min 8 chars)"
                value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500 placeholder-stone-400 transition pr-14" />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600">
                {showPassword ? 'hide' : 'show'}
              </button>
            </div>
            <input type="password" placeholder="Confirm password" value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)} required
              className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500 placeholder-stone-400 transition" />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {info && (
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-sm text-teal-700">✓ {info}</div>
            )}
            <button type="submit" disabled={loading}
              className="bg-teal-600 hover:bg-teal-500 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 text-sm">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        )}

        {tab === 'forgot' && (
          <div>
            <button onClick={() => resetState('login')}
              className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition mb-5">
              ← Back to Sign In
            </button>
            <h2 className="text-lg font-semibold text-stone-800 mb-2">Reset password</h2>
            <p className="text-sm text-stone-400 mb-5">Enter your email — we'll send a reset link.</p>
            {info ? (
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 text-sm text-teal-700">
                ✓ {info}
              </div>
            ) : (
              <form onSubmit={handleForgot} className="flex flex-col gap-3">
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500 placeholder-stone-400 transition" />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button type="submit" disabled={loading}
                  className="bg-teal-600 hover:bg-teal-500 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 text-sm">
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
