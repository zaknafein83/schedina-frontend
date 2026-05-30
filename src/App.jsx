import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Spinner from './components/Spinner'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import ModLayout from './components/ModLayout'

// Auth pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'

// Shared pages
import Manual from './pages/Manual'
import Listini from './pages/Listini'

// User pages
import Giornate from './pages/user/Giornate'
import GiornataDetail from './pages/user/GiornataDetail'
import MySchedine from './pages/user/Schedine'
import UserScommesse from './pages/user/Scommesse'
import UserNotifications from './pages/user/Notifications'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminGiornate from './pages/admin/Giornate'
import AdminGiornataDetail from './pages/admin/GiornataDetail'
import AdminScommesse from './pages/admin/Scommesse'
import AdminSchedine from './pages/admin/Schedine'
import AdminLeagues from './pages/admin/Leagues'
import AdminTeams from './pages/admin/Teams'
import AdminPlayers from './pages/admin/Players'
import AdminSeasons from './pages/admin/Seasons'
import AdminTournaments from './pages/admin/Tournaments'
import AdminRules from './pages/admin/Rules'
import AdminUsers from './pages/admin/Users'
import AdminNotifications from './pages/admin/Notifications'

function RootRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
  if (user.role === 'MOD')   return <Navigate to="/mod/giornate" replace />
  return <Navigate to="/giornate" replace />
}

// Guida / Listini: accessibili a qualsiasi ruolo loggato, nel layout giusto
function WrappedRoute({ children }) {
  const { user, isLoading } = useAuth()
  const hasToken = !!localStorage.getItem('token')
  if (isLoading || (!user && hasToken)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gds-gray-light">
        <Spinner size="lg" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  const Wrapper = user.role === 'ADMIN' ? AdminLayout : user.role === 'MOD' ? ModLayout : Layout
  return <Wrapper>{children}</Wrapper>
}

export default function App() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gds-gray-light">
        <Spinner />
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Accessibili a qualsiasi ruolo loggato */}
      <Route path="/aiuto" element={<WrappedRoute><Manual /></WrappedRoute>} />
      <Route path="/listini" element={<WrappedRoute><Listini /></WrappedRoute>} />

      {/* User routes */}
      <Route element={<ProtectedRoute allowedRole="USER" />}>
        <Route path="/giornate" element={<Giornate />} />
        <Route path="/giornate/:id" element={<GiornataDetail />} />
        <Route path="/scommesse" element={<UserScommesse />} />
        <Route path="/schedine" element={<MySchedine />} />
        <Route path="/notifications" element={<UserNotifications />} />
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute allowedRole="ADMIN" />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/giornate" element={<AdminGiornate />} />
        <Route path="/admin/giornate/:id" element={<AdminGiornataDetail />} />
        <Route path="/admin/scommesse" element={<AdminScommesse />} />
        <Route path="/admin/schedine" element={<AdminSchedine />} />
        <Route path="/admin/leagues" element={<AdminLeagues />} />
        <Route path="/admin/teams" element={<AdminTeams />} />
        <Route path="/admin/players" element={<AdminPlayers />} />
        <Route path="/admin/seasons" element={<AdminSeasons />} />
        <Route path="/admin/tournaments" element={<AdminTournaments />} />
        <Route path="/admin/rules" element={<AdminRules />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/notifications" element={<AdminNotifications />} />
      </Route>

      {/* Mod routes */}
      <Route element={<ProtectedRoute allowedRole="MOD" />}>
        <Route path="/mod/giornate" element={<AdminGiornate />} />
        <Route path="/mod/giornate/:id" element={<AdminGiornataDetail />} />
        <Route path="/mod/scommesse" element={<AdminScommesse />} />
        <Route path="/mod/schedine" element={<AdminSchedine />} />
        <Route path="/mod/players" element={<AdminPlayers />} />
      </Route>
    </Routes>
  )
}
