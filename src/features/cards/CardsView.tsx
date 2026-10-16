import { useEffect, useState, type FormEvent } from 'react'
import { activateCard, listCards, setCardEnabled, type PhysicalCard } from '../../lib/cards'
import { cardUrl, t, type Locale } from '../../lib/product'
import { QrPanel } from '../../components/PublicProfile'
export function CardsView({ locale, profileId }: { locale: Locale; profileId: string }) {
  const ro = locale === 'ro'
  const [cards, setCards] = useState<PhysicalCard[]>([])
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let mounted = true
    listCards().then(data => { if (mounted) setCards(data) }).catch(() => { if (mounted) setError(ro ? 'Cardurile nu pot fi încărcate.' : 'Не удалось загрузить карты.') }).finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [ro])
  async function activate(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try {
      await activateCard(code, profileId)
      setCards(await listCards()); setCode(''); setNotice(ro ? 'Card activat.' : 'Карта активирована.')
    } catch (e) { setError(e instanceof Error && e.message === 'rate_limited' ? (ro ? 'Prea multe încercări. Așteaptă 15 minute.' : 'Слишком много попыток. Подождите 15 минут.') : (ro ? 'Cod invalid, deja folosit sau operație indisponibilă.' : 'Код неверен, уже использован или операция недоступна.')) }
    finally { setBusy(false) }
  }
  async function toggle(card: PhysicalCard) {
    setBusy(true); setError(''); setNotice('')
    try { await setCardEnabled(card.id, card.status !== 'active'); setCards(await listCards()) }
    catch { setError(ro ? 'Statusul nu a putut fi schimbat.' : 'Не удалось изменить статус.') }
    finally { setBusy(false) }
  }
  return <div className="cards-view"><div className="page-heading-row"><h2>{t(locale, 'cards')}</h2><span>{cards.length}</span></div><p>{ro ? 'Publicarea profilului nu necesită un card NFC.' : 'Для публикации профиля NFC-карта не нужна.'}</p>{error && <p role="alert" className="form-error">{error}</p>}{notice && <p role="status">{notice}</p>}{loading && <p role="status">…</p>}
    <div className="cards-grid">{cards.map(card => <div className="physical-card-record" key={card.id}><div className="physical-card-visual"><div className="nfc-card small"><div className="nfc-chip" /><div className="nfc-word">VCard</div><div className="nfc-id">{card.public_id}</div></div></div><div className="physical-card-info"><strong>{card.public_id}</strong><p>{card.status === 'active' ? t(locale, 'active') : (ro ? 'Dezactivat' : 'Отключена')}</p><a href={cardUrl(card.public_id)} target="_blank" rel="noreferrer">{cardUrl(card.public_id)}</a><button className="button button-soft" disabled={busy} onClick={() => toggle(card)}>{card.status === 'active' ? (ro ? 'Dezactivează' : 'Отключить') : (ro ? 'Reactivează' : 'Включить')}</button></div><QrPanel url={cardUrl(card.public_id)} locale={locale} compact /></div>)}</div>
    <form className="activation-card" onSubmit={activate}><h3>{t(locale, 'activate')}</h3><p>{t(locale, 'activationHint')}</p><label>{t(locale, 'activation')}<input value={code} onChange={e => setCode(e.target.value)} minLength={20} maxLength={128} autoComplete="off" required /></label><button className="button button-dark" disabled={busy}>{busy ? '…' : t(locale, 'activate')}</button></form>
  </div>
}
