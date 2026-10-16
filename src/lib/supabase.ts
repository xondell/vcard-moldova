import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
// Capture before SDK callback initialization can consume/clear the URL fragment.
export const authCallbackFailed = Boolean(new URLSearchParams(window.location.hash.slice(1)).get('error') || new URLSearchParams(window.location.search).get('error'))
export const isSupabaseConfigured = Boolean(url && key)
// Never substitute a fake backend. Missing configuration has an explicit UI state.
export const supabase = isSupabaseConfigured ? createClient(url!, key!, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
}) : null
export function requireSupabase() {
  if (!supabase) throw new Error('configuration')
  return supabase
}
