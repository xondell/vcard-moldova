import { useEffect, useState } from 'react'
import { ArrowRight, Check, Copy, ExternalLink, Globe2, Radio, Settings, UserRound, X, Zap } from 'lucide-react'
import { Logo, MiniProfileCard, LanguageSwitcher } from '../components/Brand'
import { QrPanel, PublicProfile } from '../components/PublicProfile'
import { t, publicProfileUrl, type Locale, type Tab } from '../lib/product'
import { localePath, navigate, switchLocale } from '../lib/navigation'
import { getOwnedProfile, saveOwnedProfile, type OwnedProfile } from '../lib/profiles'
import { requireSupabase } from '../lib/supabase'
import { useAuth } from '../features/auth/AuthProvider'
import { authError } from '../features/auth/validation'
import { ProfileEditor } from '../features/profiles/ProfileEditor'
import { CardsView } from '../features/cards/CardsView'

export function Dashboard({ locale, initialTab }: { locale: Locale; initialTab: Tab }) {
  const { session } = useAuth()
  const [profile, setProfile] = useState<OwnedProfile | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const busy = saving || uploading
  const [preview, setPreview] = useState(false)
  const ro = locale === 'ro'
  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(''), 3500)
    return () => window.clearTimeout(timeout)
  }, [notice])
  useEffect(() => {
    let mounted = true
    getOwnedProfile().then(p => { if (mounted) setProfile(p) }).catch(() => { if (mounted) setError('load_failed') })
    return () => { mounted = false }
  }, [session?.user.id])
  async function logout() {
    const { error } = await requireSupabase().auth.signOut()
    if (error) { setError(authError(error.message, locale)); return }
    navigate(localePath(locale, '/login'))
  }
  async function save(published = profile?.published) {
    if (!profile || busy) return
    setBusy(true); setError(''); setNotice('')
    try {
      const saved = await saveOwnedProfile(profile, published)
      setProfile(saved); setNotice(t(locale, 'saved'))
    } catch (err) {
      const code = (err as { code?: string }).code
      setError(code === '23505' ? (ro ? 'Acest URL este deja folosit.' : 'Этот адрес уже занят.') : (ro ? 'Nu s-a salvat. Verifică numele, URL-urile (https://) și conexiunea.' : 'Не сохранено. Проверьте имя, ссылки (https://) и соединение.'))
    } finally { setBusy(false) }
  }
  if (!profile) return <div className="resolver-page"><div className="resolver-card"><Logo /><p role={error ? 'alert' : 'status'}>{error ? (ro ? 'Profilul nu poate fi încărcat.' : 'Не удалось загрузить профиль.') : (ro ? 'Se încarcă…' : 'Загрузка…')}</p><button className="button button-dark" onClick={logout}>{t(locale, 'logout')}</button></div></div>
  const name = profile.type === 'personal' ? profile.fullName : profile.name
  const url = publicProfileUrl(profile)
  const setTab = (tab: Tab) => navigate(localePath(locale, `/dashboard${tab === 'overview' ? '' : `/${tab}`}`))
  const update = (key: string, value: unknown) => { setNotice(''); setProfile(previous => previous ? { ...previous, [key]: value } as OwnedProfile : null) }
  async function copy() {
    try { await navigator.clipboard.writeText(url); setNotice(ro ? 'Link copiat' : 'Ссылка скопирована') }
    catch { setError(ro ? 'Copiază manual linkul afișat.' : 'Скопируйте показанную ссылку вручную.') }
  }
  return <div className="dashboard-page"><aside className="dashboard-sidebar"><Logo /><div className="sidebar-profile"><div className="avatar avatar-indigo">{name.slice(0, 2).toUpperCase() || 'VC'}</div><div><strong>{name || (ro ? 'Profil nou' : 'Новый профиль')}</strong><small>{t(locale, profile.type === 'personal' ? 'personalType' : 'businessType')}</small></div></div><nav className="dashboard-nav">{([
    ['overview', Zap, 'overview'], ['profile', UserRound, 'editProfile'], ['cards', Radio, 'cards'], ['settings', Settings, 'settings'],
  ] as const).map(([tab, Icon, label]) => <button key={tab} className={`dash-nav-item ${initialTab === tab ? 'active' : ''}`} onClick={() => setTab(tab)}><Icon size={18} /><span>{t(locale, label)}</span></button>)}</nav><div className="sidebar-bottom"><button className="sidebar-locale" onClick={() => navigate(switchLocale(window.location.pathname, '', ro ? 'ru' : 'ro'))}><Globe2 size={16} />{ro ? 'Русский' : 'Română'}</button><button className="sidebar-logout" onClick={logout}><X size={15} />{t(locale, 'logout')}</button></div></aside>
    <main className="dashboard-main"><div className="dashboard-topbar"><div className="mobile-dashboard-brand"><Logo /></div><div><span className="dashboard-kicker">VCard Moldova</span><h1>{name || t(locale, 'dashboard')}</h1></div><LanguageSwitcher locale={locale} /></div>
      <div className="dashboard-content">{error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="toast" role="status">{notice}</p>}
        {initialTab === 'overview' && <div className="overview-view"><div className="page-heading-row"><div><h2>{ro ? 'Cartea ta digitală' : 'Ваша цифровая визитка'}</h2><p>{ro ? 'Salvează, publică și distribuie profilul.' : 'Сохраните, опубликуйте и поделитесь профилем.'}</p></div><button disabled={busy} className={`publish-toggle ${profile.published ? 'is-published' : ''}`} onClick={() => save(!profile.published)}>{t(locale, profile.published ? 'published' : 'draft')}</button></div><div className="overview-grid"><div className="overview-main-card"><div className="overview-card-header"><h3>{name}</h3></div><div className="overview-profile-preview"><MiniProfileCard profile={profile} compact /></div><div className="overview-card-actions"><button className="button button-dark" onClick={() => setTab('profile')}>{t(locale, 'editProfile')}<ArrowRight size={16} /></button><button className="button button-soft" onClick={() => setPreview(true)}>{ro ? 'Previzualizare' : 'Предпросмотр'}</button></div></div><div className="overview-side"><div className="dashboard-url-card"><span className="card-label">{t(locale, 'profileUrl')}</span><div className="url-row"><span>{url}</span><button aria-label={t(locale, 'copyLink')} onClick={copy}><Copy size={16} /></button></div><a href={url} target="_blank" rel="noreferrer">{t(locale, 'viewPublic')}<ExternalLink size={14} /></a><p>{t(locale, profile.published ? 'published' : 'draft')}</p></div><QrPanel url={url} locale={locale} compact /></div></div></div>}
        {initialTab === 'profile' && <><div className="page-heading-row"><div><h2>{t(locale, 'editProfile')}</h2><p>{t(locale, 'editorHint')}</p></div><div className="editor-actions"><button disabled={busy} className="button button-soft" onClick={() => save(!profile.published)}>{t(locale, profile.published ? 'unpublish' : 'publish')}</button><button disabled={busy} className="button button-dark" onClick={() => save()}>{busy ? '…' : t(locale, 'save')}<Check size={16} /></button><button className="button button-soft" onClick={() => setPreview(true)}>{ro ? 'Previzualizare' : 'Предпросмотр'}</button></div></div><ProfileEditor locale={locale} profile={profile} update={update} disabled={saving} onUploadBusyChange={setUploading} /></>}
        {initialTab === 'cards' && <CardsView locale={locale} profileId={profile.id} />}
        {initialTab === 'settings' && <div className="settings-card"><h2>{t(locale, 'settings')}</h2><div className="setting-row"><span>Email</span><strong>{session?.user.email}</strong></div><div className="setting-row"><span>{t(locale, 'profileType')}</span><strong>{t(locale, profile.type === 'personal' ? 'personalType' : 'businessType')}</strong></div><div className="setting-row"><span>{t(locale, 'status')}</span><strong>{t(locale, profile.published ? 'published' : 'draft')}</strong></div><button className="button button-soft" onClick={() => navigate(localePath(locale, '/forgot-password'))}>{ro ? 'Schimbă parola' : 'Изменить пароль'}</button><button className="button button-dark" onClick={logout}>{t(locale, 'logout')}</button></div>}
      </div>
    </main>{preview && <div className="profile-preview-dialog" role="dialog" aria-modal="true" aria-label={ro ? 'Previzualizare' : 'Предпросмотр'}><button className="button button-yellow preview-close" onClick={() => setPreview(false)}><X />{ro ? 'Închide' : 'Закрыть'}</button><PublicProfile locale={locale} profile={profile} /></div>}
  </div>
}
