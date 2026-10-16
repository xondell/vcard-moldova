import { useState } from 'react'
import { ArrowUpRight, AtSign, BriefcaseBusiness, CalendarDays, Mail,
  MapPin, Menu, MoreHorizontal, Phone, Send, X
} from 'lucide-react'
import { displayUrl, Locale, Profile, t
} from '../lib/product'


import { navigate, localePath as withLocale, switchLocale } from '../lib/navigation'
const navLinks: { key: 'navHome' | 'navFeatures' | 'navHow' | 'navExamples' | 'navFaq'; href: string }[] = [
  { key: 'navHome', href: '#top' }, { key: 'navFeatures', href: '#features' }, { key: 'navHow', href: '#how' },
  { key: 'navExamples', href: '#examples' }, { key: 'navFaq', href: '#faq' }
]

export function Logo({ light = false }: { light?: boolean }) {
  return <button className={`brand ${light ? 'brand-light' : ''}`} onClick={() => navigate('/')} aria-label="VCard Moldova home">
    <span className="brand-mark"><span /></span><span className="brand-word">VCard</span><span className="brand-region">MD</span>
  </button>
}

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  return <div className="language-switcher" aria-label="Language switcher">
    <button className={locale === 'ru' ? 'active' : ''} onClick={() => navigate(switchLocale(window.location.pathname, window.location.search, 'ru'))}>RU</button>
    <span>/</span>
    <button className={locale === 'ro' ? 'active' : ''} onClick={() => navigate(switchLocale(window.location.pathname, window.location.search, 'ro'))}>RO</button>
  </div>
}

export function Header({ locale, dark = false }: { locale: Locale; dark?: boolean }) {
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

export function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return <div className={`eyebrow ${light ? 'eyebrow-light' : ''}`}><span className="eyebrow-dot" />{children}</div>
}

export function MiniProfileCard({ profile, compact = false }: { profile: Profile; compact?: boolean }) {
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

