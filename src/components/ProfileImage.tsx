import { useEffect, useState } from 'react'
import { mediaUrl } from '../lib/media'
import { initials } from '../lib/product'
export function ProfileImage({ path = '', name, className = '', cover = false }: { path?: string; name: string; className?: string; cover?: boolean }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    let active = true
    let currentUrl = ''
    setSrc('')
    const refresh = () => { if (path) mediaUrl(path).then(value => {
      if (currentUrl) URL.revokeObjectURL(currentUrl)
      if (active) { currentUrl = value; setSrc(value) } else URL.revokeObjectURL(value)
    }).catch(() => { if (active) { if (currentUrl) URL.revokeObjectURL(currentUrl); setSrc('') } }) }
    refresh()
    const interval = window.setInterval(refresh, 45000)
    return () => { active = false; window.clearInterval(interval); if (currentUrl) URL.revokeObjectURL(currentUrl) }
  }, [path])
  return <div className={`${className} profile-image ${cover ? 'profile-cover-image' : ''}`}>{src ? <img src={src} alt={name} onError={() => setSrc('')} /> : cover ? null : initials(name)}</div>
}
