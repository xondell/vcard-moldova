import { requireSupabase } from './supabase'
export type PhysicalCard = { id: string; public_id: string; profile_id: string; status: 'active' | 'disabled'; activated_at: string }
export async function listCards(): Promise<PhysicalCard[]> {
  const { data, error } = await requireSupabase().from('physical_cards').select('id,public_id,profile_id,status,activated_at').order('activated_at')
  if (error) throw error
  return data as PhysicalCard[]
}
export async function activateCard(code: string, profileId: string): Promise<string> {
  const { data, error } = await requireSupabase().rpc('activate_card', { activation_code: code.trim(), target_profile: profileId })
  if (error) throw error
  if (data?.error || !data?.public_id) throw new Error(data?.error || 'invalid_code')
  return data.public_id
}
export async function setCardEnabled(id: string, enabled: boolean) {
  const { error } = await requireSupabase().rpc('set_card_enabled', { card_id: id, enabled })
  if (error) throw error
}
export async function resolveCard(publicId: string): Promise<{ status: 'active' | 'unassigned' | 'unavailable'; slug: string | null } | null> {
  const { data, error } = await requireSupabase().rpc('resolve_card', { card_public_id: publicId })
  if (error) throw error
  return data
}
