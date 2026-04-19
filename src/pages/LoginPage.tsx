import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuth } from '../context/AuthContext'

import logo from '../assets/logo.svg'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(email, password)
      signIn(data)
      navigate('/projects')
    } catch {
      setError('Incorrect email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-stone-200 w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <img src={logo} alt="MakeHollywood" className="h-10 w-auto pr-5" />
          <div className="flex flex-col items-start gap-0">
            <span className="text-2xl font-bold tracking-tight leading-none">
              <span className="text-orange-500 italic">Make</span><span className="text-teal-600">Hollywood</span>
            </span>
            <span className="text-[14px] text-stone-400 tracking-wide italic leading-none">
              A few moments later…
            </span>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-stone-800 mb-6 text-center">Sign In</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="bg-stone-50 text-stone-900 border border-stone-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-stone-400 transition"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="bg-stone-50 text-stone-900 border border-stone-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-stone-400 transition"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-teal-600 hover:bg-teal-500 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
