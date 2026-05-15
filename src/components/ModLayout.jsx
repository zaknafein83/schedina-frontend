import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Trophy, LogOut, ChevronRight, HelpCircle } from 'lucide-react'

const navItems = [
  { to: '/mod/contests', label: 'Concorsi', icon: Trophy },
  { to: '/aiuto',        label: 'Guida',    icon: HelpCircle },
]

export default function ModLayout({ children }) {
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
        : 'text-gray-300 hover:bg-white/10 hover:text-white'
    }`

  return (
    <div className="min-h-screen flex bg-gds-gray-light">
      {/* Sidebar */}
      <aside className="w-64 bg-gds-dark flex flex-col min-h-screen fixed left-0 top-0 z-40">
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <span className="text-2xl font-black text-gds-pink tracking-tight">SCHEDINA</span>
          <span className="ml-2 text-xs text-gray-400 font-semibold uppercase tracking-wider">Mod</span>
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
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium
              text-gray-300 hover:bg-white/10 hover:text-white transition-colors w-full"
          >
            <LogOut size={18} />
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
