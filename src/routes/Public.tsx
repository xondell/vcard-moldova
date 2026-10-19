import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPublicProfile } from '../lib/profiles'
import { PublicProfile } from '../components/PublicProfile'
import { Logo } from '../components/Brand'
import type { Locale, Profile } from '../lib/product'

export function PublicRoute({ locale }: { locale: Locale }) {
  const { slug = '' } = useParams()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading')
  useEffect(() => {
    let mounted = true
    setStatus('loading')
    const load = () => getPublicProfile(slug).then(p => { if (mounted) { setProfile(p); setStatus(p ? 'ready' : 'missing') } }).catch(() => { if (mounted) { setProfile(null); setStatus('error') } })
    void load()
    window.addEventListener('focus', load)
    return () => { mounted = false; window.removeEventListener('focus', load) }
  }, [slug])
  if (status === 'ready' && profile) return <PublicProfile profile={profile} locale={locale} />
  const ro = locale === 'ro'
  return <div className="resolver-page"><div className="resolver-card"><Logo /><h1>{status === 'missing' ? '404' : 'VCard'}</h1><p role={status === 'error' ? 'alert' : 'status'}>{status === 'loading' ? (ro ? 'Se încarcă…' : 'Загрузка…') : status === 'error' ? (ro ? 'Profilul nu poate fi încărcat. Încearcă din nou.' : 'Не удалось загрузить профиль. Повторите попытку.') : (ro ? 'Profilul nu există sau nu este publicat.' : 'Профиль не найден или не опубликован.')}</p>{status === 'error' && <button className="button button-dark" onClick={() => window.location.reload()}>{ro ? 'Reîncearcă' : 'Повторить'}</button>}<a href={`/${locale}`}>{ro ? 'Acasă' : 'На главную'}</a></div></div>
}
