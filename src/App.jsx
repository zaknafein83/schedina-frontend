import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Spinner from './components/Spinner'
import ProtectedRoute from './components/ProtectedRoute'

// Auth pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'

// User pages
import Contests from './pages/user/Contests'
import ContestDetail from './pages/user/ContestDetail'
import MyCoupons from './pages/user/MyCoupons'
import UserNotifications from './pages/user/Notifications'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminContests from './pages/admin/Contests'
import AdminContestDetail from './pages/admin/ContestDetail'
import AdminLeagues from './pages/admin/Leagues'
import AdminTeams from './pages/admin/Teams'
import AdminRules from './pages/admin/Rules'
import AdminUsers from './pages/admin/Users'
import AdminNotifications from './pages/admin/Notifications'

function RootRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
  return <Navigate to="/contests" replace />
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

      {/* User routes */}
      <Route element={<ProtectedRoute allowedRole="USER" />}>
        <Route path="/contests" element={<Contests />} />
        <Route path="/contests/:id" element={<ContestDetail />} />
        <Route path="/my-coupons" element={<MyCoupons />} />
        <Route path="/notifications" element={<UserNotifications />} />
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute allowedRole="ADMIN" />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/contests" element={<AdminContests />} />
        <Route path="/admin/contests/:id" element={<AdminContestDetail />} />
        <Route path="/admin/leagues" element={<AdminLeagues />} />
        <Route path="/admin/teams" element={<AdminTeams />} />
        <Route path="/admin/rules" element={<AdminRules />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/notifications" element={<AdminNotifications />} />
      </Route>
    </Routes>
  )
}
