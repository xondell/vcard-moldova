import assert from 'node:assert/strict'
import { randomBytes, createHash, randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
const { SUPABASE_URL: url, SUPABASE_ANON_KEY: key, SUPABASE_SERVICE_ROLE_KEY: service } = process.env
if (!url || !key || !service) throw new Error('Missing isolated test environment; run node scripts/local-env.mjs')
if (!['127.0.0.1','localhost','[::1]'].includes(new URL(url).hostname) && process.env.ALLOW_REMOTE_TESTS !== 'yes') throw new Error('Remote integration tests require ALLOW_REMOTE_TESTS=yes and a dedicated test project')
const options = { auth: { persistSession: false, autoRefreshToken: false, flowType: 'pkce' } }
const admin = createClient(url, service, options)
const anon = createClient(url, key, options)
const a = createClient(url, key, options), b = createClient(url, key, options)
const users = [], cards = [], objects = []
const suffix = randomBytes(5).toString('hex')
const password = randomBytes(20).toString('base64url')
let checks = 0
function check(condition, message) { assert.ok(condition, message); checks++; console.log(`PASS ${message}`) }
function ok(result, label) { assert.ifError(result.error ? new Error(`${label}: ${result.error.message}`) : null); return result.data }
const hash = value => createHash('sha256').update(value).digest('hex')
async function provision() {
  const publicId = `VC${randomBytes(7).toString('hex').toUpperCase()}`
  const secret = randomBytes(24).toString('base64url')
  const id = ok(await admin.rpc('provision_card', { card_public_id: publicId, verifier: hash(secret) }), 'provision')
  cards.push(id); return { id, publicId, secret }
}
try {
  for (const [client,type] of [[a,'personal'],[b,'business']]) {
    const email = `vcard-${type}-${suffix}@example.com`
    const data = ok(await client.auth.signUp({ email, password, options: { data: { profile_type: type } } }), 'signup')
    assert.ok(data.user); users.push(data.user.id)
    if (!data.session) { ok(await admin.auth.admin.updateUserById(data.user.id, { email_confirm: true }), 'confirm isolated fixture'); ok(await client.auth.signInWithPassword({ email, password }), 'login') }
    check(Boolean((await client.auth.getUser()).data.user), `${type} registers and authenticates without NFC`)
  }
  const wrong = await anon.auth.signInWithPassword({ email: `vcard-personal-${suffix}@example.com`, password: 'wrong-password' })
  check(Boolean(wrong.error), 'incorrect password is rejected')
  check(Boolean(ok(await a.auth.refreshSession(), 'refresh').session), 'session refresh succeeds')
  const pa = ok(await a.rpc('get_owned_profile'), 'owned personal')
  const pb = ok(await b.rpc('get_owned_profile'), 'owned business')
  check(pa.type === 'personal' && pb.type === 'business' && pa.id !== pb.id, 'signup selects separate profile types and IDs')
  check(ok(await a.from('profiles').select('*').eq('id',pb.id), 'RLS read').length === 0, 'user A cannot read user B private row')
  check(Boolean((await a.from('profiles').update({ published: true }).eq('id',pb.id)).error), 'cross-user direct profile mutation denied')
  check(Boolean((await anon.rpc('save_profile', { profile_slug: pa.slug, profile_data: {}, is_published: true })).error), 'anonymous write denied')
  check(ok(await anon.rpc('get_public_profile', { profile_slug: pa.slug }), 'draft') === null, 'draft is not publicly visible')
  const slugA = `personal-${suffix}`, slugB = `business-${suffix}`
  const personal = { fullName: 'Local Test Personal', title: 'Engineer', company: 'VCard test', bio: 'Persisted biography', phone: '+37368123456', email: 'public@example.md', website: 'https://example.md', location: 'Chișinău', socials: { telegram: 'https://t.me/example' }, avatarPath: '' }
  const business = { name: 'Local Test Business', category: 'Studio', description: 'Persistent business', phone: '+37369123456', email: 'business@example.md', website: 'https://example.md', address: 'Chișinău', mapsUrl: 'https://maps.google.com/', hours: ['Luni 09–18'], socials: { instagram: 'https://instagram.com/example' }, actions: [{ label: 'Booking', url: 'https://example.md/book', icon: 'link' }], avatarPath: '', coverPath: '' }
  const save = (client,slug,data,published) => client.rpc('save_profile', { profile_slug: slug, profile_data: data, is_published: published })
  ok(await save(a,slugA,personal,false),'save draft')
  check(ok(await anon.rpc('get_public_profile',{profile_slug:slugA}),'draft saved') === null,'saved draft remains private')
  ok(await save(a,slugA,personal,true),'publish personal')
  ok(await save(b,slugB,business,true),'publish business')
  const publicA = ok(await anon.rpc('get_public_profile',{profile_slug:slugA}),'public personal')
  check(publicA.fullName === personal.fullName && !publicA.owner_id && !publicA.id && !publicA.code_hash, 'public personal contains only published contact fields')
  check(ok(await anon.rpc('get_public_profile',{profile_slug:slugB}),'public business').actions[0].label === 'Booking','business actions and details persist publicly')
  const device = createClient(url,key,options)
  ok(await device.auth.signInWithPassword({email:`vcard-personal-${suffix}@example.com`,password}),'second device')
  check(ok(await device.rpc('get_owned_profile'),'second device profile').bio === personal.bio,'second device sees saved data')
  personal.phone = '+37368777777'
  ok(await save(a,slugA,personal,true),'update phone')
  check(ok(await anon.rpc('get_public_profile',{profile_slug:slugA}),'updated phone').phone === personal.phone,'public visitor sees edits without shared browser storage')
  check(Boolean((await save(a,slugA,{...personal,website:'javascript:alert(1)'},true)).error),'server rejects dangerous URL schemes')
  check(Boolean((await save(b,slugB,{...business,website:'http://x:999999/'},true)).error),'server rejects out-of-range URL ports')
  check(Boolean((await save(b,slugB,{...business,actions:[{label:'Invalid',url:'https://example.md'}]},true)).error),'server rejects action documents the client cannot parse')
  check(Boolean((await save(a,slugB,personal,true)).error),'duplicate slugs rejected')
  check(ok(await anon.rpc('get_public_profile',{profile_slug:'unknown-'+suffix}),'unknown') === null,'unknown slug has no fallback')
  const card = await provision()
  check(ok(await anon.rpc('resolve_card',{card_public_id:card.publicId}),'unassigned').status === 'unassigned','unassigned permanent card resolves correctly')
  check(Boolean((await anon.from('activation_codes').select('*')).error) && Boolean((await a.from('activation_codes').select('*')).error),'activation verifiers inaccessible to public and owners')
  check(Boolean((await a.rpc('provision_card',{card_public_id:`VC${suffix.toUpperCase()}`,verifier:hash('x')})).error),'ordinary users cannot provision cards')
  check(ok(await a.rpc('activate_card',{activation_code:'invalid-code-that-is-long-enough',target_profile:pa.id}),'invalid').error === 'invalid_code','invalid activation rejected server-side')
  check(ok(await a.rpc('activate_card',{activation_code:card.secret,target_profile:pb.id}),'foreign target').error === 'invalid_code','activation cannot bind someone else profile')
  check(ok(await a.rpc('activate_card',{activation_code:card.secret,target_profile:pa.id}),'activate').public_id === card.publicId,'valid activation binds owned profile')
  check(ok(await anon.rpc('resolve_card',{card_public_id:card.publicId}),'active').slug === slugA,'permanent URL resolves to current published profile')
  check(ok(await b.rpc('activate_card',{activation_code:card.secret,target_profile:pb.id}),'reuse').error === 'invalid_code','single-use code cannot be reused by another account')
  const racing = await provision()
  const race = await Promise.all([a.rpc('activate_card',{activation_code:racing.secret,target_profile:pa.id}), b.rpc('activate_card',{activation_code:racing.secret,target_profile:pb.id})])
  check(race.filter(r => r.data?.public_id).length === 1 && race.filter(r => r.data?.error === 'invalid_code').length === 1,'concurrent claim has exactly one winner')
  ok(await a.rpc('set_card_enabled',{card_id:card.id,enabled:false}),'disable')
  check(ok(await anon.rpc('resolve_card',{card_public_id:card.publicId}),'disabled').status === 'unavailable','disabled card hides destination')
  check(Boolean((await b.rpc('set_card_enabled',{card_id:card.id,enabled:true})).error),'another owner cannot change card status')
  ok(await a.rpc('set_card_enabled',{card_id:card.id,enabled:true}),'enable')
  ok(await save(a,slugA,personal,false),'unpublish')
  check(ok(await anon.rpc('resolve_card',{card_public_id:card.publicId}),'draft card').status === 'unavailable','unpublished destination cannot leak through NFC')
  const newSlug = `renamed-${suffix}`
  ok(await save(a,newSlug,personal,true),'rename')
  check(ok(await anon.rpc('resolve_card',{card_public_id:card.publicId}),'renamed card').slug === newSlug,'NFC URL stays permanent after explicit slug edit')
  // Private bucket enforces ownership even when clients bypass file validators.
  const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=','base64')
  const path = `${randomUUID()}.png`; objects.push(path)
  ok(await a.storage.from('profile-media').upload(path,image,{contentType:'image/png'}),'upload')
  check(Boolean((await save(b,slugB,{...business,avatarPath:path},true)).error),'another owner cannot attach private image')
  check(Boolean((await b.storage.from('profile-media').remove([path])).error) || Boolean((await a.storage.from('profile-media').download(path)).data),'cross-user image deletion cannot remove owner image')
  check(Boolean((await anon.storage.from('profile-media').createSignedUrl(path,60)).error),'unreferenced media is private')
  personal.avatarPath=path; ok(await save(a,newSlug,personal,true),'save media')
  check(Boolean(ok(await anon.storage.from('profile-media').download(path),'public image')),'published referenced image readable publicly')
  check(Boolean((await anon.storage.from('profile-media').createSignedUrl(path,31536000)).error),'public caller cannot mint long-lived media capability')
  check(!ok(await anon.rpc('get_public_profile',{profile_slug:newSlug}),'opaque media').avatarPath.includes(users[0]),'public media reference does not expose account ID')
  ok(await save(a,newSlug,personal,false),'draft media')
  check(Boolean((await anon.storage.from('profile-media').createSignedUrl(path,60)).error),'unpublishing blocks new public image access')
  check(Boolean((await anon.storage.from('profile-media').download(path)).error),'unpublishing revokes subsequent public media downloads')
  check(Boolean((await a.storage.from('profile-media').upload(`${randomUUID()}.svg`,Buffer.from('<svg/>'),{contentType:'image/svg+xml'})).error),'server bucket rejects SVG')
  ok(await admin.from('activation_attempts').delete().eq('user_id',users[1]),'reset limiter test fixture')
  for(let i=0;i<10;i++) ok(await b.rpc('activate_card',{activation_code:'invalid-code-that-is-long-enough',target_profile:pb.id}),'limited invalid')
  check(ok(await b.rpc('activate_card',{activation_code:'invalid-code-that-is-long-enough',target_profile:pb.id}),'limited').error === 'rate_limited','failed activation attempts persist and rate-limit')
  ok(await a.auth.signOut(),'logout')
  check((await a.auth.getSession()).data.session === null,'logout clears real session')
  check(Boolean((await a.rpc('get_owned_profile')).error),'logged-out dashboard API access denied')
  console.log(`\n${checks} integration checks passed against ${new URL(url).hostname}; real Auth/PostgreSQL/Storage, no mocked backend.`)
} finally {
  if(objects.length) await admin.storage.from('profile-media').remove(objects)
  if(cards.length) await admin.from('physical_cards').delete().in('id',cards)
  for(const id of users) { const {error}=await admin.auth.admin.deleteUser(id); if(error) console.error('Fixture cleanup failed',error.code) }
}
