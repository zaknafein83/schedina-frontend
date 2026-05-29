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
import Concorsi from './pages/user/Concorsi'
import ConcorsoDetail from './pages/user/ConcorsoDetail'
import MySchedine from './pages/user/Schedine'
import UserNotifications from './pages/user/Notifications'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminConcorsi from './pages/admin/Concorsi'
import AdminConcorsoDetail from './pages/admin/ConcorsoDetail'
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
  if (user.role === 'MOD')   return <Navigate to="/mod/concorsi" replace />
  return <Navigate to="/concorsi" replace />
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
        <Route path="/concorsi" element={<Concorsi />} />
        <Route path="/concorsi/:id" element={<ConcorsoDetail />} />
        <Route path="/schedine" element={<MySchedine />} />
        <Route path="/notifications" element={<UserNotifications />} />
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute allowedRole="ADMIN" />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/concorsi" element={<AdminConcorsi />} />
        <Route path="/admin/concorsi/:id" element={<AdminConcorsoDetail />} />
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
        <Route path="/mod/concorsi" element={<AdminConcorsi />} />
        <Route path="/mod/concorsi/:id" element={<AdminConcorsoDetail />} />
        <Route path="/mod/schedine" element={<AdminSchedine />} />
        <Route path="/mod/players" element={<AdminPlayers />} />
      </Route>
    </Routes>
  )
}
