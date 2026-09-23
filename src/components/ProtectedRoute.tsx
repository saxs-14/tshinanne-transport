import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { User } from 'firebase/auth'

export default function ProtectedRoute({ user }: { user: User | null }) {
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}