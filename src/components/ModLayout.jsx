import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Trophy, FileText, User, LogOut, ChevronRight, HelpCircle, Menu, X } from 'lucide-react'

const navItems = [
  { to: '/mod/concorsi', label: 'Concorsi',  icon: Trophy },
  { to: '/mod/schedine', label: 'Schedine',  icon: FileText },
  { to: '/mod/players',  label: 'Giocatori', icon: User },
  { to: '/listini',          label: 'Listini',         icon: User },
  { to: '/aiuto',            label: 'Guida',           icon: HelpCircle },
]

export default function ModLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => { setDrawerOpen(false) }, [location.pathname])

  function handleLogout() { logout(); navigate('/login') }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-gds-pink text-white'
        : 'text-gray-300 hover:bg-white/10 hover:text-white'
    }`

  return (
    <div className="min-h-screen bg-gds-gray-light">
      {/* Topbar mobile */}
      <header className="md:hidden bg-gds-dark h-14 flex items-center justify-between px-3 sticky top-0 z-30">
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 rounded-lg text-white hover:bg-white/10"
          aria-label="Apri menu"
        >
          <Menu size={22} />
        </button>
        <span className="text-lg font-black text-gds-pink tracking-tight">SCHEDINA</span>
        <span className="text-xs text-gray-400 font-semibold uppercase">Mod</span>
      </header>

      {drawerOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setDrawerOpen(false)} />
      )}

      <aside
        className={`bg-gds-dark flex flex-col w-64 fixed left-0 top-0 z-50 min-h-screen
          transition-transform duration-200 ease-out
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
          <div>
            <span className="text-2xl font-black text-gds-pink tracking-tight">SCHEDINA</span>
            <span className="ml-2 text-xs text-gray-400 font-semibold uppercase tracking-wider">Mod</span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="md:hidden p-2 rounded-lg text-gray-300 hover:bg-white/10"
            aria-label="Chiudi menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass}>
              <Icon size={18} />
              {label}
              <ChevronRight size={14} className="ml-auto opacity-40" />
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <div className="px-4 py-2 mb-2">
            <p className="text-xs text-gray-400">Loggato come</p>
            <p className="text-sm text-white font-medium truncate">{user?.email}</p>
            <span className="text-xs text-gds-pink font-semibold">MOD</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
              text-gray-300 hover:bg-white/10 hover:text-white transition-colors w-full"
          >
            <LogOut size={18} />
            Esci
          </button>
        </div>
      </aside>

      <div className="md:ml-64">
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
