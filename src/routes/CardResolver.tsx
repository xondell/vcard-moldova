import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { resolveCard } from '../lib/cards'
import { Logo, LanguageSwitcher } from '../components/Brand'
import { t, type Locale } from '../lib/product'
export function CardResolver({ locale }: { locale: Locale }) {
  const { cardId = '' } = useParams()
  const [result, setResult] = useState<Awaited<ReturnType<typeof resolveCard>>>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  useEffect(() => {
    let mounted = true
    setLoading(true); setResult(null); setError(false)
    resolveCard(cardId).then(data => { if (mounted) setResult(data) }).catch(() => { if (mounted) setError(true) }).finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [cardId])
  if (result?.status === 'active' && result.slug) return <Navigate to={`/p/${encodeURIComponent(result.slug)}?lang=${locale}`} replace />
  const ro = locale === 'ro'
  return <div className="resolver-page"><div className="resolver-card"><Logo /><LanguageSwitcher locale={locale} /><h1>{loading ? '…' : error ? (ro ? 'Conexiune indisponibilă' : 'Соединение недоступно') : result?.status === 'unassigned' ? t(locale, 'cardResolver') : (ro ? 'Card indisponibil' : 'Карта недоступна')}</h1><p>{result?.status === 'unassigned' ? t(locale, 'cardResolverText') : (ro ? 'Cardul sau profilul nu este disponibil public.' : 'Карта или профиль недоступны публично.')}</p><div className="resolver-id"><span>{t(locale, 'cardId')}</span><strong>{cardId}</strong></div>{result?.status === 'unassigned' && <a className="button button-dark" href={`/${locale}/login`}>{t(locale, 'goToLogin')}</a>}{error && <button className="button button-dark" onClick={() => window.location.reload()}>{ro ? 'Reîncearcă' : 'Повторить'}</button>}</div></div>
}
