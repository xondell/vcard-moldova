import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
const output = execFileSync('supabase', ['status', '-o', 'env'], { encoding: 'utf8' })
const env = Object.fromEntries(output.split('\n').filter(line => /^[A-Z_]+="/.test(line)).map(line => {
  const index = line.indexOf('='); return [line.slice(0,index), JSON.parse(line.slice(index+1))]
}))
if (!env.API_URL || !env.ANON_KEY || !env.SERVICE_ROLE_KEY) throw new Error('Start local Supabase first')
writeFileSync('.env.local', `VITE_APP_URL=http://127.0.0.1:3000\nVITE_SUPABASE_URL=${env.API_URL}\nVITE_SUPABASE_ANON_KEY=${env.ANON_KEY}\n`, { mode: 0o600 })
writeFileSync('.env.integration', `SUPABASE_URL=${env.API_URL}\nSUPABASE_ANON_KEY=${env.ANON_KEY}\nSUPABASE_SERVICE_ROLE_KEY=${env.SERVICE_ROLE_KEY}\nAPP_URL=http://127.0.0.1:3000\n`, { mode: 0o600 })
console.log('Wrote ignored local-only .env.local and .env.integration. No remote services changed.')
