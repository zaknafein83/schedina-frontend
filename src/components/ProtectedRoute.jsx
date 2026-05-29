import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Spinner from './Spinner'
import Layout from './Layout'
import AdminLayout from './AdminLayout'
import ModLayout from './ModLayout'

function homeFor(role) {
  if (role === 'ADMIN') return '/admin'
  if (role === 'MOD') return '/mod/giornate'
  return '/giornate'
}

export default function ProtectedRoute({ allowedRole }) {
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

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={homeFor(user.role)} replace />
  }

  if (allowedRole === 'ADMIN') return <AdminLayout><Outlet /></AdminLayout>
  if (allowedRole === 'MOD')   return <ModLayout><Outlet /></ModLayout>
  return <Layout><Outlet /></Layout>
}
