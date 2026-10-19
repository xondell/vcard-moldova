import { test, expect, type Page } from '@playwright/test'
import { demoBusiness, demoPersonal } from '../../src/lib/product'

// These fixtures verify browser layout/interaction only, not backend correctness.
const user = { id: 'layout-user', aud: 'authenticated', role: 'authenticated', email: 'very-long-account-address-for-mobile@example.com', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' }
const session = { access_token: 'layout-access-token', refresh_token: 'layout-refresh-token', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user }
const widths = [320, 375, 390, 480, 600, 640, 760, 820, 900, 901, 1024, 1440]

async function fixture(page: Page, business = false) {
  let profile = { ...(business ? demoBusiness : demoPersonal), id: 'layout-profile', published: false, website: 'https://example.com', avatarPath: '', coverPath: '' }
  await page.route('http://127.0.0.1:54321/**', async route => {
    const path = new URL(route.request().url()).pathname
    let data: unknown
    if (path === '/auth/v1/signup' || path === '/auth/v1/token') data = session
    else if (path === '/auth/v1/user') data = user
    else if (path === '/auth/v1/logout') data = {}
    else if (path === '/rest/v1/rpc/get_owned_profile') data = profile
    else if (path === '/rest/v1/rpc/save_profile') {
      const body = route.request().postDataJSON()
      profile = { ...profile, ...body.profile_data, slug: body.profile_slug, published: body.is_published }
      data = profile
    } else if (path === '/rest/v1/physical_cards') data = [{ id: 'layout-card', public_id: 'VC000123', profile_id: profile.id, status: 'active', activated_at: '2026-01-01T00:00:00Z' }]
    else throw new Error(`Unexpected layout fixture request: ${path}`)
    await route.fulfill({ json: data })
  })
}
async function noOverflow(page: Page, width: number) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth), `overflow at ${width}px on ${page.url()}`).toBeLessThanOrEqual(width)
}
async function signIn(page: Page, locale: string) {
  await page.goto(`/${locale}/login`)
  await page.getByLabel('Email', { exact: true }).fill(user.email)
  await page.locator('input[name="password"]').fill('Layout-password-123')
  await page.locator('form button[type="submit"], form > button').last().click()
  await expect(page).toHaveURL(new RegExp(`/${locale}/dashboard$`))
  await expect(page.locator('.dashboard-nav')).toBeVisible()
}

for (const locale of ['ru', 'ro']) {
  test(`${locale}: compact auth, errors, registration and keyboard-sized viewport`, async ({ page }) => {
    await fixture(page)
    for (const width of [320, 390, 640, 820, 1440]) {
      await page.setViewportSize({ width, height: 740 })
      for (const mode of ['login', 'register', 'forgot-password', 'reset-password']) {
        await page.goto(`/${locale}/${mode}`)
        await expect(page.locator('.auth-form-wrap h2')).toBeVisible()
        await noOverflow(page, width)
        if (width === 390 && (mode === 'login' || mode === 'register')) await page.screenshot({ path: test.info().outputPath(`${mode}-390.png`), fullPage: true })
        if (width <= 900) {
          expect((await page.locator('.auth-form-wrap h2').boundingBox())!.y).toBeLessThan(200)
          expect(await page.locator('form input').first().evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16)
        }
      }
    }
    await page.setViewportSize({ width: 390, height: 740 })
    await page.goto(`/${locale}/register`)
    await page.locator('[name="email"]').fill(user.email)
    await page.locator('[name="password"]').fill('Layout-password-123')
    await page.locator('[name="password-confirmation"]').fill('Mismatch-password-123')
    await page.locator('form > button').click()
    await expect(page.getByRole('alert')).toContainText(locale === 'ru' ? 'Пароли не совпадают' : 'Parolele nu coincid')
    await page.locator('[name="password-confirmation"]').fill('Layout-password-123')
    // Simulate the reduced content area of a visible software keyboard.
    await page.setViewportSize({ width: 390, height: 380 })
    await page.locator('form > button').click()
    await expect(page).toHaveURL(new RegExp(`/${locale}/dashboard$`))
    await expect(page.locator('.dashboard-nav')).toBeVisible()
    await noOverflow(page, 390)
  })
  for (const business of [false, true]) {
    test(`${locale}: ${business ? 'business' : 'personal'} dashboard navigation, editor, cards, settings and preview`, async ({ page }) => {
      await fixture(page, business)
      await page.setViewportSize({ width: 390, height: 844 })
      await signIn(page, locale)
      for (const width of widths) {
        await page.setViewportSize({ width, height: 844 })
        for (const tab of ['overview', 'profile', 'cards', 'settings']) {
          const button = page.locator('.dashboard-nav button').nth(['overview', 'profile', 'cards', 'settings'].indexOf(tab))
          await expect(button).toBeVisible()
          await button.click()
          await expect(button).toHaveAttribute('aria-current', 'page')
          if (tab === 'cards') await expect(page.locator('.physical-card-record')).toBeVisible()
          await noOverflow(page, width)
          if (width === 390 || width === 820 || width === 1440) await page.screenshot({ path: test.info().outputPath(`${tab}-${width}.png`), fullPage: true })
          if (width <= 900) {
            if (tab === 'overview') expect((await page.locator('.overview-card-actions button').first().boundingBox())!.height).toBeLessThanOrEqual(80)
            const box = (await button.boundingBox())!
            expect(box.width).toBeGreaterThanOrEqual(44)
            expect(box.height).toBeGreaterThanOrEqual(44)
          }
        }
      }
      await page.setViewportSize({ width: 320, height: 640 })
      await page.locator('.dashboard-nav button').nth(1).click()
      const email = page.getByLabel('Email', { exact: true })
      await expect(email).toHaveAttribute('type', 'email')
      await page.getByLabel(locale === 'ru' ? 'Телефон' : 'Telefon', { exact: true }).fill('+37360123456')
      await page.getByRole('button', { name: locale === 'ru' ? 'Сохранить изменения' : 'Salvează modificările', exact: true }).click()
      await expect(page.locator('.toast')).toBeVisible()
      await page.locator('.editor-actions button').last().click()
      await expect(page.getByRole('dialog')).toBeVisible()
      expect(await page.getByRole('dialog').evaluate(el => el.scrollWidth)).toBeLessThanOrEqual(320)
      await page.screenshot({ path: test.info().outputPath('preview-320.png'), fullPage: true })
      await noOverflow(page, 320)
      await page.locator('.preview-close').click()
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await page.locator('.dashboard-nav button').nth(3).click()
      await page.getByRole('button', { name: locale === 'ru' ? 'Выйти' : 'Ieșire', exact: true }).click()
      await expect(page).toHaveURL(new RegExp(`/${locale}/login$`))
    })
  }
}
