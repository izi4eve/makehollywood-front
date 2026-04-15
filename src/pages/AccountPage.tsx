import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function AccountPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-stone-200 w-full max-w-md">
        <h1 className="text-2xl font-bold text-stone-900 mb-6">Account</h1>
        <p className="text-stone-400 mb-2">Email: <span className="text-stone-900">{user?.email}</span></p>
        <p className="text-stone-400 mb-6">Role: <span className="text-stone-900">{user?.role}</span></p>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-400 text-white font-semibold py-3 px-6 rounded-lg transition"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
