import { useEffect, useState } from 'react'
import { ArrowUpRight, AtSign, BriefcaseBusiness, CalendarDays, Copy, Download, Globe2, Mail, MapPin, MessageCircle, Phone, QrCode, Send, Share2 } from 'lucide-react'
import { createVCard, displayUrl, downloadQr, downloadText, normalizeWebUrl, type Locale, makeQr, normalizeSlug, type Profile, publicProfileUrl, socialItems, t, type SocialLinks } from '../lib/product'
import { Logo, LanguageSwitcher } from './Brand'
import { ProfileImage } from './ProfileImage'

export function QrPanel({ url, locale, compact = false }: { url: string; locale: Locale; compact?: boolean }) {
  const [src, setSrc] = useState('')
  const [notice, setNotice] = useState('')
  const ro = locale === 'ro'
  useEffect(() => { let active = true; setSrc(''); makeQr(url).then(value => { if (active) setSrc(value) }).catch(() => { if (active) setNotice(ro ? 'Codul QR nu poate fi generat.' : 'Не удалось создать QR.') }); return () => { active = false } }, [url, ro])
  async function copy() {
    try { await navigator.clipboard.writeText(url); setNotice(ro ? 'Link copiat' : 'Ссылка скопирована') }
    catch { setNotice(ro ? 'Copiază manual linkul afișat.' : 'Скопируйте показанную ссылку вручную.') }
  }
  async function download() {
    try { await downloadQr(url, 'vcard-qr.png') }
    catch { setNotice(ro ? 'Descărcarea nu a reușit.' : 'Не удалось скачать PNG.') }
  }
  return <div className={`qr-panel ${compact ? 'qr-compact' : ''}`}><div className="qr-heading"><span>{t(locale, 'qrTitle')}</span><QrCode size={16} /></div>{src ? <img src={src} alt={`QR: ${url}`} /> : <div className="qr-placeholder"><QrCode size={28} /></div>}<span className="qr-url">{displayUrl(url)}</span><div className="qr-actions"><button onClick={copy}><Copy size={14} />{t(locale, 'copyLink')}</button><button onClick={download}><Download size={14} />{t(locale, 'downloadQr')}</button></div>{notice && <p role="status">{notice}</p>}</div>
}
export function PublicProfile({ locale, profile, demo = false }: { locale: Locale; profile: Profile; demo?: boolean }) {
  const ro = locale === 'ro'
  const url = demo ? `${window.location.origin}/${locale}/demo/${profile.type}` : publicProfileUrl(profile)
  const [notice, setNotice] = useState('')
  async function share() {
    try { await navigator.clipboard.writeText(url); setNotice(ro ? 'Link copiat' : 'Ссылка скопирована') }
    catch { setNotice(url) }
  }
  return <div className="public-page"><div className="public-topbar"><Logo /><div className="public-top-actions"><LanguageSwitcher locale={locale} /><button className="icon-button" onClick={share} aria-label={t(locale, 'copyLink')}><Share2 size={18} /></button></div></div>{notice && <p className="public-notice" role="status">{notice}</p>}
    <main className={`public-profile-shell ${profile.type === 'personal' ? 'public-personal' : 'public-business'}`}>
      {profile.type === 'personal' ? <div className="public-personal-card"><div className="public-card-top"><span className="mini-label">VCARD / {t(locale, 'personalType')}</span></div><div className="public-identity"><ProfileImage path={profile.avatarPath} name={profile.fullName} className="avatar avatar-xl avatar-indigo" /></div><h1>{profile.fullName}</h1><h2>{[profile.title, profile.company].filter(Boolean).join(' · ')}</h2>{profile.bio && <p className="public-bio">{profile.bio}</p>}
        <div className="public-primary-actions">{profile.phone && <a className="button button-dark" href={`tel:${profile.phone.replace(/[^+\d]/g, '')}`}><Phone size={17} />{ro ? 'Sună' : 'Позвонить'}</a>}{profile.email && <a className="button button-yellow" href={`mailto:${profile.email}`}><Mail size={17} />Email</a>}</div>
        <div className="public-info-list">{profile.phone && <a href={`tel:${profile.phone.replace(/[^+\d]/g, '')}`}><span className="info-icon"><Phone size={16} /></span><span>{profile.phone}<small>{t(locale, 'phone')}</small></span><ArrowUpRight size={15} /></a>}{profile.email && <a href={`mailto:${profile.email}`}><span className="info-icon"><Mail size={16} /></span><span>{profile.email}<small>Email</small></span><ArrowUpRight size={15} /></a>}{profile.location && <div><span className="info-icon"><MapPin size={16} /></span><span>{profile.location}<small>{t(locale, 'location')}</small></span></div>}{normalizeWebUrl(profile.website) && <a href={normalizeWebUrl(profile.website)} target="_blank" rel="noreferrer"><span className="info-icon"><Globe2 size={16} /></span><span>{displayUrl(profile.website)}</span><ArrowUpRight size={15} /></a>}</div>
        <SocialRow socials={profile.socials} /><div className="public-bottom-actions"><button onClick={() => downloadText(`${normalizeSlug(profile.fullName) || 'contact'}.vcf`, createVCard(profile), 'text/vcard;charset=utf-8')}><Download size={16} />{t(locale, 'downloadContact')}</button><button onClick={share}><Share2 size={16} />{t(locale, 'copyLink')}</button></div>
      </div> : <div className="business-public-card"><div className="business-public-cover">{profile.coverPath ? <ProfileImage path={profile.coverPath} name={profile.name} className="business-cover-photo" cover /> : <div className="cover-graphic"><span /><span /><span /></div>}<ProfileImage path={profile.avatarPath} name={profile.name} className="business-public-logo" /></div><div className="business-public-content"><span className="mini-label">VCARD / {t(locale, 'businessType')}</span><h1>{profile.name}</h1><p className="business-category">{profile.category}</p><p className="public-bio">{profile.description}</p><div className="business-action-grid">{profile.actions.filter(a => normalizeWebUrl(a.url)).map((a,i) => <a key={i} className="button button-yellow" href={normalizeWebUrl(a.url)} target="_blank" rel="noreferrer"><CalendarDays size={16} />{a.label}</a>)}</div>
        <div className="business-info-grid">{profile.address && <div><MapPin size={16} /><span>{profile.address}</span></div>}{profile.hours.length > 0 && <div><CalendarDays size={16} /><span>{profile.hours.map((hour,i) => <small key={i}>{hour}</small>)}</span></div>}{profile.phone && <a href={`tel:${profile.phone.replace(/[^+\d]/g, '')}`}><Phone size={16} /><span>{profile.phone}</span></a>}{profile.email && <a href={`mailto:${profile.email}`}><Mail size={16} /><span>{profile.email}</span></a>}{normalizeWebUrl(profile.website) && <a href={normalizeWebUrl(profile.website)} target="_blank" rel="noreferrer"><Globe2 size={16} /><span>{displayUrl(profile.website)}</span></a>}</div>
        <SocialRow socials={profile.socials} /><div className="public-bottom-actions"><button onClick={share}><Share2 size={16} />{t(locale, 'copyLink')}</button>{normalizeWebUrl(profile.mapsUrl) && <a href={normalizeWebUrl(profile.mapsUrl)} target="_blank" rel="noreferrer"><MapPin size={16} />{ro ? 'Direcții' : 'Маршрут'}</a>}</div>
      </div></div>}
      <aside className="public-aside"><QrPanel url={url} locale={locale} compact />{demo && <div className="public-aside-note">{ro ? 'Exemplu fictiv — nu este un profil real' : 'Вымышленный пример — не настоящий профиль'}</div>}</aside>
    </main></div>
}
function SocialRow({ socials }: { socials: SocialLinks }) {
  return <div className="social-row">{socialItems(socials).filter(([,value]) => normalizeWebUrl(value)).map(([name,value]) => <a href={normalizeWebUrl(value)} key={name} target="_blank" rel="noreferrer" aria-label={name}><SocialIcon name={name} /></a>)}</div>
}
function SocialIcon({ name }: { name: keyof SocialLinks }) {
  if (name === 'instagram') return <AtSign size={17} />
  if (name === 'linkedin') return <BriefcaseBusiness size={17} />
  if (name === 'telegram') return <Send size={17} />
  if (name === 'whatsapp') return <MessageCircle size={17} />
  return <Globe2 size={17} />
}
