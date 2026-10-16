import type { Locale } from './product'
export const localePath = (locale: Locale, path = '') => `/${locale}${path}`
export function localeFromLocation(path: string, search = ''): Locale {
  return path.startsWith('/ro') || new URLSearchParams(search).get('lang') === 'ro' ? 'ro' : 'ru'
}
export function switchLocale(path: string, search: string, locale: Locale) {
  if (/^\/(p|c)\//.test(path)) {
    const params = new URLSearchParams(search)
    params.set('lang', locale)
    return `${path}?${params}`
  }
  return `/${locale}${path.replace(/^\/(ru|ro)(?=\/|$)/, '').replace(/^\/$/, '')}${search}`
}
export function navigate(path: string) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
