import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

const AuthContext = createContext<{ session: Session | null; loading: boolean }>({ session: null, loading: true })
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    let mounted = true
    // Subscribe first so a callback/session refresh cannot be overwritten by a stale initial read.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, next) => {
      if (!mounted) return
      setSession(next); setLoading(false)
      if (event === 'PASSWORD_RECOVERY') {
        window.history.replaceState({}, '', '/ru/reset-password')
        window.dispatchEvent(new PopStateEvent('popstate'))
      }
    })
    supabase.auth.getSession().then(({ data, error }) => {
      if (mounted) { setSession(error ? null : data.session); setLoading(false) }
    })
    return () => { mounted = false; subscription.unsubscribe() }
  }, [])
  return <AuthContext.Provider value={{ session, loading }}>{children}</AuthContext.Provider>
}
export const useAuth = () => useContext(AuthContext)
