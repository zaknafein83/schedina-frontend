import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { notificationApi } from '../api/client'
import { Bell, Trophy, FileText, LogOut } from 'lucide-react'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.list().then((r) => r.data),
    refetchInterval: 30000,
  })

  const unreadCount = notifications
    ? notifications.filter((n) => !n.read).length
    : 0

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-gds-pink-light text-gds-pink'
        : 'text-gds-gray hover:bg-gds-gray-light hover:text-gds-dark'
    }`

  return (
    <div className="min-h-screen bg-gds-gray-light">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/contests" className="flex items-center gap-2">
            <span className="text-2xl font-black text-gds-pink tracking-tight">
              SCHEDINA
            </span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            <NavLink to="/contests" className={navLinkClass}>
              <Trophy size={16} />
              Concorsi
            </NavLink>
            <NavLink to="/my-coupons" className={navLinkClass}>
              <FileText size={16} />
              Le mie schedine
            </NavLink>
            <NavLink to="/notifications" className={navLinkClass}>
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

          {/* User info + logout */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gds-gray hidden sm:block">
              {user?.firstName} {user?.lastName}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm text-gds-gray hover:text-gds-pink transition-colors px-2 py-1"
            >
              <LogOut size={16} />
              <span className="hidden sm:block">Esci</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
