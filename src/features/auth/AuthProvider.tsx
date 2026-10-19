import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, authCallbackFailed } from '../../lib/supabase'
import { localeFromLocation } from '../../lib/navigation'

const AuthContext = createContext<{ session: Session | null; loading: boolean; recoveryVerified: boolean }>({ session: null, loading: true, recoveryVerified: false })
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [recoveryUserId, setRecoveryUserId] = useState<string | null>(null)
  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    let mounted = true
    let authEventReceived = false
    // Subscribe first so a callback/session refresh cannot be overwritten by a stale initial read.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, next) => {
      if (!mounted) return
      authEventReceived = true
      setSession(next); setLoading(false)
      if (event === 'SIGNED_OUT') setRecoveryUserId(null)
      if (event === 'PASSWORD_RECOVERY' && next && !authCallbackFailed) {
        setRecoveryUserId(next.user.id)
        const locale = localeFromLocation(window.location.pathname, window.location.search)
        window.history.replaceState({}, '', `/${locale}/reset-password`)
        window.dispatchEvent(new PopStateEvent('popstate'))
      }
    })
    supabase.auth.getSession().then(({ data, error }) => {
      if (mounted && !authEventReceived) { setSession(error ? null : data.session); setLoading(false) }
    }).catch(() => { if (mounted && !authEventReceived) { setSession(null); setLoading(false) } })
    return () => { mounted = false; subscription.unsubscribe() }
  }, [])
  return <AuthContext.Provider value={{ session, loading, recoveryVerified: Boolean(!authCallbackFailed && session && recoveryUserId === session.user.id) }}>{children}</AuthContext.Provider>
}
export const useAuth = () => useContext(AuthContext)
