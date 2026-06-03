import { useState, useEffect, useMemo } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { notificationApi, concorsoApi } from '../api/client'
import { Bell, Trophy, FileText, Coins, LogOut, BookOpen, List, Menu, X, Clock } from 'lucide-react'

const navItems = [
  { to: '/concorsi',  label: 'Concorsi',  icon: Trophy },
  { to: '/scommesse', label: 'Scommesse', icon: Coins },
  { to: '/schedine',  label: 'Schedine',  icon: FileText },
  { to: '/listini',   label: 'Listini',   icon: List },
  { to: '/aiuto',     label: 'Guida',     icon: BookOpen },
]

function fmtCountdown(ms) {
  if (ms <= 0) return 'in chiusura'
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (d > 0) return `${d}g ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m ${String(sec).padStart(2, '0')}s`
  return `${m}m ${String(sec).padStart(2, '0')}s`
}

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.list().then((r) => r.data),
    refetchInterval: 30000,
  })

  const unreadCount = notifications ? notifications.filter((n) => n.status !== 'READ').length : 0

  // Countdown alla chiusura del concorso aperto più imminente.
  const { data: openConcorsi } = useQuery({
    queryKey: ['concorsi'],
    queryFn: () => concorsoApi.listOpen().then((r) => r.data),
    refetchInterval: 60000,
  })
  const [nowTs, setNowTs] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const nextClose = useMemo(() => {
    const fut = (openConcorsi || [])
      .filter((c) => c.closeAt)
      .map((c) => ({ ...c, t: new Date(c.closeAt).getTime() }))
      .filter((c) => c.t > nowTs)
      .sort((a, b) => a.t - b.t)
    return fut[0] || null
  }, [openConcorsi, nowTs])

  useEffect(() => { setDrawerOpen(false) }, [location.pathname])

  function handleLogout() { logout(); navigate('/login') }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-gds-pink-light text-gds-pink'
        : 'text-gds-gray hover:bg-gds-gray-light hover:text-gds-white'
    }`

  const drawerLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-gds-pink-light text-gds-pink'
        : 'text-gds-white hover:bg-gds-gray-light'
    }`

  return (
    <div className="min-h-screen">
      <header className="bg-gds-surface/95 backdrop-blur border-b border-gds-border sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between gap-3">
          {/* Hamburger mobile */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="md:hidden p-2 -ml-2 rounded-lg text-gds-white hover:bg-gds-gray-light"
            aria-label="Apri menu"
          >
            <Menu size={22} />
          </button>

          {/* Logo */}
          <Link to="/concorsi" className="flex items-center gap-2 md:flex-none flex-1 justify-center md:justify-start">
            <span className="text-xl md:text-2xl font-black text-gds-pink tracking-tight">SCHEDINA</span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={linkClass}>
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
            <NavLink to="/notifications" className={linkClass}>
              <span className="relative">
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gds-pink text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </span>
              Notifiche
            </NavLink>
          </nav>

          {/* Notifiche + Logout (mobile mostra solo bell badge + logout icona) */}
          <div className="flex items-center gap-2">
            <NavLink
              to="/notifications"
              className="md:hidden relative p-2 rounded-lg text-gds-white hover:bg-gds-gray-light"
              aria-label="Notifiche"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-gds-pink text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>
            <span className="text-sm text-gds-gray hidden sm:block">
              {user?.firstName} {user?.lastName}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm text-gds-gray hover:text-gds-pink transition-colors p-2"
              aria-label="Esci"
            >
              <LogOut size={18} />
              <span className="hidden sm:block">Esci</span>
            </button>
          </div>
        </div>

        {/* Countdown chiusura concorso aperto */}
        {nextClose && (
          <Link
            to={`/concorsi/${nextClose.id}`}
            className="block bg-gds-pink text-white hover:bg-gds-pink-dark transition-colors"
          >
            <div className="max-w-6xl mx-auto px-4 py-1.5 flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold">
              <Clock size={14} className="shrink-0" />
              <span className="truncate">{nextClose.name}</span>
              <span className="opacity-80">· chiusura tra</span>
              <span className="tabular-nums">{fmtCountdown(nextClose.t - nowTs)}</span>
            </div>
          </Link>
        )}
      </header>

      {/* Drawer mobile */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setDrawerOpen(false)}
        />
      )}
      <aside
        className={`md:hidden fixed left-0 top-0 z-50 w-72 max-w-[85vw] h-full bg-gds-surface shadow-xl
          transition-transform duration-200 ease-out flex flex-col
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-gds-border">
          <span className="text-xl font-black text-gds-pink tracking-tight">SCHEDINA</span>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-2 rounded-lg text-gds-white hover:bg-gds-gray-light"
            aria-label="Chiudi menu"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={drawerLinkClass}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          <NavLink to="/notifications" className={drawerLinkClass}>
            <span className="relative">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-gds-pink text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </span>
            Notifiche
          </NavLink>
        </nav>
        <div className="p-3 border-t border-gds-border">
          <p className="text-xs text-gds-gray px-3">{user?.email}</p>
        </div>
      </aside>

      <main className="max-w-6xl mx-auto px-4 py-6 md:py-8">{children}</main>
    </div>
  )
}
