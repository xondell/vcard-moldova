import { z } from 'zod'
import { requireSupabase } from './supabase'
import type { Profile, ProfileType } from './product'

const text = z.string().max(2048)
const url = z.string().max(2048).refine(value => !value || /^https?:\/\//.test(value) && (() => {
  try { const u = new URL(value); return Boolean(u.hostname) && !u.username && !u.password && !/\s/.test(value) } catch { return false }
})(), 'invalid_url')
const common = {
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{2,47}$/),
  phone: text.refine(v => !/[\r\n]/.test(v)), email: z.union([z.literal(''), z.email()]), website: url,
  socials: z.object({ instagram: url.optional(), telegram: url.optional(), linkedin: url.optional(), facebook: url.optional(), tiktok: url.optional(), whatsapp: url.optional(), website: url.optional() }).strict(),
  avatarPath: text.optional(),
}
const schema = z.discriminatedUnion('type', [
  z.object({ ...common, type: z.literal('personal'), fullName: text, title: text, company: text, bio: text, location: text }),
  z.object({ ...common, type: z.literal('business'), name: text, category: text, description: text, address: text, mapsUrl: url, hours: z.array(z.string().max(200)).max(14), actions: z.array(z.object({ label: z.string().min(1).max(100), url: url.refine(Boolean), icon: z.string().max(32) })).max(10), coverPath: text.optional() }),
])
export type OwnedProfile = Profile & { id: string; published: boolean }
export function emptyProfile(type: ProfileType, slug: string): Profile {
  const base = { slug, phone: '', email: '', website: '', socials: {}, avatarPath: '' }
  return type === 'personal'
    ? { ...base, type, fullName: '', title: '', company: '', bio: '', location: '' }
    : { ...base, type, name: '', category: '', description: '', address: '', mapsUrl: '', hours: [], actions: [], coverPath: '' }
}
export function validateProfile(profile: unknown): Profile { return schema.parse(profile) }
function parseProfile(data: Record<string, unknown>): Profile {
  return validateProfile({ ...emptyProfile(data.type === 'business' ? 'business' : 'personal', String(data.slug)), ...data })
}
export async function getOwnedProfile(): Promise<OwnedProfile> {
  const { data, error } = await requireSupabase().rpc('get_owned_profile')
  if (error) throw error
  if (!data) throw new Error('profile_not_found')
  return { ...parseProfile(data), id: data.id, published: data.published }
}
export async function saveOwnedProfile(profile: OwnedProfile, published = profile.published): Promise<OwnedProfile> {
  const validated = validateProfile(profile)
  const { slug, type: _type, ...details } = validated
  const { data, error } = await requireSupabase().rpc('save_profile', { profile_slug: slug, profile_data: details, is_published: published })
  if (error) throw error
  return { ...parseProfile(data), id: data.id, published: data.published }
}
export async function getPublicProfile(slug: string): Promise<Profile | null> {
  const { data, error } = await requireSupabase().rpc('get_public_profile', { profile_slug: slug })
  if (error) throw error
  return data ? parseProfile(data) : null
}
