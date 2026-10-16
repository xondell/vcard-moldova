import type { OwnedProfile } from '../../lib/profiles'
import { t, type Locale } from '../../lib/product'
export function Field({ label, value, onChange, multiline = false, placeholder }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; placeholder?: string }) {
  return <label className="field-label-wrap"><span>{label}</span>{multiline ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} maxLength={2048} /> : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} maxLength={2048} />}</label>
}
export function ProfileEditor({ locale, profile, update }: { locale: Locale; profile: OwnedProfile; update: (key: string, value: unknown) => void }) {
  return <div className="editor-grid"><div className="form-card">
    <Field label="URL / slug" value={profile.slug} onChange={value => update('slug', value)} />
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
    <Field label={t(locale, 'website')} value={profile.website} placeholder="https://example.md" onChange={v => update('website', v)} />
  </div></div>
}
