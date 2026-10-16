import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { randomBytes, createHash } from 'node:crypto'
import QRCode from 'qrcode'

const url = process.env.SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
const admin = createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})
test.beforeAll(() => {
  if (!url || !key) throw new Error('Run supabase start and node scripts/local-env.mjs first')
  if (!['127.0.0.1','localhost','[::1]'].includes(new URL(url).hostname) && process.env.ALLOW_REMOTE_TESTS !== 'yes') throw new Error('Refusing to create test fixtures in a remote project')
})
async function cleanup(email: string) {
  const {data} = await admin.auth.admin.listUsers({perPage:1000})
  const user=data.users.find(u=>u.email===email)
  if(user) {
    const {data:objects}=await admin.storage.from('profile-media').list(user.id)
    for(const profile of objects || []) {
      const {data:files}=await admin.storage.from('profile-media').list(`${user.id}/${profile.name}`)
      if(files?.length) await admin.storage.from('profile-media').remove(files.map(f=>`${user.id}/${profile.name}/${f.name}`))
    }
    await admin.from('physical_cards').delete().eq('owner_id',user.id)
    await admin.auth.admin.deleteUser(user.id)
  }
}
test('landing, locale switching, mobile overflow and protected direct URLs', async ({page}) => {
  for(const width of [375,390,1440]) {
    await page.setViewportSize({width,height:900}); await page.goto('/ru')
    await expect(page.getByRole('heading',{name:'Твоя визитка. Твои правила.'})).toBeVisible()
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  }
  await page.getByRole('button',{name:'RO',exact:true}).first().click()
  await expect(page).toHaveURL(/\/ro$/)
  await page.goto('/ro/dashboard/profile'); await expect(page).toHaveURL(/\/ro\/login$/)
  await page.goto('/ru/demo/business'); await expect(page.getByRole('heading',{name:'Arina Studio'})).toBeVisible()
  await page.goto('/not-a-page'); await expect(page.getByRole('heading',{name:'404'})).toBeVisible()
  await page.goto('/p/unknown-e2e-profile'); await expect(page.getByRole('heading',{name:'404'})).toBeVisible()
})

for(const type of ['personal','business'] as const) test(`${type}: register → edit → upload → save → publish → second browser → QR → NFC`, async ({page,browser}) => {
  const suffix=randomBytes(5).toString('hex'), email=`e2e-${type}-${suffix}@example.com`, password=randomBytes(15).toString('base64url')
  const slug=`e2e-${type}-${suffix}`, name=type==='personal' ? `Ana ${suffix}` : `Studio ${suffix}`
  const publicId=`VC${randomBytes(7).toString('hex').toUpperCase()}`, secret=randomBytes(24).toString('base64url')
  let cardId: string | undefined
  const uploadedPaths: string[]=[]
  page.on('requestfinished',request=> {
    const path=new URL(request.url()).pathname
    const prefix='/storage/v1/object/profile-media/'
    if(request.method()==='POST' && path.startsWith(prefix)) uploadedPaths.push(decodeURIComponent(path.slice(prefix.length)))
  })
  const visitor=await browser.newContext()
  try {
    await page.goto('/ru/register')
    await page.getByLabel('Email',{exact:true}).fill(email)
    await page.getByLabel('Пароль',{exact:true}).fill(password)
    await page.getByLabel('Повторите пароль',{exact:true}).fill(password)
    if(type==='business') await page.getByRole('button',{name:'Бизнес',exact:true}).click()
    await page.getByRole('button',{name:'Создать аккаунт',exact:true}).click()
    await expect(page).toHaveURL(/\/ru\/dashboard$/)
    await page.getByRole('button',{name:'Редактировать профиль',exact:true}).first().click()
    await page.getByLabel('Адрес профиля (slug)',{exact:true}).fill(slug)
    await page.getByLabel(type==='personal'?'Имя и фамилия':'Название компании',{exact:true}).fill(name)
    await page.getByLabel('Телефон',{exact:true}).fill('+37368123456')
    await page.getByLabel('Email',{exact:true}).fill('public@example.md')
    await page.getByLabel('Сайт',{exact:true}).fill('https://example.md')
    await page.getByLabel('Telegram',{exact:true}).fill('https://t.me/example')
    if(type==='personal') {
      await page.getByLabel('Профессия / роль',{exact:true}).fill('Engineer')
      await page.getByLabel('О себе',{exact:true}).fill('Cross-device biography')
    } else {
      await page.getByLabel('Описание',{exact:true}).fill('Cross-device business description')
      await page.getByLabel('Адрес',{exact:true}).fill('Chișinău, Moldova')
      await page.getByLabel('Часы работы',{exact:true}).fill('Luni 09:00–18:00\nMarți 09:00–18:00')
      await page.getByRole('button',{name:'Добавить кнопку',exact:true}).click()
      await page.getByLabel('Текст кнопки',{exact:true}).fill('Reviews')
      await page.getByLabel('Ссылка кнопки',{exact:true}).fill('https://example.md/reviews')
    }
    const png=await QRCode.toBuffer('VCard upload fixture')
    await page.locator('input[type=file]').first().setInputFiles({name:'avatar.png',mimeType:'image/png',buffer:png})
    await expect(page.getByText('Изображение загружено. Сохраните изменения.')).toBeVisible()
    if(type==='business') {
      await page.locator('input[type=file]').nth(1).setInputFiles({name:'cover.png',mimeType:'image/png',buffer:png})
      await expect(page.locator('.editor-cover img')).toBeVisible()
    }
    await page.getByRole('button',{name:'Предпросмотр',exact:true}).click()
    await expect(page.getByRole('dialog').getByRole('heading',{name,exact:true})).toBeVisible()
    await page.getByRole('dialog').getByRole('button',{name:'Закрыть',exact:true}).click()
    await page.getByRole('button',{name:'Сохранить изменения',exact:true}).click()
    await expect(page.getByRole('status').filter({hasText:'Сохранено'})).toBeVisible()
    const publicPage=await visitor.newPage()
    await publicPage.goto(`/p/${slug}`); await expect(publicPage.getByRole('heading',{name:'404'})).toBeVisible()
    await page.getByRole('button',{name:'Опубликовать',exact:true}).click()
    await expect(page.getByRole('button',{name:'Снять с публикации',exact:true})).toBeVisible()
    await publicPage.reload(); await expect(publicPage.getByRole('heading',{name,exact:true})).toBeVisible()
    await expect(publicPage.locator('.profile-image img').first()).toBeVisible()
    if(type==='business') {
      await expect(publicPage.getByRole('link',{name:'Reviews'})).toHaveAttribute('href','https://example.md/reviews')
      await expect(publicPage.locator('.business-cover-photo img')).toBeVisible()
    }
    else {
      const [download]=await Promise.all([publicPage.waitForEvent('download'),publicPage.getByRole('button',{name:'Сохранить контакт'}).click()])
      expect(download.suggestedFilename()).toMatch(/\.vcf$/)
    }
    const [qr]=await Promise.all([publicPage.waitForEvent('download'),publicPage.getByRole('button',{name:'Скачать PNG'}).click()])
    expect(qr.suggestedFilename()).toBe('vcard-qr.png')
    await page.getByLabel('Телефон',{exact:true}).fill('+37368999999')
    await page.getByRole('button',{name:'Сохранить изменения',exact:true}).click()
    await expect(page.getByRole('status').filter({hasText:'Сохранено'})).toBeVisible()
    await publicPage.reload(); await expect(publicPage.locator('a[href="tel:+37368999999"]').first()).toBeVisible()
    for(const width of [375,390]) {
      await page.setViewportSize({width,height:900}); await publicPage.setViewportSize({width,height:900})
      await expect(page.getByRole('button',{name:'Мои карты',exact:true})).toBeVisible()
      expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      expect(await publicPage.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      if(width===390) {
        await page.screenshot({path:`test-results/${type}-editor-390.png`,fullPage:true})
        await publicPage.screenshot({path:`test-results/${type}-public-390.png`,fullPage:true})
      }
    }
    await publicPage.getByRole('button',{name:'RO',exact:true}).click()
    await expect(publicPage).toHaveURL(/lang=ro/)
    await expect(publicPage.getByRole('button',{name:'Descarcă PNG'})).toBeVisible()
    await page.setViewportSize({width:1440,height:1000})
    const provision=await admin.rpc('provision_card',{card_public_id:publicId,verifier:createHash('sha256').update(secret).digest('hex')})
    expect(provision.error).toBeNull(); cardId=provision.data
    await page.getByRole('button',{name:'Мои карты',exact:true}).click()
    await page.getByLabel('Код активации NFC-карты',{exact:true}).fill(secret)
    await page.getByRole('button',{name:'Активировать карту',exact:true}).click()
    await expect(page.getByText('Карта активирована.',{exact:true})).toBeVisible()
    await expect(page.locator('.qr-url').filter({hasText:`/c/${publicId}`})).toBeVisible()
    await publicPage.goto(`/c/${publicId}`); await expect(publicPage).toHaveURL(new RegExp(`/p/${slug}`))
    await expect(publicPage.getByRole('heading',{name,exact:true})).toBeVisible()
    await page.getByLabel('Код активации NFC-карты',{exact:true}).fill(secret)
    await page.getByRole('button',{name:'Активировать карту',exact:true}).click()
    await expect(page.getByRole('alert')).toContainText('Код неверен')
    await page.reload(); await expect(page.getByText(publicId,{exact:true}).first()).toBeVisible()
    await page.getByRole('button',{name:'Выйти',exact:true}).click(); await expect(page).toHaveURL(/\/login$/)
    await page.goto('/ru/dashboard'); await expect(page).toHaveURL(/\/login$/)
    await page.getByLabel('Email',{exact:true}).fill(email); await page.getByLabel('Пароль',{exact:true}).fill(password)
    await page.getByRole('button',{name:'Войти',exact:true}).click(); await expect(page).toHaveURL(/\/dashboard$/)
    await page.screenshot({path:`test-results/${type}-dashboard.png`,fullPage:true})
  } finally {
    await visitor.close()
    if(uploadedPaths.length) await admin.storage.from('profile-media').remove(uploadedPaths)
    if(cardId) await admin.from('physical_cards').delete().eq('id',cardId)
    await cleanup(email)
  }
})

test('Romanian password recovery email changes the real password', async ({page}) => {
  const email=`recovery-${randomBytes(5).toString('hex')}@example.com`
  const password=randomBytes(16).toString('base64url'), next=randomBytes(16).toString('base64url')
  const {error}=await admin.auth.admin.createUser({email,password,email_confirm:true})
  expect(error).toBeNull()
  try {
    await page.goto('/ro/forgot-password')
    await page.getByLabel('Email',{exact:true}).fill(email)
    await page.getByRole('button',{name:'Recuperează accesul',exact:true}).click()
    await expect(page.getByRole('status')).toContainText('vei primi un email')
    let messageId=''
    await expect.poll(async()=> {
      const response=await page.request.get(`http://127.0.0.1:56324/api/v1/search?query=${encodeURIComponent('to:'+email)}`)
      const mail=await response.json(); messageId=mail.messages?.[0]?.ID || ''; return messageId
    }).not.toBe('')
    const response=await page.request.get(`http://127.0.0.1:56324/api/v1/message/${messageId}`)
    const mail=await response.json()
    const link=mail.HTML.match(/href="([^"]+)"/)?.[1]?.replaceAll('&amp;','&')
    expect(link).toBeTruthy()
    await page.goto(link!)
    await expect(page).toHaveURL(/\/ro\/reset-password$/)
    await page.getByLabel('Parolă',{exact:true}).fill(next)
    await page.getByLabel('Repetă parola',{exact:true}).fill(next)
    await page.getByRole('button',{name:'Parolă nouă',exact:true}).click()
    await expect(page).toHaveURL(/\/ro\/dashboard$/)
    const verify=createClient(url,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}})
    expect((await verify.auth.signInWithPassword({email,password})).error).toBeTruthy()
    expect((await verify.auth.signInWithPassword({email,password:next})).error).toBeNull()
  } finally { await cleanup(email) }
})

test('expired recovery for another account cannot change the active account password', async ({page}) => {
  const email=`expired-${randomBytes(5).toString('hex')}@example.com`, password=randomBytes(16).toString('base64url')
  expect((await admin.auth.admin.createUser({email,password,email_confirm:true})).error).toBeNull()
  try {
    await page.goto('/ru/login')
    await page.getByLabel('Email',{exact:true}).fill(email); await page.getByLabel('Пароль',{exact:true}).fill(password)
    await page.getByRole('button',{name:'Войти',exact:true}).click(); await expect(page).toHaveURL(/\/dashboard$/)
    await page.goto('/ro/reset-password#error=access_denied&error_code=otp_expired&error_description=Expired')
    await expect(page.getByRole('button',{name:'Parolă nouă',exact:true})).toBeDisabled()
    await expect(page.getByRole('alert')).toContainText('expirat')
    await expect(page.getByRole('button',{name:'Recuperează accesul',exact:true})).toBeVisible()
    const verify=createClient(url,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}})
    expect((await verify.auth.signInWithPassword({email,password})).error).toBeNull()
  } finally { await cleanup(email) }
})
