import { Link, useLocation, useNavigate } from 'react-router-dom'
import { type ReactNode } from 'react'
import logo from '../assets/logo.svg'

const navGroups = [
  { items: [{ path: '/ideas', label: 'Ideas' }] },
  {
    items: [
      { path: '/scripts', label: 'Scripts' },
      { path: '/longform', label: 'Longform', hidden: false },
    ],
  },
  { items: [{ path: '/voice', label: 'Voice' }] },
  {
    items: [
      { path: '/video', label: 'Video' },
      { path: '/director', label: 'Director', hidden: false },
    ],
  },
  { items: [{ path: '/wrap', label: 'Wrap' }] },
  {
    items: [
      { path: '/help', label: 'Help', hidden: false },
      { path: '/feedback', label: 'Feedback', hidden: false },
      { path: '/account', label: 'Account', hidden: false },
    ]
  },
]

function getCtaForPath(pathname: string): { label: string; to: string } | null {
  if (pathname.startsWith('/ideas')) return { label: '+ New Idea', to: '/ideas/new' }
  if (pathname.startsWith('/scripts')) return { label: '+ New Script', to: '/scripts/new' }
  if (pathname.startsWith('/longform')) return { label: '+ New Longform', to: '/longform/new' }
  if (pathname.startsWith('/director')) return { label: '+ Upload Footage', to: '/director/new' }
  return null
}

export interface BreadcrumbItem {
  label: string
  to?: string
}

interface NavItem {
  path: string
  label: string
  hidden?: boolean
}

interface NavGroup {
  items: NavItem[]
}

interface LayoutProps {
  children: ReactNode
  breadcrumbs?: BreadcrumbItem[]
}

export default function Layout({ children, breadcrumbs }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const cta = getCtaForPath(location.pathname)
  const isActive = (path: string) => location.pathname.startsWith(path)

  // Filter out fully-hidden groups (all items hidden)
  const visibleGroups: NavGroup[] = navGroups
    .map(g => ({ items: g.items.filter(i => !i.hidden) }))
    .filter(g => g.items.length > 0)

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <nav className="border-b border-stone-200 bg-white px-6 py-3 flex items-center gap-5 shadow-sm">
        <Link to="/ideas" className="flex items-center gap-3 shrink-0">
          <img src={logo} alt="MakeHollywood" className="h-7 w-auto" />
          <div className="flex flex-col items-start">
            <span className="text-base font-bold tracking-tight leading-none">
              <span className="text-orange-500 italic">Make</span>
              <span className="text-teal-600">Hollywood</span>
            </span>
            <span className="text-[10px] text-stone-400 tracking-wide italic leading-none">
              A few moments later…
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-1 overflow-x-auto">
          {visibleGroups.map((group, gi) => (
            <div key={gi} className="flex items-center gap-1 shrink-0">
              {gi > 0 && (
                <span className="text-stone-300 text-sm mx-1.5 select-none">→</span>
              )}
              {group.items.map((item, ii) => (
                <div key={item.path} className="flex items-center gap-1">
                  {ii > 0 && (
                    <span className="text-stone-300 text-xs mx-0.5 select-none font-light">|</span>
                  )}
                  <Link
                    to={item.path}
                    className={`text-sm font-medium px-2.5 py-1.5 rounded-lg transition whitespace-nowrap ${
                      isActive(item.path)
                        ? 'text-teal-600 bg-teal-50'
                        : 'text-stone-400 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                </div>
              ))}
            </div>
          ))}
        </div>

        {cta && (
          <div className="ml-auto shrink-0">
            <button
              onClick={() => navigate(cta.to)}
              className="bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              {cta.label}
            </button>
          </div>
        )}
      </nav>

      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="px-6 py-2 bg-white border-b border-stone-100 flex items-center gap-1.5">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-stone-300 text-xs">›</span>}
              {crumb.to ? (
                <Link to={crumb.to} className="text-xs text-stone-400 hover:text-teal-600 transition">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-xs text-stone-600 font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </div>
      )}

      <main className="px-6 py-8 max-w-6xl mx-auto">{children}</main>
    </div>
  )
}
