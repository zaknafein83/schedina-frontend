import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  Trophy,
  Shield,
  Users,
  BookOpen,
  Bell,
  LogOut,
  ChevronRight,
} from 'lucide-react'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/contests', label: 'Concorsi', icon: Trophy },
  { to: '/admin/leagues', label: 'Leghe', icon: Shield },
  { to: '/admin/teams', label: 'Squadre', icon: Users },
  { to: '/admin/rules', label: 'Regole', icon: BookOpen },
  { to: '/admin/users', label: 'Utenti', icon: Users },
  { to: '/admin/notifications', label: 'Notifiche', icon: Bell },
]

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-gds-pink text-white'
        : 'text-gray-300 hover:bg-gds-dark-2 hover:text-white'
    }`

  return (
    <div className="min-h-screen flex bg-gds-gray-light">
      {/* Sidebar */}
      <aside className="w-64 bg-gds-dark flex flex-col min-h-screen fixed left-0 top-0 z-40">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gds-dark-2">
          <span className="text-2xl font-black text-gds-pink tracking-tight">
            SCHEDINA
          </span>
          <span className="ml-2 text-xs text-gray-400 font-semibold uppercase tracking-wider">
            Admin
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon size={18} />
              {label}
              <ChevronRight size={14} className="ml-auto opacity-40" />
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-gds-dark-2 p-4">
          <div className="text-xs text-gray-400 mb-1 truncate">
            {user?.email}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors w-full px-1 py-1"
          >
            <LogOut size={16} />
            Esci
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-64">
        <main className="p-8">{children}</main>
      </div>
    </div>
  )
}
