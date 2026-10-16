import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
const origin=process.argv[2]
if(!origin || new URL(origin).protocol!=='https:') throw new Error('Usage: node tests/deployment.mjs https://YOUR_DEPLOYMENT')
for(const path of ['/ru','/ro','/ru/login','/ro/dashboard/profile','/p/unknown','/c/VC000123']) {
  const response=await fetch(origin+path)
  assert.equal(response.status,200,`SPA direct load ${path}`)
  assert.equal(response.headers.get('x-content-type-options'),'nosniff')
  assert.ok(response.headers.get('content-security-policy')?.includes("frame-ancestors 'none'"))
  console.log(`PASS direct SPA load and security headers: ${path}`)
}
const browser=await chromium.launch()
try {
  const page=await browser.newPage()
  const errors=[]; page.on('pageerror',error=>errors.push(error.message))
  for(const locale of ['ru','ro']) {
    await page.goto(`${origin}/${locale}/demo/business`)
    await page.getByRole('heading',{name:'Arina Studio'}).waitFor()
    console.log(`PASS deployed ${locale} demo template`)
  }
  for(const width of [375,390]) {
    await page.setViewportSize({width,height:900}); await page.goto(origin+'/ro')
    await page.getByRole('heading',{name:'Cartea ta. Regulile tale.'}).waitFor()
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth))
    console.log(`PASS deployed ${width}px landing`)
  }
  await page.goto(origin+'/ro/dashboard/profile')
  await page.waitForURL('**/ro/login')
  console.log('PASS deployed unauthenticated dashboard redirect')
  const missing=await page.getByRole('alert').filter({hasText:'Supabase nu este configurat'}).count()
  if(missing) {
    assert.ok(await page.getByRole('button',{name:'Intră în cont',exact:true}).isDisabled())
    console.log('CONFIRMED BLOCKER: cloud Supabase is not configured; login fails closed, not a working cloud MVP')
  }
  assert.deepEqual(errors,[],'no uncaught client errors')
} finally { await browser.close() }
