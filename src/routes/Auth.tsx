import { useState } from 'react'
import {
  ArrowRight, Check, Globe2, UserRound, X
} from 'lucide-react'
import { demoBusiness, Locale, saveProfile, t, ProfileType
} from '../lib/product'


import { navigate, localePath as withLocale } from '../lib/navigation'
import { Logo, LanguageSwitcher, Eyebrow } from '../components/Brand'
export function AuthView({ locale, mode }: { locale: Locale; mode: 'login' | 'register' }) {
  const [type, setType] = useState<ProfileType>('personal')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!email.includes('@')) return setError(locale === 'ru' ? 'Введите корректный email.' : 'Introdu un email valid.')
    localStorage.setItem('vcard_user', 'demo')
    if (mode === 'register' && type === 'business') saveProfile(demoBusiness)
    navigate(withLocale(locale, '/dashboard'))
  }
  return <div className="auth-page"><div className="auth-side"><Logo light /><div className="auth-side-copy"><Eyebrow light>{locale === 'ru' ? 'Цифровая идентичность' : 'Identitate digitală'}</Eyebrow><h1>{locale === 'ru' ? 'Ваш следующий\nхороший контакт.' : 'Următorul tău\ncontact bun.'}</h1><p>{t(locale, 'heroText')}</p><div className="auth-side-card"><span className="mini-label">PROFILE / ACTIVE</span><div className="auth-side-card-row"><div className="avatar avatar-indigo">БК</div><div><strong>Борис Колесов</strong><small>Product designer</small></div><Check size={18} /></div></div></div><div className="auth-side-footer">VCard Moldova <span>·</span> {locale === 'ru' ? 'демо-просмотр' : 'previzualizare demo'}</div></div><div className="auth-main"><div className="auth-main-top"><LanguageSwitcher locale={locale} /><button className="icon-button" onClick={() => navigate('/')} aria-label="Close"><X size={19} /></button></div><div className="auth-form-wrap"><span className="form-kicker">{mode === 'login' ? 'WELCOME BACK' : 'START HERE'}</span><h2>{mode === 'login' ? t(locale, 'login') : t(locale, 'start')}</h2><p>{mode === 'login' ? t(locale, 'noAccount') : t(locale, 'already')} <button className="inline-link" onClick={() => navigate(withLocale(locale, mode === 'login' ? '/register' : '/login'))}>{mode === 'login' ? t(locale, 'register') : t(locale, 'login')}</button></p><form onSubmit={submit}><label>{t(locale, 'email')}<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.md" required /></label><label>{t(locale, 'password')}<input type="password" placeholder="••••••••" minLength={6} required /></label>{mode === 'register' && <><label>{t(locale, 'passwordConfirm')}<input type="password" placeholder="••••••••" minLength={6} required /></label><div className="field-group"><span className="field-label">{t(locale, 'profileType')}</span><div className="type-picker"><button type="button" className={type === 'personal' ? 'active' : ''} onClick={() => setType('personal')}><UserRound size={16} /> {t(locale, 'personalType')}</button><button type="button" className={type === 'business' ? 'active' : ''} onClick={() => setType('business')}><Globe2 size={16} /> {t(locale, 'businessType')}</button></div></div><label>{t(locale, 'activation')}<input placeholder="VCARD-XXXX-XXXX" /><small>{t(locale, 'activationHint')}</small></label></>} {error && <div className="form-error">{error}</div>}<button className="button button-dark button-large full-width" type="submit">{mode === 'login' ? t(locale, 'login') : t(locale, 'continue')} <ArrowRight size={18} /></button></form><div className="auth-note"><span className="status-dot" /> {t(locale, 'demoMode')}: {locale === 'ru' ? 'без внешних сервисов' : 'fără servicii externe'}</div></div></div></div>
}

