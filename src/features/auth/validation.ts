import type { Locale } from '../../lib/product'
export function validateCredentials(email: string, password: string, confirmation?: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'email'
  if (password.length < 8 || password.length > 128) return 'password'
  if (confirmation !== undefined && password !== confirmation) return 'confirmation'
  return null
}
export function authError(message: string, locale: Locale) {
  const ro = locale === 'ro'
  if (/configuration/i.test(message)) return ro ? 'Supabase nu este configurat. Contactează administratorul.' : 'Supabase не настроен. Обратитесь к администратору.'
  if (/invalid login|credentials/i.test(message)) return ro ? 'Verifică emailul și parola.' : 'Проверьте email и пароль.'
  if (/confirm/i.test(message)) return ro ? 'Confirmă adresa de email înainte de autentificare.' : 'Подтвердите адрес email перед входом.'
  if (/rate|too many|seconds/i.test(message)) return ro ? 'Prea multe încercări. Încearcă mai târziu.' : 'Слишком много попыток. Повторите позже.'
  if (/registered|already/i.test(message)) return ro ? 'Contul există deja. Încearcă autentificarea.' : 'Аккаунт уже существует. Попробуйте войти.'
  return ro ? 'Operația nu a reușit. Verifică conexiunea și încearcă din nou.' : 'Операция не выполнена. Проверьте соединение и повторите.'
}
