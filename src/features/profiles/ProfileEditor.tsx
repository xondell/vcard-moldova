import type { OwnedProfile } from '../../lib/profiles'
import { useState, type ChangeEvent } from 'react'
import { t, normalizeWebUrl, type Locale, type SocialLinks } from '../../lib/product'
import { uploadImage } from '../../lib/media'
import { ProfileImage } from '../../components/ProfileImage'
export function Field({ label, value, onChange, multiline = false, placeholder, url = false }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; placeholder?: string; url?: boolean }) {
  return <label className="field-label-wrap"><span>{label}</span>{multiline ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} maxLength={2048} /> : <input value={value} onChange={e => onChange(e.target.value)} onBlur={() => { if (url && value && normalizeWebUrl(value)) onChange(normalizeWebUrl(value)) }} placeholder={placeholder} maxLength={2048} />}</label>
}
export function ProfileEditor({ locale, profile, update, disabled = false, onUploadBusyChange }: { locale: Locale; profile: OwnedProfile; update: (key: string, value: unknown) => void; disabled?: boolean; onUploadBusyChange?: (busy: boolean) => void }) {
  const ro = locale === 'ro'
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadNotice, setUploadNotice] = useState('')
  const name = profile.type === 'personal' ? profile.fullName : profile.name
  async function upload(event: ChangeEvent<HTMLInputElement>, key: 'avatarPath' | 'coverPath') {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true); onUploadBusyChange?.(true); setUploadError(''); setUploadNotice('')
    try { update(key, await uploadImage(file, profile.id)); setUploadNotice(ro ? 'Imagine încărcată. Salvează modificările.' : 'Изображение загружено. Сохраните изменения.') }
    catch { setUploadError(ro ? 'Încărcarea nu a reușit. Alege JPG, PNG sau WebP, maximum 5 MB.' : 'Загрузка не удалась. Выберите JPG, PNG или WebP до 5 МБ.') }
    finally { setUploading(false); onUploadBusyChange?.(false); event.target.value = '' }
  }
  return <fieldset className="editor-fields" disabled={disabled || uploading}><div className="editor-grid"><div className="form-card">
    <div className="avatar-upload"><ProfileImage path={profile.avatarPath} name={name} className="avatar avatar-large avatar-indigo" /><label className="upload-control">{ro ? 'Fotografie / logo (JPG, PNG, WebP ≤5 MB)' : 'Фото / логотип (JPG, PNG, WebP ≤5 МБ)'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={e => upload(e, 'avatarPath')} /></label>{profile.avatarPath && <button className="inline-link" onClick={() => update('avatarPath', '')}>{ro ? 'Elimină' : 'Удалить'}</button>}</div>
    {profile.type === 'business' && <><label className="upload-control">{ro ? 'Copertă (JPG, PNG, WebP ≤5 MB)' : 'Обложка (JPG, PNG, WebP ≤5 МБ)'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={e => upload(e, 'coverPath')} /></label>{profile.coverPath && <><ProfileImage path={profile.coverPath} name={name} className="editor-cover" cover /><button className="inline-link" onClick={() => update('coverPath', '')}>{ro ? 'Elimină coperta' : 'Удалить обложку'}</button></>}</>}
    {uploading && <p role="status">{ro ? 'Se încarcă imaginea…' : 'Загрузка изображения…'}</p>}{uploadError && <p role="alert" className="form-error">{uploadError}</p>}{uploadNotice && <p role="status">{uploadNotice}</p>}
    <Field label={ro ? 'Adresa profilului (slug)' : 'Адрес профиля (slug)'} value={profile.slug} onChange={value => update('slug', value)} />
    <small>{ro ? '3–48 litere latine mici, cifre și cratime. Schimbarea adresei invalidează linkul vechi; linkul NFC rămâne permanent.' : '3–48 строчных латинских букв, цифр и дефисов. Изменение адреса отключит старую ссылку; NFC-ссылка останется постоянной.'}</small>
    {profile.type === 'personal' ? <>
      <Field label={t(locale, 'fullName')} value={profile.fullName} onChange={v => update('fullName', v)} />
      <Field label={t(locale, 'title')} value={profile.title} onChange={v => update('title', v)} />
      <Field label={t(locale, 'company')} value={profile.company} onChange={v => update('company', v)} />
      <Field label={t(locale, 'bio')} value={profile.bio} onChange={v => update('bio', v)} multiline />
      <Field label={t(locale, 'location')} value={profile.location} onChange={v => update('location', v)} />
    </> : <>
      <Field label={t(locale, 'businessName')} value={profile.name} onChange={v => update('name', v)} />
      <Field label={t(locale, 'category')} value={profile.category} onChange={v => update('category', v)} />
      <Field label={t(locale, 'description')} value={profile.description} onChange={v => update('description', v)} multiline />
      <Field label={t(locale, 'address')} value={profile.address} onChange={v => update('address', v)} />
    </>}
    <Field label={t(locale, 'phone')} value={profile.phone} onChange={v => update('phone', v)} />
    <Field label={t(locale, 'email')} value={profile.email} onChange={v => update('email', v)} />
    <Field label={t(locale, 'website')} value={profile.website} placeholder="https://example.md" onChange={v => update('website', v)} url />
  </div><div className="form-card"><h3>{ro ? 'Rețele sociale și linkuri' : 'Социальные сети и ссылки'}</h3>
    {(['instagram','telegram','linkedin','facebook','tiktok','whatsapp'] as (keyof SocialLinks)[]).map(key => <Field key={key} label={key === 'whatsapp' ? 'WhatsApp (https://wa.me/373...)' : key[0].toUpperCase() + key.slice(1)} value={profile.socials[key] || ''} placeholder="https://" url onChange={value => update('socials', { ...profile.socials, [key]: value })} />)}
    {profile.type === 'business' && <>
      <Field label={ro ? 'Link către hartă' : 'Ссылка на карту'} value={profile.mapsUrl} onChange={v => update('mapsUrl', v)} placeholder="https://maps.google.com/..." url />
      <Field label={t(locale, 'hours')} value={profile.hours.join('\n')} multiline onChange={v => update('hours', v.split('\n'))} />
      <h3>{ro ? 'Butoane: programare, recenzii, meniu' : 'Кнопки: запись, отзывы, меню'}</h3>
      {profile.actions.map((action, index) => <div className="action-editor" key={index}>
        <Field label={ro ? 'Textul butonului' : 'Текст кнопки'} value={action.label} onChange={value => update('actions', profile.actions.map((a,i) => i === index ? { ...a, label: value } : a))} />
        <Field label={ro ? 'Linkul butonului' : 'Ссылка кнопки'} value={action.url} placeholder="https://" url onChange={value => update('actions', profile.actions.map((a,i) => i === index ? { ...a, url: value } : a))} />
        <button className="inline-link" onClick={() => update('actions', profile.actions.filter((_,i) => i !== index))}>{ro ? 'Elimină butonul' : 'Удалить кнопку'}</button>
      </div>)}
      <button className="button button-soft" disabled={profile.actions.length >= 10} onClick={() => update('actions', [...profile.actions, { label: '', url: '', icon: 'link' }])}>{ro ? 'Adaugă buton' : 'Добавить кнопку'}</button>
    </>}
  </div></div></fieldset>
}
