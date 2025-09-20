import type { ReactElement } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAdminSession } from '../../hooks/useAdminSession'

interface ProtectedAdminRouteProps {
  children: ReactElement
}

export default function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const { session, isAdmin, loading, error } = useAdminSession()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-md bg-slate-900 px-4 py-3 text-sm text-slate-300 shadow-lg">
          Checking admin permissions...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="max-w-sm rounded-md border border-red-500/50 bg-red-950/40 p-4 text-sm text-red-200">
          <p className="font-semibold">Unable to verify permissions</p>
          <p className="mt-1 text-red-300">{error}</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/account" state={{ from: location.pathname }} replace />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}
