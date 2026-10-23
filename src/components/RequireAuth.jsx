import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Spinner } from './ui'

// RequireAuth sends logged-out users to /login and, when roles are given, blocks other roles.
export default function RequireAuth({ roles, children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'customer' ? '/' : '/staff'} replace />
  }
  return children
}
