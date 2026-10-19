import { describe, expect, it } from 'vitest'
import { localePath, switchLocale, localeFromLocation } from '../src/lib/navigation'
describe('locale routing', () => {
  it('switches root and localized dashboard without losing the route', () => {
    expect(switchLocale('/', '', 'ro')).toBe('/ro')
    expect(switchLocale('/ru/dashboard/cards', '', 'ro')).toBe('/ro/dashboard/cards')
  })
  it('preserves permanent public URLs and query parameters', () => {
    expect(switchLocale('/p/alex', '?x=1', 'ro')).toBe('/p/alex?x=1&lang=ro')
    expect(switchLocale('/c/VC000123', '', 'ru')).toBe('/c/VC000123?lang=ru')
    expect(localeFromLocation('/p/alex', '?lang=ro')).toBe('ro')
  })
  it('builds locale routes', () => expect(localePath('ro', '/login')).toBe('/ro/login'))
})
