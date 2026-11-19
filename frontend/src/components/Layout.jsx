import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  BookOpen,
  Gamepad2,
  House,
  LayoutGrid,
  Menu,
  Moon,
  Newspaper,
  Sun,
  X,
  Zap,
} from 'lucide-react'
import Logo from './Logo.jsx'
import { useTheme } from '../hooks/useTheme.js'
import { USER_NAME } from '../config.js'

const NAV = [
  { to: '/', label: 'Home', icon: House },
  { to: '/news', label: 'News', icon: Newspaper },
  { to: '/wiki', label: 'Wikipedia', icon: BookOpen },
  { to: '/games', label: 'Games', icon: Gamepad2 },
  { to: '/more', label: 'More', icon: LayoutGrid },
]

function Brand() {
  return (
    <div className="flex flex-col items-center gap-1 py-2 text-center">
      <Logo className="h-14 w-14" />
      <span className="text-2xl font-extrabold tracking-tight">Duta</span>
      <span className="text-xs text-slate-500 dark:text-slate-400">Chat • Discover • Play</span>
    </div>
  )
}

function NavItems({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60'
            }`
          }
        >
          <Icon className="h-5 w-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

function Tagline() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-blue-50/70 p-4 text-center text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
      <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      <span>Explore. Learn. Have Fun!</span>
    </div>
  )
}

function Topbar({ dark, onToggle, onMenu }) {
  return (
    <header className="flex items-center justify-between px-4 py-3 md:justify-end md:px-8 md:py-5">
      <button
        onClick={onMenu}
        aria-label="Open menu"
        className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Menu className="h-6 w-6" />
      </button>

      <div className="flex items-center gap-2 md:hidden">
        <Logo className="h-8 w-8" />
        <span className="text-lg font-bold">Duta</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          aria-label="Toggle theme"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 transition hover:shadow dark:bg-slate-800 dark:ring-slate-700"
        >
          {dark ? (
            <Sun className="h-5 w-5 text-amber-400" />
          ) : (
            <Moon className="h-5 w-5 text-slate-600" />
          )}
        </button>

        <div className="hidden items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-4 shadow-sm ring-1 ring-slate-200 sm:flex dark:bg-slate-800 dark:ring-slate-700">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-sm font-semibold text-white">
            {USER_NAME[0]}
          </span>
          <span className="text-sm font-medium">{USER_NAME}</span>
        </div>
      </div>
    </header>
  )
}

export default function Layout() {
  const { dark, toggle } = useTheme()
  const [drawer, setDrawer] = useState(false)
  const closeDrawer = () => setDrawer(false)

  return (
    <div className="flex h-dvh overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-teal-300/40 blur-3xl dark:bg-teal-500/15" />
        <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-orange-300/40 blur-3xl dark:bg-orange-500/10" />
        <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-indigo-300/40 blur-3xl dark:bg-indigo-500/15" />
      </div>

      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-slate-200/70 bg-white/70 p-5 backdrop-blur md:flex dark:border-slate-800 dark:bg-slate-900/60">
        <div className="space-y-6">
          <Brand />
          <NavItems />
        </div>
        <Tagline />
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeDrawer} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col justify-between bg-white p-5 shadow-xl dark:bg-slate-900">
            <div className="space-y-6">
              <div className="flex justify-end">
                <button
                  onClick={closeDrawer}
                  aria-label="Close menu"
                  className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <Brand />
              <NavItems onNavigate={closeDrawer} />
            </div>
            <Tagline />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar dark={dark} onToggle={toggle} onMenu={() => setDrawer(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}