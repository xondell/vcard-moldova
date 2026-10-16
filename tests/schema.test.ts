import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
it('defines ownership-enforced relational entities with no anonymous activation access', () => {
  const sql = readFileSync('supabase/migrations/202610160001_foundation.sql', 'utf8')
  for (const table of ['profiles', 'personal_profiles', 'business_profiles', 'physical_cards', 'activation_codes']) {
    expect(sql).toContain(`create table public.${table}`)
    expect(sql).toContain(`alter table public.${table} enable row level security`)
  }
  expect(sql).toContain('revoke all on public.activation_codes from anon, authenticated')
  expect(sql).toContain('auth.uid() = owner_id')
})
