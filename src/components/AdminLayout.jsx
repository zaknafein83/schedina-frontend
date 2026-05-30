import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  Shield,
  Users,
  User,
  Bell,
  BookOpen,
  CalendarDays,
  Award,
  Coins,
  LogOut,
  ChevronRight,
  HelpCircle,
  FileText,
  Menu,
  X,
} from 'lucide-react'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/giornate', label: 'Calendario', icon: CalendarDays },
  { to: '/admin/scommesse', label: 'Scommesse', icon: Coins },
  { to: '/admin/schedine', label: 'Schedine', icon: FileText },
  { to: '/admin/rules', label: 'Regole', icon: BookOpen },
  { to: '/admin/seasons', label: 'Stagioni', icon: CalendarDays },
  { to: '/admin/tournaments', label: 'Tornei', icon: Award },
  { to: '/admin/leagues', label: 'Leghe', icon: Shield },
  { to: '/admin/teams', label: 'Squadre', icon: Users },
  { to: '/admin/players', label: 'Giocatori', icon: User },
  { to: '/admin/users', label: 'Utenti', icon: Users },
  { to: '/admin/notifications', label: 'Notifiche', icon: Bell },
  { to: '/listini', label: 'Listini', icon: User },
  { to: '/aiuto', label: 'Guida', icon: HelpCircle },
]

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Chiude il drawer al cambio rotta su mobile
  useEffect(() => { setDrawerOpen(false) }, [location.pathname])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-gds-pink text-white'
        : 'text-gray-300 hover:bg-gds-dark-2 hover:text-white'
    }`

  return (
    <div className="min-h-screen bg-gds-gray-light">
      {/* Topbar mobile (visibile solo sotto md) */}
      <header className="md:hidden bg-gds-dark h-14 flex items-center justify-between px-3 sticky top-0 z-30">
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 rounded-lg text-white hover:bg-gds-dark-2"
          aria-label="Apri menu"
        >
          <Menu size={22} />
        </button>
        <span className="text-lg font-black text-gds-pink tracking-tight">SCHEDINA</span>
        <span className="text-xs text-gray-400 font-semibold uppercase">Admin</span>
      </header>

      {/* Overlay drawer mobile */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Sidebar: fissa su desktop, drawer su mobile */}
      <aside
        className={`bg-gds-dark flex flex-col w-64 fixed left-0 top-0 z-50 min-h-screen
          transition-transform duration-200 ease-out
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-gds-dark-2">
          <div>
            <span className="text-2xl font-black text-gds-pink tracking-tight">SCHEDINA</span>
            <span className="ml-2 text-xs text-gray-400 font-semibold uppercase tracking-wider">Admin</span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="md:hidden p-2 rounded-lg text-gray-300 hover:bg-gds-dark-2"
            aria-label="Chiudi menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon size={18} />
              {label}
              <ChevronRight size={14} className="ml-auto opacity-40" />
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gds-dark-2 p-4">
          <div className="text-xs text-gray-400 mb-1 truncate">{user?.email}</div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors w-full px-1 py-2"
          >
            <LogOut size={16} />
            Esci
          </button>
        </div>
      </aside>

      {/* Main content: niente margin su mobile, ml-64 da md in su */}
      <div className="md:ml-64">
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
