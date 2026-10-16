import { useEffect, useState } from 'react'
import { ArrowUpRight, AtSign, BriefcaseBusiness, CalendarDays,
  Copy, Download, Globe2, Mail,
  MapPin, MessageCircle, MoreHorizontal, Phone, QrCode, Send,
  Share2, Sparkles
} from 'lucide-react'
import { createVCard, displayUrl, downloadQr,
  downloadText, isSafeUrl, Locale, makeQr, normalizeSlug, Profile,
  publicProfileUrl, socialItems, t
} from '../lib/product'


import { Logo, LanguageSwitcher } from './Brand'
export function QrPanel({ url, locale, compact = false }: { url: string; locale: Locale; compact?: boolean }) {
  const [src, setSrc] = useState('')
  useEffect(() => { let active = true; makeQr(url).then(value => active && setSrc(value)); return () => { active = false } }, [url])
  return <div className={`qr-panel ${compact ? 'qr-compact' : ''}`}><div className="qr-heading"><span>{t(locale, 'qrTitle')}</span><QrCode size={16} /></div>{src ? <img src={src} alt={`QR code for ${url}`} /> : <div className="qr-placeholder"><QrCode size={28} /></div>}<span className="qr-url">{displayUrl(url)}</span><div className="qr-actions"><button onClick={() => navigator.clipboard?.writeText(url)}><Copy size={14} /> {t(locale, 'copyLink')}</button><button onClick={() => downloadQr(url, 'vcard-qr.png')}><Download size={14} /> {t(locale, 'downloadQr')}</button></div></div>
}

export function PublicProfile({ locale, profile }: { locale: Locale; profile: Profile }) {
  const isPersonal = profile.type === 'personal'
  const url = publicProfileUrl(profile)
  const share = async () => { try { await navigator.clipboard.writeText(url) } catch { /* no-op */ } }
  return <div className="public-page"><div className="public-topbar"><Logo /><div className="public-top-actions"><LanguageSwitcher locale={locale} /><button className="icon-button" onClick={share} aria-label="Share profile"><Share2 size={18} /></button></div></div><main className={`public-profile-shell ${isPersonal ? 'public-personal' : 'public-business'}`}>
    {isPersonal ? <div className="public-personal-card"><div className="public-card-top"><span className="mini-label">VCARD / DIGITAL PROFILE</span><button className="icon-button"><MoreHorizontal size={18} /></button></div><div className="public-identity"><div className="avatar avatar-xl avatar-indigo">БК</div><span className="availability"><span className="status-dot" /> {locale === 'ru' ? 'Открыт к новым контактам' : 'Deschis pentru conexiuni'}</span></div><h1>{profile.fullName}</h1><h2>{profile.title} <span>·</span> {profile.company}</h2><p className="public-bio">{profile.bio}</p><div className="public-primary-actions"><a className="button button-dark" href={`tel:${profile.phone}`}><Phone size={17} /> {locale === 'ru' ? 'Позвонить' : 'Sună'}</a><a className="button button-yellow" href={`mailto:${profile.email}`}><Mail size={17} /> Email</a></div><div className="public-info-list"><a href={`tel:${profile.phone}`}><span className="info-icon"><Phone size={16} /></span><span>{profile.phone}<small>{locale === 'ru' ? 'Мобильный' : 'Mobil'}</small></span><ArrowUpRight size={15} /></a><a href={`mailto:${profile.email}`}><span className="info-icon"><Mail size={16} /></span><span>{profile.email}<small>Email</small></span><ArrowUpRight size={15} /></a><div><span className="info-icon"><MapPin size={16} /></span><span>{profile.location}<small>{locale === 'ru' ? 'Локация' : 'Locație'}</small></span></div></div><div className="social-row">{socialItems(profile.socials).map(([name, value]) => <a href={isSafeUrl(value) ? (value.includes('://') ? value : `https://${value}`) : '#'} key={name} target="_blank" rel="noreferrer" aria-label={name}><SocialIcon name={name} /></a>)}</div><div className="public-bottom-actions"><button onClick={() => downloadText(`${normalizeSlug(profile.fullName)}.vcf`, createVCard(profile), 'text/vcard;charset=utf-8')}><Download size={16} /> {t(locale, 'downloadContact')}</button><button onClick={share}><Share2 size={16} /> {t(locale, 'copyLink')}</button></div></div> : <BusinessPublicCard locale={locale} profile={profile} url={url} share={share} />}
    <aside className="public-aside"><QrPanel url={url} locale={locale} compact /><div className="public-aside-note"><Sparkles size={16} /><span>{locale === 'ru' ? 'Демо-профиль VCard Moldova' : 'Profil demo VCard Moldova'}</span></div></aside>
  </main></div>
}

function SocialIcon({ name }: { name: keyof import('../lib/product').SocialLinks }) {
  if (name === 'instagram') return <AtSign size={17} />
  if (name === 'linkedin') return <BriefcaseBusiness size={17} />
  if (name === 'facebook') return <Globe2 size={17} />
  if (name === 'telegram') return <Send size={17} />
  if (name === 'whatsapp') return <MessageCircle size={17} />
  return <Globe2 size={17} />
}

function BusinessPublicCard({ locale, profile, share }: { locale: Locale; profile: import('../lib/product').BusinessProfile; url: string; share: () => Promise<void> }) {
  return <div className="business-public-card"><div className="business-public-cover"><div className="cover-graphic"><span /><span /><span /></div><div className="business-public-logo">A</div><span className="cover-status"><span className="status-dot" /> OPEN TODAY</span></div><div className="business-public-content"><span className="mini-label">BUSINESS PROFILE</span><h1>{profile.name}</h1><p className="business-category">{profile.category}</p><p className="public-bio">{profile.description}</p><div className="business-action-grid">{profile.actions.filter(action => isSafeUrl(action.url)).map(action => <a href={action.url} target="_blank" rel="noreferrer" key={action.label} className="button button-yellow"><CalendarDays size={16} /> {action.label}</a>)}</div><div className="business-info-grid"><div><MapPin size={16} /><span>{profile.address}<small>{locale === 'ru' ? 'Открыть в картах' : 'Deschide în hărți'}</small></span></div><div><CalendarDays size={16} /><span>{profile.hours.map((hour) => <small key={hour}>{hour}</small>)}</span></div><div><Phone size={16} /><span>{profile.phone}<small>{locale === 'ru' ? 'Позвонить' : 'Sună'}</small></span></div><div><Globe2 size={16} /><span>{displayUrl(profile.website)}<small>Website</small></span></div></div><div className="social-row">{socialItems(profile.socials).map(([name, value]) => <a href={value} key={name} target="_blank" rel="noreferrer"><SocialIcon name={name} /></a>)}</div><div className="public-bottom-actions"><button onClick={share}><Share2 size={16} /> {t(locale, 'copyLink')}</button><a href={profile.mapsUrl} target="_blank" rel="noreferrer"><MapPin size={16} /> {locale === 'ru' ? 'Маршрут' : 'Direcții'}</a></div></div></div>
}
