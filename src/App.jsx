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
import Coupons from './pages/Coupons'
import Listini from './pages/Listini'

// User pages
import Contests from './pages/user/Contests'
import ContestDetail from './pages/user/ContestDetail'
import UserNotifications from './pages/user/Notifications'
import UserSeasonPool from './pages/user/SeasonPool'
import MySeasonCoupons from './pages/user/MySeasonCoupons'
import SeasonCouponDetail from './pages/user/SeasonCouponDetail'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminContests from './pages/admin/Contests'
import AdminContestDetail from './pages/admin/ContestDetail'
import AdminLeagues from './pages/admin/Leagues'
import AdminTeams from './pages/admin/Teams'
import AdminPlayers from './pages/admin/Players'
import AdminSeasons from './pages/admin/Seasons'
import AdminTournaments from './pages/admin/Tournaments'
import AdminSeasonPools from './pages/admin/SeasonPools'
import AdminSeasonPoolDetail from './pages/admin/SeasonPoolDetail'
import AdminRules from './pages/admin/Rules'
import AdminUsers from './pages/admin/Users'
import AdminNotifications from './pages/admin/Notifications'

// Mod pages
import ModContests from './pages/mod/Contests'
import ModContestDetail from './pages/mod/ContestDetail'

function RootRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
  if (user.role === 'MOD')   return <Navigate to="/mod/contests" replace />
  return <Navigate to="/contests" replace />
}

// Guida: accessibile a qualsiasi utente loggato, wrappa nel layout giusto del ruolo
function ManualRoute() {
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
  const Wrapper =
    user.role === 'ADMIN' ? AdminLayout : user.role === 'MOD' ? ModLayout : Layout
  return (
    <Wrapper>
      <Manual />
    </Wrapper>
  )
}

// Listini: come Guida, accessibile a qualsiasi ruolo loggato
function ListiniRoute() {
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
  const Wrapper =
    user.role === 'ADMIN' ? AdminLayout : user.role === 'MOD' ? ModLayout : Layout
  return (
    <Wrapper>
      <Listini />
    </Wrapper>
  )
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

      {/* Manual: accessibile a qualsiasi ruolo loggato */}
      <Route path="/aiuto" element={<ManualRoute />} />
      {/* Listini: pubblico a qualsiasi ruolo loggato */}
      <Route path="/listini" element={<ListiniRoute />} />

      {/* User routes */}
      <Route element={<ProtectedRoute allowedRole="USER" />}>
        <Route path="/contests" element={<Contests />} />
        <Route path="/contests/:id" element={<ContestDetail />} />
        <Route path="/my-coupons" element={<Coupons />} />
        <Route path="/season-pool" element={<UserSeasonPool />} />
        <Route path="/my-season-coupons" element={<MySeasonCoupons />} />
        <Route path="/my-season-coupons/:id" element={<SeasonCouponDetail />} />
        <Route path="/notifications" element={<UserNotifications />} />
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute allowedRole="ADMIN" />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/contests" element={<AdminContests />} />
        <Route path="/admin/contests/:id" element={<AdminContestDetail />} />
        <Route path="/admin/coupons" element={<Coupons />} />
        <Route path="/admin/leagues" element={<AdminLeagues />} />
        <Route path="/admin/teams" element={<AdminTeams />} />
        <Route path="/admin/players" element={<AdminPlayers />} />
        <Route path="/admin/seasons" element={<AdminSeasons />} />
        <Route path="/admin/tournaments" element={<AdminTournaments />} />
        <Route path="/admin/season-pools" element={<AdminSeasonPools basePath="/admin" />} />
        <Route path="/admin/season-pools/:id" element={<AdminSeasonPoolDetail basePath="/admin" />} />
        <Route path="/admin/rules" element={<AdminRules />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/notifications" element={<AdminNotifications />} />
      </Route>

      {/* Mod routes */}
      <Route element={<ProtectedRoute allowedRole="MOD" />}>
        <Route path="/mod/contests" element={<ModContests />} />
        <Route path="/mod/contests/:id" element={<ModContestDetail />} />
        <Route path="/mod/coupons" element={<Coupons />} />
        <Route path="/mod/players" element={<AdminPlayers />} />
        <Route path="/mod/season-pools" element={<AdminSeasonPools basePath="/mod" />} />
        <Route path="/mod/season-pools/:id" element={<AdminSeasonPoolDetail basePath="/mod" />} />
      </Route>
    </Routes>
  )
}
