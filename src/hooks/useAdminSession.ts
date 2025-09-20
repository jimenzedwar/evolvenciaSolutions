import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'

export interface AdminSessionState {
  session: Session | null
  isAdmin: boolean
  role: 'admin' | 'customer' | null
  loading: boolean
  error?: string
  refresh: () => Promise<void>
}

const roleTable = 'app_user_roles'

export function useAdminSession(): AdminSessionState {
  const client = supabase
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<'admin' | 'customer' | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()

  const fetchRole = useCallback(
    async (userId: string | undefined | null) => {
      if (!client) {
        setRole(null)
        setError('Supabase client is not configured')
        setLoading(false)
        return
      }

      if (!userId) {
        setRole(null)
        setLoading(false)
        return
      }

      setLoading(true)

      const { data, error: roleError } = await client
        .from(roleTable)
        .select('role')
        .eq('user_id', userId)
        .maybeSingle()

      if (roleError) {
        setError(roleError.message)
        setRole(null)
      } else if (data?.role === 'admin') {
        setRole('admin')
      } else if (data?.role) {
        setRole('customer')
      } else {
        setRole(null)
      }

      setLoading(false)
    },
    [client],
  )

  useEffect(() => {
    if (!client) {
      setLoading(false)
      setError('Supabase client is not configured')
      return
    }

    let isMounted = true

    client.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!isMounted) return

        if (sessionError) {
          setError(sessionError.message)
          setSession(null)
          setRole(null)
          setLoading(false)
          return
        }

        const currentSession = data?.session ?? null
        setSession(currentSession)
        void fetchRole(currentSession?.user?.id)
      })

    const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return
      setSession(nextSession)
      void fetchRole(nextSession?.user?.id)
    })

    return () => {
      isMounted = false
      listener?.subscription.unsubscribe()
    }
  }, [client, fetchRole])

  const refresh = useCallback(async () => {
    await fetchRole(session?.user?.id)
  }, [fetchRole, session?.user?.id])

  return useMemo(
    () => ({
      session,
      isAdmin: role === 'admin',
      role,
      loading,
      error,
      refresh,
    }),
    [session, role, loading, error, refresh],
  )
}
