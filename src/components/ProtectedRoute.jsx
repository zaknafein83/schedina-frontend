import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Spinner from './Spinner'
import Layout from './Layout'
import AdminLayout from './AdminLayout'

export default function ProtectedRoute({ allowedRole }) {
  const { user, isLoading } = useAuth()
  const hasToken = !!localStorage.getItem('token')

  // Sta ancora caricando l'utente dal token salvato, oppure
  // il login è appena avvenuto e React non ha ancora committato user
  if (isLoading || (!user && hasToken)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gds-gray-light">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRole && user.role !== allowedRole) {
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
    return <Navigate to="/contests" replace />
  }

  if (allowedRole === 'ADMIN') {
    return (
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    )
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}
