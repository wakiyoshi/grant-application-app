import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { hasToken, type Role } from '../api/client'

export function ProtectedRoute({ role }: { role: Role }) {
  const location = useLocation()
  const loginPath = role === 'reviewer' ? '/reviewer/login' : '/login'
  return hasToken(role) ? <Outlet /> : <Navigate to={loginPath} state={{ from: location }} replace />
}
