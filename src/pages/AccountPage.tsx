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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-2xl shadow-xl w-full max-w-md text-white">
        <h1 className="text-2xl font-bold mb-6">Account</h1>
        <p className="text-gray-400 mb-2">Email: <span className="text-white">{user?.email}</span></p>
        <p className="text-gray-400 mb-6">Role: <span className="text-white">{user?.role}</span></p>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-500 text-white font-semibold py-3 px-6 rounded-lg transition"
        >
          Logout
        </button>
      </div>
    </div>
  )
}