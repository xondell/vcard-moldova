// Operator only. A service-role key must never be passed to Vite or checked into git.
import { randomBytes, createHash } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
const publicId = process.argv[2]
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !/^VC[A-Z0-9]{6,30}$/.test(publicId || '')) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.operator; run npm run provision:card -- VC000123')
  process.exit(1)
}
const secret = randomBytes(24).toString('base64url')
const verifier = createHash('sha256').update(secret).digest('hex')
const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
const { error } = await client.rpc('provision_card', { card_public_id: publicId, verifier })
if (error) { console.error('Provisioning failed; no secret was issued.', error.code); process.exit(1) }
console.log(`Public NFC path: /c/${publicId}\nONE-TIME ACTIVATION CODE (print securely, not on NFC tag): ${secret}`)
