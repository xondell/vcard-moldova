import { expect, it } from 'vitest'
import { randomBytes, createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
it('locks a single-use verifier and persists failed attempt limits', () => {
  const sql = readFileSync('supabase/migrations/202610160003_nfc.sql', 'utf8')
  expect(sql).toContain('for update of a, c')
  expect(sql).toContain('used_at is null')
  expect(sql).toContain('attempts > 10')
  expect(sql).toContain("jsonb_build_object('error','invalid_code')")
  expect(sql).toContain('grant execute on function public.provision_card(text,text) to service_role')
})
it('provisions 192-bit secrets separately from public card IDs', () => {
  const source = readFileSync('scripts/provision-card.mjs', 'utf8')
  expect(source).toContain('randomBytes(24)')
  expect(source).toContain("createHash('sha256')")
  const secret = randomBytes(24).toString('base64url')
  expect(secret.length).toBe(32)
  expect(createHash('sha256').update(secret).digest('hex').length).toBe(64)
})
