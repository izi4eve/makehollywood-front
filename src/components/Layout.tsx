import { Link, useLocation } from 'react-router-dom'
import { type ReactNode } from 'react'

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation()

  const navItems = [
    { path: '/projects', label: 'Projects' },
    { path: '/ideas', label: 'Ideas' },
  ]

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <nav className="border-b border-stone-200 bg-white px-6 py-4 flex items-center gap-8 shadow-sm">
        <span className="text-lg font-bold tracking-tight">
          <span className="text-orange-500">Make</span><span className="text-teal-600">Hollywood</span>
        </span>
        <div className="flex gap-6">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-medium transition ${
                location.pathname.startsWith(item.path)
                  ? 'text-teal-600'
                  : 'text-stone-400 hover:text-stone-900'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="ml-auto">
          <Link
            to="/projects/new"
            className="bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            + New Project
          </Link>
        </div>
      </nav>
      <main className="px-6 py-8 max-w-6xl mx-auto">
        {children}
      </main>
    </div>
  )
}
