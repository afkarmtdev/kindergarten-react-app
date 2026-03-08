import { Navigate, Outlet } from 'react-router-dom'
import { useParentAuth } from '../../hooks/useParentAuth'

export default function PortalProtectedRoute() {
  const { student, loading } = useParentAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-kinder-orange border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!student) {
    return <Navigate to="/portal/login" replace />
  }

  return <Outlet />
}
