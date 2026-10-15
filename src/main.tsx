import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight, ArrowUpRight, AtSign, BriefcaseBusiness, CalendarDays, Check, ChevronDown, ChevronRight, CircleHelp,
  Copy, Download, ExternalLink, Globe2, Link2, Mail,
  MapPin, Menu, MessageCircle, MoreHorizontal, Phone, QrCode, Radio, Send, Settings,
  Share2, Sparkles, UserRound, Users, X, Zap
} from 'lucide-react'
import {
  appUrl, cardUrl, createVCard, demoBusiness, demoPersonal, displayUrl, downloadQr,
  downloadText, hasDemoUser, isSafeUrl, Locale, makeQr, normalizeSlug, Profile, profileFromStorage,
  publicProfileUrl, saveProfile, socialItems, Tab, t, ProfileType
} from './lib/product'
import './styles.css'

declare global {
  interface ImportMetaEnv { readonly VITE_APP_URL?: string }
  interface ImportMeta { readonly env: ImportMetaEnv }
}

type IconType = typeof ArrowRight

const navLinks: { key: 'navHome' | 'navFeatures' | 'navHow' | 'navExamples' | 'navFaq'; href: string }[] = [
  { key: 'navHome', href: '#top' }, { key: 'navFeatures', href: '#features' }, { key: 'navHow', href: '#how' },
  { key: 'navExamples', href: '#examples' }, { key: 'navFaq', href: '#faq' }
]

const navigate = (path: string) => {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const localeFromPath = (path: string): Locale => path.startsWith('/ro') ? 'ro' : 'ru'
const baseLocalePath = (locale: Locale) => `/${locale}`
const withLocale = (locale: Locale, path: string) => `${baseLocalePath(locale)}${path}`

function usePath() {
  const [path, setPath] = useState(window.location.pathname)
  useEffect(() => {
    const onChange = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onChange)
    return () => window.removeEventListener('popstate', onChange)
  }, [])
  return path
}

function Logo({ light = false }: { light?: boolean }) {
  return <button className={`brand ${light ? 'brand-light' : ''}`} onClick={() => navigate('/')} aria-label="VCard Moldova home">
    <span className="brand-mark"><span /></span><span className="brand-word">VCard</span><span className="brand-region">MD</span>
  </button>
}

function LanguageSwitcher({ locale }: { locale: Locale }) {
  return <div className="language-switcher" aria-label="Language switcher">
    <button className={locale === 'ru' ? 'active' : ''} onClick={() => navigate(window.location.pathname.replace(/^\/ro/, '/ru') || '/ru')}>RU</button>
    <span>/</span>
    <button className={locale === 'ro' ? 'active' : ''} onClick={() => navigate(window.location.pathname.replace(/^\/ru/, '/ro') || '/ro')}>RO</button>
  </div>
}

function Header({ locale, dark = false }: { locale: Locale; dark?: boolean }) {
  const [open, setOpen] = useState(false)
  return <header className={`site-header ${dark ? 'site-header-dark' : ''}`}>
    <div className="container header-inner">
      <Logo light={dark} />
      <nav className={`main-nav ${open ? 'open' : ''}`}>
        {navLinks.map((link) => <a key={link.href} href={link.href} onClick={() => setOpen(false)}>{t(locale, link.key)}</a>)}
        <div className="mobile-nav-actions"><LanguageSwitcher locale={locale} /><button className="button button-small button-dark" onClick={() => navigate(withLocale(locale, '/login'))}>{t(locale, 'login')}</button></div>
      </nav>
      <div className="header-actions"><LanguageSwitcher locale={locale} /><button className="button button-small button-ghost" onClick={() => navigate(withLocale(locale, '/login'))}>{t(locale, 'login')}</button><button className="button button-small button-yellow" onClick={() => navigate(withLocale(locale, '/register'))}>{t(locale, 'start')} <ArrowUpRight size={15} /></button></div>
      <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label="Open menu">{open ? <X /> : <Menu />}</button>
    </div>
  </header>
}

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return <div className={`eyebrow ${light ? 'eyebrow-light' : ''}`}><span className="eyebrow-dot" />{children}</div>
}

function MiniProfileCard({ profile, compact = false }: { profile: Profile; compact?: boolean }) {
  const isPersonal = profile.type === 'personal'
  return <div className={`mini-card ${isPersonal ? 'mini-personal' : 'mini-business'} ${compact ? 'mini-compact' : ''}`}>
    <div className="mini-card-top"><span className="mini-label">{isPersonal ? 'PERSONAL / VCARD' : 'BUSINESS / VCARD'}</span><MoreHorizontal size={17} /></div>
    {isPersonal ? <>
      <div className="avatar avatar-large avatar-indigo">БК</div>
      <h3>{profile.fullName}</h3><p className="mini-role">{profile.title} <span>·</span> {profile.company}</p>
      <p className="mini-bio">{profile.bio}</p>
      <div className="mini-actions"><span><Phone size={14} /> {profile.phone}</span><span><Mail size={14} /> {profile.email}</span></div>
      <div className="mini-socials"><AtSign size={15} /><Send size={15} /><BriefcaseBusiness size={15} /><span className="mini-link">{displayUrl(profile.website)}</span></div>
    </> : <>
      <div className="business-cover"><div className="business-logo">A</div><span className="cover-pill">OPEN TODAY</span></div>
      <h3>{profile.name}</h3><p className="mini-role">{profile.category}</p><p className="mini-bio">{profile.description}</p>
      <div className="mini-actions"><span><MapPin size={14} /> {profile.address}</span><span><CalendarDays size={14} /> {profile.hours[0]}</span></div>
      <div className="mini-business-actions"><span>Book appointment <ArrowUpRight size={13} /></span><span>Open menu <ArrowUpRight size={13} /></span></div>
    </>}
    <div className="mini-card-footer"><span>vcard.md/p/{profile.slug}</span><span className="status-dot" /></div>
  </div>
}

function AppMetric({ number, label }: { number: string; label: string }) {
  return <div className="metric"><strong>{number}</strong><span>{label}</span></div>
}

function Landing({ locale }: { locale: Locale }) {
  const [demoType, setDemoType] = useState<ProfileType>('personal')
  const [faqOpen, setFaqOpen] = useState(0)
  const demo = demoType === 'personal' ? demoPersonal : demoBusiness
  const featureCards: { icon: IconType; title: string; text: string; className?: string }[] = [
    { icon: Radio, title: t(locale, 'featNfc'), text: t(locale, 'featNfcText'), className: 'feature-yellow' },
    { icon: QrCode, title: t(locale, 'featQr'), text: t(locale, 'featQrText') },
    { icon: Zap, title: t(locale, 'featEdit'), text: t(locale, 'featEditText') },
    { icon: UserRound, title: t(locale, 'featContact'), text: t(locale, 'featContactText') }
  ]
  const faqs = [
    [t(locale, 'faq1'), t(locale, 'faq1a')], [t(locale, 'faq2'), t(locale, 'faq2a')],
    [t(locale, 'faq3'), t(locale, 'faq3a')], [t(locale, 'faq4'), t(locale, 'faq4a')], [t(locale, 'faq5'), t(locale, 'faq5a')]
  ]
  return <div className="page landing-page" id="top">
    <Header locale={locale} />
    <main>
      <section className="hero-section">
        <div className="hero-sun" /><div className="hero-grid" />
        <div className="container hero-grid-layout">
          <div className="hero-copy reveal"><Eyebrow>{t(locale, 'heroEyebrow')}</Eyebrow>
            <h1>{t(locale, 'heroTitle').split('\n').map((line, i) => <span key={line} className={i === 1 ? 'highlight-line' : ''}>{line}</span>)}</h1>
            <p className="hero-text">{t(locale, 'heroText')}</p>
            <div className="hero-actions"><button className="button button-yellow button-large" onClick={() => navigate(withLocale(locale, '/register'))}>{t(locale, 'start')} <ArrowUpRight size={18} /></button><button className="text-button" onClick={() => navigate(withLocale(locale, '/demo'))}>{t(locale, 'viewExample')} <ArrowRight size={17} /></button></div>
            <div className="hero-proof"><div className="proof-avatars"><span>BK</span><span>AS</span><span>+</span></div><span>{t(locale, 'trust')}</span></div>
          </div>
          <div className="hero-visual reveal reveal-delay"><div className="hero-note note-one"><span className="note-icon"><QrCode size={15} /></span><span><strong>QR / NFC</strong><small>one permanent link</small></span></div><div className="hero-note note-two"><span className="note-icon note-icon-yellow"><Check size={15} /></span><span><strong>Always current</strong><small>edit once, share everywhere</small></span></div><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-card-stack"><MiniProfileCard profile={demoPersonal} /></div><div className="hero-tag">01 / 02</div></div>
        </div>
      </section>

      <section className="logo-strip"><div className="container logo-strip-inner"><span className="strip-label">{locale === 'ru' ? 'Для тех, кто ценит хороший контакт' : 'Pentru oamenii care apreciază un contact bun'}</span><div className="strip-items"><span>link <b>first</b></span><span className="strip-divider" /><span>offline <b>friendly</b></span><span className="strip-divider" /><span>made for <b>real life</b></span></div></div></section>

      <section className="section how-section" id="how"><div className="container"><div className="section-intro"><Eyebrow>{t(locale, 'howEyebrow')}</Eyebrow><h2>{t(locale, 'howTitle')}</h2></div><div className="steps-grid">{[
        ["01", t(locale, 'step1'), t(locale, 'step1Text'), UserRound], ["02", t(locale, 'step2'), t(locale, 'step2Text'), Sparkles], ["03", t(locale, 'step3'), t(locale, 'step3Text'), Share2]
      ].map(([number, title, text, Icon]) => <div className="step-card" key={number as string}><div className="step-number">{number as string}</div><div className="step-icon"><Icon size={21} /></div><h3>{title as string}</h3><p>{text as string}</p><ArrowUpRight className="step-arrow" size={19} /></div>)}</div></div></section>

      <section className="section usecases-section" id="examples"><div className="container"><div className="section-heading-row"><div><Eyebrow>{t(locale, 'useCases')}</Eyebrow><h2>{locale === 'ru' ? 'Один продукт.\nДва естественных сценария.' : 'Un produs.\nDouă scenarii naturale.'}</h2></div><button className="text-button" onClick={() => navigate(withLocale(locale, '/demo'))}>{t(locale, 'viewExample')} <ArrowRight size={17} /></button></div><div className="usecases-grid"><div className="usecase-card usecase-personal"><div className="usecase-copy"><span className="usecase-index">01 / PERSONAL</span><h3>{t(locale, 'personal')}</h3><p>{t(locale, 'personalText')}</p><button className="outline-button" onClick={() => navigate('/p/boris-colesov')}>{t(locale, 'explore')} <ArrowUpRight size={16} /></button></div><MiniProfileCard profile={demoPersonal} compact /></div><div className="usecase-card usecase-business"><div className="usecase-copy"><span className="usecase-index">02 / BUSINESS</span><h3>{t(locale, 'business')}</h3><p>{t(locale, 'businessText')}</p><button className="outline-button" onClick={() => navigate('/p/arina-studio')}>{t(locale, 'explore')} <ArrowUpRight size={16} /></button></div><MiniProfileCard profile={demoBusiness} compact /></div></div></div></section>

      <section className="section feature-section" id="features"><div className="container"><div className="section-intro centered"><Eyebrow>{t(locale, 'featuresEyebrow')}</Eyebrow><h2>{t(locale, 'featuresTitle')}</h2></div><div className="features-grid">{featureCards.map(({ icon: Icon, title, text, className }) => <div className={`feature-card ${className || ''}`} key={title}><div className="feature-icon"><Icon size={21} /></div><h3>{title}</h3><p>{text}</p><ArrowUpRight className="feature-arrow" size={17} /></div>)}</div></div></section>

      <section className="section demo-section"><div className="container demo-shell"><div className="demo-copy"><Eyebrow light>{t(locale, 'demoEyebrow')}</Eyebrow><h2>{t(locale, 'demoTitle')}</h2><p>{locale === 'ru' ? 'Посмотри, как один и тот же продукт меняется под разные задачи — от личного знакомства до записи в студию.' : 'Vezi cum același produs se adaptează diferitelor nevoi — de la o întâlnire personală la o programare.'}</p><div className="demo-switch"><button className={demoType === 'personal' ? 'active' : ''} onClick={() => setDemoType('personal')}><UserRound size={16} /> {t(locale, 'demoPersonal')}</button><button className={demoType === 'business' ? 'active' : ''} onClick={() => setDemoType('business')}><Globe2 size={16} /> {t(locale, 'demoBusiness')}</button></div><button className="button button-yellow" onClick={() => navigate(demoType === 'personal' ? '/p/boris-colesov' : '/p/arina-studio')}>{t(locale, 'explore')} <ArrowUpRight size={16} /></button></div><div className="demo-preview"><div className="preview-topline"><span>LIVE PREVIEW</span><span>vcard.md/{demo.slug}</span></div><MiniProfileCard profile={demo} /></div></div></section>

      <section className="section nfc-section"><div className="container nfc-grid"><div className="nfc-visual"><div className="nfc-card"><div className="nfc-chip" /><div className="nfc-wave"><span /><span /><span /></div><div className="nfc-word">VCard</div><div className="nfc-id">VC / 000123</div></div><div className="nfc-link-label"><Link2 size={16} /> vcard.md/c/VC000123</div></div><div className="nfc-copy"><Eyebrow>{t(locale, 'nfcEyebrow')}</Eyebrow><h2>{t(locale, 'nfcTitle')}</h2><p>{t(locale, 'nfcText')}</p><div className="nfc-points"><span><Check size={15} /> {locale === 'ru' ? 'Не требует приложения' : 'Nu necesită aplicație'}</span><span><Check size={15} /> {locale === 'ru' ? 'Постоянная ссылка' : 'Link permanent'}</span><span><Check size={15} /> {locale === 'ru' ? 'QR как альтернатива' : 'QR ca alternativă'}</span></div><button className="text-button" onClick={() => navigate(withLocale(locale, '/register'))}>{t(locale, 'activate')} <ArrowRight size={17} /></button></div></div></section>

      <section className="section faq-section" id="faq"><div className="container faq-grid"><div className="faq-intro"><Eyebrow>{t(locale, 'faqEyebrow')}</Eyebrow><h2>{t(locale, 'faqTitle')}</h2><p>{locale === 'ru' ? 'Понятные ответы на вопросы до первого касания.' : 'Răspunsuri clare înainte de prima atingere.'}</p></div><div className="faq-list">{faqs.map(([question, answer], index) => <div className={`faq-item ${faqOpen === index ? 'open' : ''}`} key={question}><button onClick={() => setFaqOpen(faqOpen === index ? -1 : index)}><span>{question}</span>{faqOpen === index ? <X size={17} /> : <ChevronDown size={17} />}</button>{faqOpen === index && <p>{answer}</p>}</div>)}</div></div></section>

      <section className="cta-section"><div className="container cta-inner"><div><Eyebrow>{locale === 'ru' ? 'Готов к следующему знакомству?' : 'Gata pentru următoarea conexiune?'}</Eyebrow><h2>{locale === 'ru' ? 'Сделай контакт\nсвоим преимуществом.' : 'Transformă fiecare contact\nîntr-un avantaj.'}</h2></div><button className="button button-yellow button-large" onClick={() => navigate(withLocale(locale, '/register'))}>{t(locale, 'start')} <ArrowUpRight size={18} /></button></div></section>
    </main>
    <Footer locale={locale} />
  </div>
}

function Footer({ locale }: { locale: Locale }) {
  return <footer className="site-footer"><div className="container footer-top"><div><Logo light /><p>{t(locale, 'footerLine')}</p></div><div className="footer-links"><div><span>{locale === 'ru' ? 'Навигация' : 'Navigare'}</span><a href="#features">{t(locale, 'navFeatures')}</a><a href="#how">{t(locale, 'navHow')}</a><a href="#faq">{t(locale, 'navFaq')}</a></div><div><span>{locale === 'ru' ? 'Следить' : 'Urmărește'}</span><a href="https://www.instagram.com/vcard.md/" target="_blank" rel="noreferrer"><AtSign size={15} /> Instagram</a><button onClick={() => navigate(withLocale(locale, '/login'))}>{t(locale, 'login')}</button></div></div></div><div className="container footer-bottom"><span>© 2026 VCard Moldova</span><span className="footer-demo"><span className="status-dot" /> {t(locale, 'footerDemo')} · {t(locale, 'footerNote')}</span></div></footer>
}

function AuthView({ locale, mode }: { locale: Locale; mode: 'login' | 'register' }) {
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

function QrPanel({ url, locale, compact = false }: { url: string; locale: Locale; compact?: boolean }) {
  const [src, setSrc] = useState('')
  useEffect(() => { let active = true; makeQr(url).then(value => active && setSrc(value)); return () => { active = false } }, [url])
  return <div className={`qr-panel ${compact ? 'qr-compact' : ''}`}><div className="qr-heading"><span>{t(locale, 'qrTitle')}</span><QrCode size={16} /></div>{src ? <img src={src} alt={`QR code for ${url}`} /> : <div className="qr-placeholder"><QrCode size={28} /></div>}<span className="qr-url">{displayUrl(url)}</span><div className="qr-actions"><button onClick={() => navigator.clipboard?.writeText(url)}><Copy size={14} /> {t(locale, 'copyLink')}</button><button onClick={() => downloadQr(url, 'vcard-qr.png')}><Download size={14} /> {t(locale, 'downloadQr')}</button></div></div>
}

function PublicProfile({ locale, profile }: { locale: Locale; profile: Profile }) {
  const isPersonal = profile.type === 'personal'
  const url = publicProfileUrl(profile)
  const share = async () => { try { await navigator.clipboard.writeText(url) } catch { /* no-op */ } }
  return <div className="public-page"><div className="public-topbar"><Logo /><div className="public-top-actions"><LanguageSwitcher locale={locale} /><button className="icon-button" onClick={share} aria-label="Share profile"><Share2 size={18} /></button></div></div><main className={`public-profile-shell ${isPersonal ? 'public-personal' : 'public-business'}`}>
    {isPersonal ? <div className="public-personal-card"><div className="public-card-top"><span className="mini-label">VCARD / DIGITAL PROFILE</span><button className="icon-button"><MoreHorizontal size={18} /></button></div><div className="public-identity"><div className="avatar avatar-xl avatar-indigo">БК</div><span className="availability"><span className="status-dot" /> {locale === 'ru' ? 'Открыт к новым контактам' : 'Deschis pentru conexiuni'}</span></div><h1>{profile.fullName}</h1><h2>{profile.title} <span>·</span> {profile.company}</h2><p className="public-bio">{profile.bio}</p><div className="public-primary-actions"><a className="button button-dark" href={`tel:${profile.phone}`}><Phone size={17} /> {locale === 'ru' ? 'Позвонить' : 'Sună'}</a><a className="button button-yellow" href={`mailto:${profile.email}`}><Mail size={17} /> Email</a></div><div className="public-info-list"><a href={`tel:${profile.phone}`}><span className="info-icon"><Phone size={16} /></span><span>{profile.phone}<small>{locale === 'ru' ? 'Мобильный' : 'Mobil'}</small></span><ArrowUpRight size={15} /></a><a href={`mailto:${profile.email}`}><span className="info-icon"><Mail size={16} /></span><span>{profile.email}<small>Email</small></span><ArrowUpRight size={15} /></a><div><span className="info-icon"><MapPin size={16} /></span><span>{profile.location}<small>{locale === 'ru' ? 'Локация' : 'Locație'}</small></span></div></div><div className="social-row">{socialItems(profile.socials).map(([name, value]) => <a href={isSafeUrl(value) ? (value.includes('://') ? value : `https://${value}`) : '#'} key={name} target="_blank" rel="noreferrer" aria-label={name}><SocialIcon name={name} /></a>)}</div><div className="public-bottom-actions"><button onClick={() => downloadText(`${normalizeSlug(profile.fullName)}.vcf`, createVCard(profile), 'text/vcard;charset=utf-8')}><Download size={16} /> {t(locale, 'downloadContact')}</button><button onClick={share}><Share2 size={16} /> {t(locale, 'copyLink')}</button></div></div> : <BusinessPublicCard locale={locale} profile={profile} url={url} share={share} />}
    <aside className="public-aside"><QrPanel url={url} locale={locale} compact /><div className="public-aside-note"><Sparkles size={16} /><span>{locale === 'ru' ? 'Демо-профиль VCard Moldova' : 'Profil demo VCard Moldova'}</span></div></aside>
  </main></div>
}

function SocialIcon({ name }: { name: keyof import('./lib/product').SocialLinks }) {
  if (name === 'instagram') return <AtSign size={17} />
  if (name === 'linkedin') return <BriefcaseBusiness size={17} />
  if (name === 'facebook') return <Globe2 size={17} />
  if (name === 'telegram') return <Send size={17} />
  if (name === 'whatsapp') return <MessageCircle size={17} />
  return <Globe2 size={17} />
}

function BusinessPublicCard({ locale, profile, url, share }: { locale: Locale; profile: import('./lib/product').BusinessProfile; url: string; share: () => Promise<void> }) {
  return <div className="business-public-card"><div className="business-public-cover"><div className="cover-graphic"><span /><span /><span /></div><div className="business-public-logo">A</div><span className="cover-status"><span className="status-dot" /> OPEN TODAY</span></div><div className="business-public-content"><span className="mini-label">BUSINESS PROFILE</span><h1>{profile.name}</h1><p className="business-category">{profile.category}</p><p className="public-bio">{profile.description}</p><div className="business-action-grid">{profile.actions.filter(action => isSafeUrl(action.url)).map(action => <a href={action.url} target="_blank" rel="noreferrer" key={action.label} className="button button-yellow"><CalendarDays size={16} /> {action.label}</a>)}</div><div className="business-info-grid"><div><MapPin size={16} /><span>{profile.address}<small>{locale === 'ru' ? 'Открыть в картах' : 'Deschide în hărți'}</small></span></div><div><CalendarDays size={16} /><span>{profile.hours.map((hour) => <small key={hour}>{hour}</small>)}</span></div><div><Phone size={16} /><span>{profile.phone}<small>{locale === 'ru' ? 'Позвонить' : 'Sună'}</small></span></div><div><Globe2 size={16} /><span>{displayUrl(profile.website)}<small>Website</small></span></div></div><div className="social-row">{socialItems(profile.socials).map(([name, value]) => <a href={value} key={name} target="_blank" rel="noreferrer"><SocialIcon name={name} /></a>)}</div><div className="public-bottom-actions"><button onClick={share}><Share2 size={16} /> {t(locale, 'copyLink')}</button><a href={profile.mapsUrl} target="_blank" rel="noreferrer"><MapPin size={16} /> {locale === 'ru' ? 'Маршрут' : 'Direcții'}</a></div></div></div>
}

function Dashboard({ locale, initialTab }: { locale: Locale; initialTab: Tab }) {
  const [profile, setProfile] = useState<Profile>(() => profileFromStorage())
  const [published, setPublished] = useState(() => localStorage.getItem('vcard_published') !== 'false')
  const [active, setActive] = useState<Tab>(initialTab)
  const [toast, setToast] = useState('')
  useEffect(() => setActive(initialTab), [initialTab])
  const setTab = (tab: Tab) => { setActive(tab); navigate(withLocale(locale, `/dashboard${tab === 'overview' ? '' : `/${tab}`}`)) }
  const save = () => { saveProfile(profile); setToast(t(locale, 'saved')); setTimeout(() => setToast(''), 2300) }
  const setPublishedAndPersist = () => { const next = !published; setPublished(next); localStorage.setItem('vcard_published', String(next)); setToast(next ? t(locale, 'published') : t(locale, 'draft')); setTimeout(() => setToast(''), 2300) }
  const update = (key: string, value: string) => setProfile(previous => ({ ...previous, [key]: value } as Profile))
  const profileUrl = publicProfileUrl(profile)
  return <div className="dashboard-page"><aside className="dashboard-sidebar"><Logo /><div className="sidebar-profile"><div className={`avatar ${profile.type === 'business' ? 'avatar-gold' : 'avatar-indigo'}`}>{profile.type === 'business' ? 'A' : 'БК'}</div><div><strong>{profile.type === 'personal' ? profile.fullName : profile.name}</strong><small>{profile.type === 'personal' ? t(locale, 'personalType') : t(locale, 'businessType')}</small></div></div><nav className="dashboard-nav"><span className="nav-section-label">{locale === 'ru' ? 'Кабинет' : 'Panou'}</span><DashNav active={active === 'overview'} icon={Zap} label={t(locale, 'overview')} onClick={() => setTab('overview')} /><DashNav active={active === 'profile'} icon={UserRound} label={t(locale, 'editProfile')} onClick={() => setTab('profile')} /><DashNav active={active === 'cards'} icon={Radio} label={t(locale, 'cards')} onClick={() => setTab('cards')} /><span className="nav-section-label nav-label-spaced">{locale === 'ru' ? 'Аккаунт' : 'Cont'}</span><DashNav active={active === 'settings'} icon={Settings} label={t(locale, 'settings')} onClick={() => setTab('settings')} /></nav><div className="sidebar-bottom"><button className="sidebar-locale" onClick={() => navigate(locale === 'ru' ? '/ro/dashboard' : '/ru/dashboard')}><Globe2 size={16} /> {locale === 'ru' ? 'Română' : 'Русский'}<ChevronRight size={15} /></button><button className="sidebar-logout" onClick={() => { localStorage.removeItem('vcard_user'); navigate('/') }}><X size={15} /> {t(locale, 'logout')}</button></div></aside><main className="dashboard-main"><div className="dashboard-topbar"><div className="mobile-dashboard-brand"><Logo /></div><div><span className="dashboard-kicker">{locale === 'ru' ? 'С возвращением,' : 'Bine ai revenit,'}</span><h1>{profile.type === 'personal' ? profile.fullName.split(' ')[0] : profile.name}</h1></div><div className="dashboard-top-actions"><span className="demo-pill"><span className="status-dot" /> {t(locale, 'demoMode')}</span><button className="icon-button" onClick={() => navigate(profileUrl)}><ExternalLink size={18} /></button><div className="avatar avatar-small avatar-indigo">{profile.type === 'business' ? 'A' : 'БК'}</div></div></div><div className="dashboard-content">{active === 'overview' && <DashboardOverview locale={locale} profile={profile} published={published} onTab={setTab} onTogglePublish={setPublishedAndPersist} onToast={setToast} />}{active === 'profile' && <Editor locale={locale} profile={profile} update={update} save={save} published={published} onTogglePublish={setPublishedAndPersist} />}{active === 'cards' && <CardsView locale={locale} profile={profile} onToast={setToast} />}{active === 'settings' && <SettingsView locale={locale} profile={profile} published={published} onLogout={() => { localStorage.removeItem('vcard_user'); navigate('/') }} />}</div>{toast && <div className="toast"><Check size={16} /> {toast}</div>}</main></div>
}

function DashNav({ active, icon: Icon, label, onClick }: { active: boolean; icon: IconType; label: string; onClick: () => void }) {
  return <button className={`dash-nav-item ${active ? 'active' : ''}`} onClick={onClick}><Icon size={18} /><span>{label}</span>{active && <ChevronRight size={15} />}</button>
}

function DashboardOverview({ locale, profile, published, onTab, onTogglePublish, onToast }: { locale: Locale; profile: Profile; published: boolean; onTab: (tab: Tab) => void; onTogglePublish: () => void; onToast: (value: string) => void }) {
  const url = publicProfileUrl(profile)
  return <div className="overview-view"><div className="page-heading-row"><div><span className="dashboard-kicker">OVERVIEW / 01</span><h2>{locale === 'ru' ? 'Ваша цифровая визитка' : 'Cartea ta digitală'}</h2><p>{locale === 'ru' ? 'Управляйте профилем и делитесь им с миром.' : 'Gestionează profilul și distribuie-l lumii.'}</p></div><button className={`publish-toggle ${published ? 'is-published' : ''}`} onClick={onTogglePublish}><span className="toggle-dot" /> {published ? t(locale, 'published') : t(locale, 'draft')}</button></div><div className="overview-grid"><div className="overview-main-card"><div className="overview-card-header"><div><span className="card-label">{profile.type === 'personal' ? 'PERSONAL PROFILE' : 'BUSINESS PROFILE'}</span><h3>{profile.type === 'personal' ? profile.fullName : profile.name}</h3></div><button className="icon-button" onClick={() => onTab('profile')}><MoreHorizontal size={18} /></button></div><div className="overview-profile-preview"><MiniProfileCard profile={profile} compact /></div><div className="overview-card-actions"><button className="button button-dark" onClick={() => onTab('profile')}>{t(locale, 'editProfile')} <ArrowRight size={16} /></button><button className="button button-soft" onClick={() => navigate(`/p/${profile.slug}`)}>{t(locale, 'openProfile')} <ExternalLink size={15} /></button></div></div><div className="overview-side"><div className="dashboard-url-card"><span className="card-label">{t(locale, 'profileUrl')}</span><div className="url-row"><Link2 size={16} /><span>{displayUrl(url)}</span><button onClick={() => { navigator.clipboard?.writeText(url); onToast(t(locale, 'saved')); }}><Copy size={15} /></button></div><div className="url-card-footer"><span><span className="status-dot" /> HTTPS / PUBLIC</span><button onClick={() => navigate(`/p/${profile.slug}`)}><ExternalLink size={14} /> {t(locale, 'viewPublic')}</button></div></div><QrPanel url={url} locale={locale} compact /></div></div><div className="dashboard-insight-row"><div><div className="insight-icon yellow"><Zap size={18} /></div><div><strong>{locale === 'ru' ? 'Профиль готов к встрече' : 'Profilul este gata de întâlnire'}</strong><p>{locale === 'ru' ? 'Добавьте QR-код в подпись или презентацию.' : 'Adaugă codul QR în semnătură sau prezentare.'}</p></div></div><button className="text-button" onClick={() => onTab('cards')}>{t(locale, 'cards')} <ArrowRight size={15} /></button></div></div>
}

function Editor({ locale, profile, update, save, published, onTogglePublish }: { locale: Locale; profile: Profile; update: (key: string, value: string) => void; save: () => void; published: boolean; onTogglePublish: () => void }) {
  const isPersonal = profile.type === 'personal'
  return <div className="editor-view"><div className="page-heading-row"><div><span className="dashboard-kicker">EDIT PROFILE / 02</span><h2>{t(locale, 'editProfile')}</h2><p>{t(locale, 'editorHint')}</p></div><div className="editor-actions"><button className="button button-soft" onClick={onTogglePublish}>{published ? t(locale, 'unpublish') : t(locale, 'publish')}</button><button className="button button-dark" onClick={save}>{t(locale, 'save')} <Check size={16} /></button></div></div><div className="editor-grid"><div className="form-card"><div className="form-card-header"><span>{isPersonal ? 'PERSONAL DETAILS' : 'BUSINESS DETAILS'}</span><span className="step-counter">01 / 02</span></div><div className="avatar-upload"><div className={`avatar avatar-large ${isPersonal ? 'avatar-indigo' : 'avatar-gold'}`}>{isPersonal ? 'БК' : 'A'}</div><div><strong>{isPersonal ? t(locale, 'fullName') : t(locale, 'businessName')}</strong><button>{locale === 'ru' ? 'Изменить изображение' : 'Schimbă imaginea'} <ArrowUpRight size={13} /></button></div></div>{isPersonal ? <><Field label={t(locale, 'fullName')} value={profile.fullName} onChange={value => update('fullName', value)} /><Field label={t(locale, 'title')} value={profile.title} onChange={value => update('title', value)} /><Field label={t(locale, 'company')} value={profile.company} onChange={value => update('company', value)} /><Field label={t(locale, 'bio')} value={profile.bio} onChange={value => update('bio', value)} textarea /><div className="form-two"><Field label={t(locale, 'phone')} value={profile.phone} onChange={value => update('phone', value)} /><Field label={t(locale, 'email')} value={profile.email} onChange={value => update('email', value)} /></div><div className="form-two"><Field label={t(locale, 'website')} value={profile.website} onChange={value => update('website', value)} /><Field label={t(locale, 'location')} value={profile.location} onChange={value => update('location', value)} /></div></> : <><Field label={t(locale, 'businessName')} value={profile.name} onChange={value => update('name', value)} /><Field label={t(locale, 'category')} value={profile.category} onChange={value => update('category', value)} /><Field label={t(locale, 'description')} value={profile.description} onChange={value => update('description', value)} textarea /><div className="form-two"><Field label={t(locale, 'phone')} value={profile.phone} onChange={value => update('phone', value)} /><Field label={t(locale, 'email')} value={profile.email} onChange={value => update('email', value)} /></div><Field label={t(locale, 'address')} value={profile.address} onChange={value => update('address', value)} /><Field label={t(locale, 'website')} value={profile.website} onChange={value => update('website', value)} /></>}</div><div className="editor-preview"><span className="preview-label">LIVE PREVIEW</span><MiniProfileCard profile={profile} /></div></div></div>
}

function Field({ label, value, onChange, textarea = false }: { label: string; value: string; onChange: (value: string) => void; textarea?: boolean }) {
  return <label className="field-label-wrap"><span>{label}</span>{textarea ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} /> : <input value={value} onChange={e => onChange(e.target.value)} />}</label>
}

function CardsView({ locale, profile, onToast }: { locale: Locale; profile: Profile; onToast: (value: string) => void }) {
  const [activation, setActivation] = useState('')
  const [active, setActive] = useState(false)
  const url = cardUrl('VC000123')
  return <div className="cards-view"><div className="page-heading-row"><div><span className="dashboard-kicker">MY CARDS / 03</span><h2>{t(locale, 'cards')}</h2><p>{locale === 'ru' ? 'Постоянные ссылки для физических карт VCard.' : 'Linkuri permanente pentru cardurile fizice VCard.'}</p></div><span className="card-count">01 CARD</span></div><div className="cards-grid"><div className="physical-card-record"><div className="physical-card-visual"><div className="nfc-card small"><div className="nfc-chip" /><div className="nfc-wave"><span /><span /><span /></div><div className="nfc-word">VCard</div><div className="nfc-id">VC / 000123</div></div></div><div className="physical-card-info"><div><span className="card-label">{t(locale, 'cardId')}</span><strong>VC000123</strong></div><div><span className="card-label">STATUS</span><strong className={active ? 'text-success' : ''}>{active ? t(locale, 'active') : t(locale, 'unassigned')}</strong></div><div><span className="card-label">PUBLIC URL</span><strong>{displayUrl(url)}</strong></div><div className="card-record-actions"><button onClick={() => { navigator.clipboard?.writeText(url); onToast(t(locale, 'saved')) }}><Copy size={15} /> {t(locale, 'copyLink')}</button><button onClick={() => navigate('/c/VC000123')}><QrCode size={15} /> {locale === 'ru' ? 'Открыть URL' : 'Deschide URL'}</button></div></div></div><QrPanel url={url} locale={locale} compact /><div className="activation-card"><div className="activation-header"><div className="insight-icon yellow"><Radio size={17} /></div><div><h3>{t(locale, 'addCard')}</h3><p>{locale === 'ru' ? 'Введите одноразовый код с упаковки карты.' : 'Introdu codul unic de pe ambalajul cardului.'}</p></div></div><div className="activation-form"><input value={activation} onChange={e => setActivation(e.target.value)} placeholder="VCARD-XXXX-XXXX" /><button className="button button-dark" onClick={() => { if (activation.trim()) { setActive(true); onToast(t(locale, 'saved')) } }}>{t(locale, 'activate')} <ArrowRight size={16} /></button></div><span className="security-note"><Check size={14} /> {locale === 'ru' ? 'Код используется один раз и не показывается публично.' : 'Codul este de unică folosință și nu este public.'}</span></div></div></div>
}

function SettingsView({ locale, profile, published, onLogout }: { locale: Locale; profile: Profile; published: boolean; onLogout: () => void }) {
  return <div className="settings-view"><div className="page-heading-row"><div><span className="dashboard-kicker">SETTINGS / 04</span><h2>{t(locale, 'settings')}</h2><p>{locale === 'ru' ? 'Основные параметры аккаунта и профиля.' : 'Parametrii principali ai contului și profilului.'}</p></div></div><div className="settings-card"><SettingRow label={t(locale, 'email')} value="demo@vcard.md" /><SettingRow label={t(locale, 'profileType')} value={profile.type === 'personal' ? t(locale, 'personalType') : t(locale, 'businessType')} /><SettingRow label={t(locale, 'profileUrl')} value={displayUrl(publicProfileUrl(profile))} /><SettingRow label={t(locale, 'status')} value={published ? t(locale, 'published') : t(locale, 'draft')} /><div className="settings-danger"><div><strong>{t(locale, 'logout')}</strong><p>{locale === 'ru' ? 'Завершить локальную демонстрационную сессию.' : 'Încheie sesiunea demo locală.'}</p></div><button className="button button-soft" onClick={onLogout}>{t(locale, 'logout')}</button></div></div></div>
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return <div className="setting-row"><span>{label}</span><strong>{value}</strong><ChevronRight size={16} /></div>
}

function CardResolver({ locale, cardId }: { locale: Locale; cardId: string }) {
  const active = cardId === 'VC000999'
  useEffect(() => {
    if (active) {
      const timer = window.setTimeout(() => navigate('/p/boris-colesov'), 500)
      return () => window.clearTimeout(timer)
    }
  }, [active])
  return <div className="resolver-page"><div className="resolver-glow" /><div className="resolver-card"><Logo /><div className="resolver-icon">{active ? <Radio size={27} /> : <Link2 size={27} />}</div><span className="form-kicker">VCARD / CARD LINK</span><h1>{active ? t(locale, 'cardResolver') : t(locale, 'cardResolver')}</h1><p>{t(locale, 'cardResolverText')}</p><div className="resolver-id"><span>{t(locale, 'cardId')}</span><strong>{cardId}</strong></div><button className="button button-dark button-large full-width" onClick={() => navigate(withLocale(locale, '/register'))}>{t(locale, 'goToLogin')} <ArrowRight size={18} /></button><button className="text-button center-button" onClick={() => navigate('/')}>{locale === 'ru' ? 'На главную' : 'Înapoi acasă'} <ArrowRight size={16} /></button></div><span className="resolver-footer">VCard Moldova · {t(locale, 'footerDemo')}</span></div>
}

function App() {
  const path = usePath()
  const locale = localeFromPath(path)
  const [profile] = useState<Profile>(() => profileFromStorage())
  const isPublic = path.startsWith('/p/')
  const isResolver = path.startsWith('/c/')
  const isAuth = path.endsWith('/login') || path.endsWith('/register')
  const isDashboard = path.includes('/dashboard')
  const isDemo = path.endsWith('/demo')
  if (isPublic) {
    const slug = path.split('/').pop() || ''
    const publicProfile = slug === demoBusiness.slug ? demoBusiness : slug === profile.slug ? profile : demoPersonal
    return <PublicProfile locale={locale} profile={publicProfile} />
  }
  if (isResolver) return <CardResolver locale={locale} cardId={path.split('/').pop() || 'VC000123'} />
  if (isAuth) return <AuthView locale={locale} mode={path.endsWith('/register') ? 'register' : 'login'} />
  if (isDashboard) {
    const tab: Tab = path.endsWith('/profile') ? 'profile' : path.endsWith('/cards') ? 'cards' : path.endsWith('/settings') ? 'settings' : 'overview'
    return <Dashboard locale={locale} initialTab={tab} />
  }
  if (isDemo) return <PublicProfile locale={locale} profile={demoPersonal} />
  return <Landing locale={locale} />
}

if (!hasDemoUser() && window.location.pathname.includes('/dashboard')) navigate('/')

import { createRoot } from 'react-dom/client'
createRoot(document.getElementById('root')!).render(<App />)
