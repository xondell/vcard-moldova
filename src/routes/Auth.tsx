import { useState, type FormEvent } from 'react'
import { X, ArrowRight } from 'lucide-react'
import { Logo, LanguageSwitcher, Eyebrow } from '../components/Brand'
import { t, appUrl, type Locale, type ProfileType } from '../lib/product'
import { localePath, navigate } from '../lib/navigation'
import { requireSupabase, isSupabaseConfigured } from '../lib/supabase'
import { authError, validateCredentials } from '../features/auth/validation'
import { useAuth } from '../features/auth/AuthProvider'

type Mode = 'login' | 'register' | 'forgot-password' | 'reset-password'
export function AuthView({ locale, mode }: { locale: Locale; mode: Mode }) {
  const ro = locale === 'ro'
  const { recoveryVerified } = useAuth()
  const [type, setType] = useState<ProfileType>('personal')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [activation, setActivation] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const heading = mode === 'forgot-password' ? (ro ? 'Recuperează accesul' : 'Восстановить доступ') : mode === 'reset-password' ? (ro ? 'Parolă nouă' : 'Новый пароль') : t(locale, mode === 'login' ? 'login' : 'register')
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setMessage('')
    const validation = mode === 'forgot-password' ? null : validateCredentials(mode === 'reset-password' ? 'reset@example.md' : email, password, mode === 'register' || mode === 'reset-password' ? confirmation : undefined)
    if (validation) {
      setError(validation === 'confirmation' ? (ro ? 'Parolele nu coincid.' : 'Пароли не совпадают.') : validation === 'password' ? (ro ? 'Parola trebuie să aibă 8–128 de caractere.' : 'Пароль должен содержать 8–128 символов.') : (ro ? 'Introdu un email valid.' : 'Введите корректный email.'))
      return
    }
    setBusy(true)
    try {
      const client = requireSupabase()
      if (mode === 'forgot-password') {
        const { error } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${appUrl()}/${locale}/reset-password` })
        if (error) throw error
        setMessage(ro ? 'Dacă există un cont, vei primi un email de recuperare.' : 'Если аккаунт существует, вы получите письмо для восстановления.')
      } else if (mode === 'reset-password') {
        if (!recoveryVerified) throw new Error('recovery_required')
        const { error } = await client.auth.updateUser({ password })
        if (error) throw error
        navigate(localePath(locale, '/dashboard'))
      } else if (mode === 'register') {
        const { data, error } = await client.auth.signUp({ email: email.trim(), password, options: { data: { profile_type: type }, emailRedirectTo: `${appUrl()}/${locale}/dashboard` } })
        if (error) throw error
        // The optional secret never goes into account metadata, a URL, or persistent browser storage.
        if (data.session) {
          if (activation.trim()) {
            const { data: profile } = await client.from('profiles').select('id').single()
            if (profile) {
              const { data: activationResult, error: activationError } = await client.rpc('activate_card', { activation_code: activation.trim(), target_profile: profile.id })
              if (activationError || activationResult?.error) { setMessage(ro ? 'Cont creat. Activează cardul din panou.' : 'Аккаунт создан. Активируйте карту в кабинете.'); navigate(localePath(locale, '/dashboard/cards')); return }
            }
          }
          navigate(localePath(locale, '/dashboard'))
        } else setMessage(ro ? 'Verifică emailul pentru confirmare. După autentificare poți activa cardul din panou.' : 'Подтвердите email по ссылке в письме. После входа можно активировать карту в кабинете.')
      } else {
        const { error } = await client.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
        navigate(localePath(locale, '/dashboard'))
      }
    } catch (err) { setError(authError(err instanceof Error ? err.message : '', locale)) }
    finally { setBusy(false); setActivation('') }
  }
  return <div className="auth-page"><div className="auth-side"><Logo light /><div className="auth-side-copy"><Eyebrow light>{ro ? 'Identitate digitală' : 'Цифровая идентичность'}</Eyebrow><h1>{ro ? 'Următorul tău\ncontact bun.' : 'Ваш следующий\nхороший контакт.'}</h1><p>{t(locale, 'heroText')}</p></div><div className="auth-side-footer">VCard Moldova</div></div>
    <div className="auth-main"><div className="auth-main-top"><LanguageSwitcher locale={locale} /><button className="icon-button" onClick={() => navigate(`/${locale}`)} aria-label={ro ? 'Închide' : 'Закрыть'}><X size={19} /></button></div><div className="auth-form-wrap"><h2>{heading}</h2>
      {(mode === 'login' || mode === 'register') && <p>{t(locale, mode === 'login' ? 'noAccount' : 'already')} <button className="inline-link" onClick={() => navigate(localePath(locale, mode === 'login' ? '/register' : '/login'))}>{t(locale, mode === 'login' ? 'register' : 'login')}</button></p>}
      {!isSupabaseConfigured && <p role="alert" className="form-error">{authError('configuration', locale)}</p>}
      {mode === 'reset-password' && !recoveryVerified && <><p role="alert" className="form-error">{ro ? 'Linkul de recuperare este invalid sau expirat. Solicită un link nou pentru contul dorit.' : 'Ссылка восстановления недействительна или истекла. Запросите новую ссылку для нужного аккаунта.'}</p><button className="inline-link" onClick={() => navigate(localePath(locale, '/forgot-password'))}>{ro ? 'Recuperează accesul' : 'Восстановить доступ'}</button></>}
      <form onSubmit={submit}>
        {mode !== 'reset-password' && <label>{t(locale, 'email')}<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required maxLength={254} /></label>}
        {mode !== 'forgot-password' && <label>{t(locale, 'password')}<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} minLength={8} maxLength={128} required /></label>}
        {(mode === 'register' || mode === 'reset-password') && <label>{t(locale, 'passwordConfirm')}<input type="password" autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} minLength={8} maxLength={128} required /></label>}
        {mode === 'register' && <><div className="field-group"><span className="field-label">{t(locale, 'profileType')}</span><div className="type-picker">{(['personal', 'business'] as const).map(value => <button key={value} type="button" className={type === value ? 'active' : ''} onClick={() => setType(value)}>{t(locale, value === 'personal' ? 'personalType' : 'businessType')}</button>)}</div></div><label>{t(locale, 'activation')}<input value={activation} onChange={e => setActivation(e.target.value)} maxLength={128} autoComplete="off" /><small>{t(locale, 'activationHint')}</small></label></>}
        {error && <p role="alert" className="form-error">{error}</p>}{message && <p role="status">{message}</p>}
        <button disabled={busy || !isSupabaseConfigured || mode === 'reset-password' && !recoveryVerified} className="button button-dark button-large full-width">{busy ? (ro ? 'Se procesează…' : 'Обработка…') : heading} <ArrowRight size={17} /></button>
      </form>{mode === 'login' && <button className="inline-link" onClick={() => navigate(localePath(locale, '/forgot-password'))}>{ro ? 'Ai uitat parola?' : 'Забыли пароль?'}</button>}
    </div></div></div>
}
