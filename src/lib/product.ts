import QRCode from 'qrcode'

export type Locale = 'ru' | 'ro'
export type ProfileType = 'personal' | 'business'
export type Tab = 'overview' | 'profile' | 'cards' | 'settings'

export type SocialLinks = {
  instagram?: string
  telegram?: string
  linkedin?: string
  facebook?: string
  tiktok?: string
  whatsapp?: string
  website?: string
}

export type PersonalProfile = {
  avatarPath?: string
  type: 'personal'
  slug: string
  fullName: string
  title: string
  company: string
  bio: string
  phone: string
  email: string
  website: string
  location: string
  socials: SocialLinks
}

export type BusinessProfile = {
  avatarPath?: string
  coverPath?: string
  type: 'business'
  slug: string
  name: string
  category: string
  description: string
  phone: string
  email: string
  website: string
  address: string
  mapsUrl: string
  hours: string[]
  socials: SocialLinks
  actions: { label: string; url: string; icon: string }[]
}

export type Profile = PersonalProfile | BusinessProfile

export const appUrl = () => {
  const configured = import.meta.env.VITE_APP_URL as string | undefined
  return configured?.replace(/\/$/, '') || window.location.origin
}

export const demoPersonal: PersonalProfile = {
  type: 'personal',
  slug: 'boris-colesov',
  fullName: 'Борис Колесов',
  title: 'Продуктовый дизайнер',
  company: 'Independent / Chișinău',
  bio: 'Помогаю продуктам становиться понятнее, полезнее и красивее. Открыт к новым знакомствам и идеям.',
  phone: '+373 68 420 118',
  email: 'boris@vcard.md',
  website: 'boris.design',
  location: 'Кишинёв, Молдова',
  socials: {
    instagram: 'https://instagram.com/',
    telegram: 'https://t.me/',
    linkedin: 'https://linkedin.com/',
    website: 'https://boris.design'
  }
}

export const demoBusiness: BusinessProfile = {
  type: 'business',
  slug: 'arina-studio',
  name: 'Arina Studio',
  category: 'Beauty & wellness',
  description: 'Тихое пространство для ухода за собой в центре Кишинёва. Запись онлайн — в любое удобное время.',
  phone: '+373 60 555 015',
  email: 'hello@arinastudio.md',
  website: 'arinastudio.md',
  address: 'Strada București 68, Chișinău',
  mapsUrl: 'https://maps.google.com/',
  hours: ['Пн–Пт 09:00–20:00', 'Сб 10:00–18:00', 'Вс закрыто'],
  socials: {
    instagram: 'https://instagram.com/',
    telegram: 'https://t.me/',
    website: 'https://arinastudio.md'
  },
  actions: [
    { label: 'Записаться', url: 'https://example.com/book', icon: 'calendar' },
    { label: 'Написать в WhatsApp', url: 'https://wa.me/37360555015', icon: 'message' }
  ]
}

export const publicProfileUrl = (profile: Profile) => `${appUrl()}/p/${profile.slug}`
export const cardUrl = (cardId = 'VC000123') => `${appUrl()}/c/${cardId}`

export const normalizeSlug = (value: string) => value
  .toLowerCase()
  .trim()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 48)

export const normalizeWebUrl = (value: string): string => {
  // eslint-disable-next-line no-control-regex -- reject control characters before URL parsing removes them
  if (!value || /[\s\u0000-\u001f\u007f]/.test(value) || value.startsWith('//')) return ''
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^https?:\/\//i.test(value)) return ''
  try {
    const parsed = new URL(value.includes('://') ? value : `https://${value}`)
    return ['https:', 'http:'].includes(parsed.protocol) && parsed.hostname && !parsed.username && !parsed.password ? parsed.href : ''
  } catch {
    return ''
  }
}
export const isSafeUrl = (value: string) => Boolean(normalizeWebUrl(value))
export const initials = (name: string) => name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(n => [...n][0]).join('').toUpperCase() || 'VC'

export const displayUrl = (value: string) => value
  .replace(/^https?:\/\//, '')
  .replace(/\/$/, '')

export const socialItems = (socials: SocialLinks) => Object.entries(socials).filter(([, value]) => Boolean(value)) as [keyof SocialLinks, string][]

const vcfEscape = (value: string) => value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/([,;])/g, '\\$1')
export const createVCard = (profile: PersonalProfile) => [
  'BEGIN:VCARD',
  'VERSION:3.0',
  `FN:${vcfEscape(profile.fullName)}`,
  `TITLE:${vcfEscape(profile.title)}`,
  profile.company ? `ORG:${vcfEscape(profile.company)}` : '',
  profile.phone ? `TEL;TYPE=CELL:${vcfEscape(profile.phone)}` : '',
  profile.email ? `EMAIL;TYPE=INTERNET:${vcfEscape(profile.email)}` : '',
  isSafeUrl(profile.website) ? `URL:${vcfEscape(normalizeWebUrl(profile.website))}` : '',
  profile.location ? `ADR;TYPE=WORK:;;${vcfEscape(profile.location)}` : '',
  'END:VCARD'
].filter(Boolean).join('\r\n')

export const downloadText = (filename: string, text: string, mime = 'text/plain;charset=utf-8') => {
  const blob = new Blob([text], { type: mime })
  const href = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(href)
}

export const downloadQr = async (url: string, filename: string) => {
  const dataUrl = await QRCode.toDataURL(url, { width: 1024, margin: 2, color: { dark: '#0F2147', light: '#FFFFFF' } })
  const anchor = document.createElement('a')
  anchor.href = dataUrl
  anchor.download = filename
  anchor.click()
}

export const makeQr = (url: string) => QRCode.toDataURL(url, { width: 360, margin: 2, color: { dark: '#0F2147', light: '#FFFFFF' } })

const copy = {
  ru: {
    navHome: 'Главная', navFeatures: 'Возможности', navHow: 'Как это работает', navExamples: 'Примеры', navFaq: 'FAQ',
    login: 'Войти', start: 'Создать визитку', heroEyebrow: 'Цифровая визитка для нового круга общения',
    heroTitle: 'Твоя визитка.\nТвои правила.', heroText: 'Делись контактами, социальными сетями и информацией о себе или своём бизнесе одним касанием.',
    viewExample: 'Посмотреть пример', trust: 'Один профиль — все способы быть на связи', howEyebrow: 'Как это работает', howTitle: 'От первого знакомства до контакта — за секунды.',
    step1: 'Создай профиль', step1Text: 'Добавь то, чем хочешь поделиться: имя, роль, контакты и свои ссылки.',
    step2: 'Собери свой стиль', step2Text: 'Выбери персональный или бизнес-профиль и покажи главное без лишнего.',
    step3: 'Делись одним касанием', step3Text: 'Ссылка, QR-код или NFC-карта — профиль всегда ведёт к актуальной информации.',
    useCases: 'Для людей и мест', personal: 'Личный профиль', personalText: 'Для нетворкинга, предпринимателей и профессионалов, которые хотят оставаться на связи.',
    business: 'Бизнес-профиль', businessText: 'Для студий, кафе, магазинов и команд, которым важно быть рядом с клиентом.',
    explore: 'Открыть пример', featuresEyebrow: 'Возможности', featuresTitle: 'Всё, что нужно, чтобы вас запомнили.',
    featNfc: 'NFC-ready', featNfcText: 'Физическая карта открывает постоянную ссылку на ваш профиль. Без приложения.',
    featQr: 'QR-код', featQrText: 'Скачайте или покажите QR-код на экране — удобно для встреч и печатных материалов.',
    featEdit: 'Обновляется в реальном времени', featEditText: 'Меняйте роль, ссылки и детали профиля — карта остаётся той же.',
    featContact: 'Сохранение контакта', featContactText: 'Посетитель может скачать vCard и сохранить контакт в один шаг.',
    demoEyebrow: 'Живой пример', demoTitle: 'Профиль, который работает на вас.', demoPersonal: 'Личный', demoBusiness: 'Бизнес',
    nfcEyebrow: 'Одна карта. Один постоянный адрес.', nfcTitle: 'NFC — это не магия. Это быстрый путь к вашему профилю.', nfcText: 'Совместимый смартфон открывает цифровую визитку касанием. Если NFC недоступен, всегда можно использовать QR-код.',
    activate: 'Активировать карту', learnMore: 'Узнать больше', faqEyebrow: 'FAQ', faqTitle: 'Всё важное — коротко.',
    faq1: 'Что такое цифровая визитка?', faq1a: 'Профиль с вашими контактами, ссылками и важной информацией, доступный по одной короткой ссылке.',
    faq2: 'Нужна ли мне NFC-карта?', faq2a: 'Нет. Профиль можно использовать бесплатно по ссылке и QR-коду. NFC — удобный физический носитель.',
    faq3: 'Можно ли изменить профиль после создания?', faq3a: 'Да. Обновления появляются по тому же постоянному адресу, поэтому не нужно перевыпускать QR или карту.',
    faq4: 'Нужен ли аккаунт посетителю?', faq4a: 'Нет. Публичные профили открываются без регистрации.', faq5: 'Как активируется NFC-карта?', faq5a: 'Владелец вводит одноразовый код в защищённой зоне аккаунта. Код не показывается публично.',
    footerLine: 'Профиль, который остаётся актуальным.', footerDemo: 'Демо-режим', footerNote: 'Данные примеров вымышлены. VCard — цифровая идентичность без лишнего.',
    continue: 'Продолжить', email: 'Email', password: 'Пароль', passwordConfirm: 'Повторите пароль', profileType: 'Тип профиля', personalType: 'Личный', businessType: 'Бизнес', activation: 'Код активации NFC-карты', activationHint: 'Необязательно. Карту можно активировать позже.', register: 'Создать аккаунт', already: 'Уже есть аккаунт?', noAccount: 'Нет аккаунта?', dashboard: 'Кабинет', overview: 'Обзор', editProfile: 'Редактировать профиль', cards: 'Мои карты', settings: 'Настройки', logout: 'Выйти', save: 'Сохранить изменения', publish: 'Опубликовать', unpublish: 'Снять с публикации', copyLink: 'Копировать ссылку', openProfile: 'Открыть профиль', profileUrl: 'Публичная ссылка', status: 'Статус публикации', published: 'Опубликован', draft: 'Черновик', qrTitle: 'Ваш QR-код', downloadQr: 'Скачать PNG', downloadContact: 'Сохранить контакт', active: 'Активна', unassigned: 'Не активирована', cardId: 'ID карты', addCard: 'Активировать ещё карту', demoMode: 'Демо-режим', demoModeText: 'Изменения сохраняются в браузере. Supabase подключается на следующем этапе.', saved: 'Сохранено', editorHint: 'Изменения видны в превью сразу — сохраните, когда будете готовы.', fullName: 'Имя и фамилия', title: 'Профессия / роль', company: 'Компания', bio: 'О себе', phone: 'Телефон', website: 'Сайт', location: 'Город', businessName: 'Название компании', category: 'Категория', description: 'Описание', address: 'Адрес', hours: 'Часы работы', cardResolver: 'Эта карта VCard ещё не активирована.', cardResolverText: 'Активируйте карту в кабинете, чтобы постоянная ссылка открывала ваш опубликованный профиль.', goToLogin: 'Войти в кабинет', viewPublic: 'Смотреть публичную страницу'
  },
  ro: {
    navHome: 'Acasă', navFeatures: 'Funcții', navHow: 'Cum funcționează', navExamples: 'Exemple', navFaq: 'FAQ',
    login: 'Intră în cont', start: 'Creează o carte', heroEyebrow: 'Carte de vizită digitală pentru conexiuni care contează',
    heroTitle: 'Cartea ta.\nRegulile tale.', heroText: 'Distribuie contacte, rețele sociale și informații despre tine sau afacerea ta dintr-o singură atingere.',
    viewExample: 'Vezi un exemplu', trust: 'Un profil — toate modurile de a rămâne conectat', howEyebrow: 'Cum funcționează', howTitle: 'De la prima întâlnire la contact — în câteva secunde.',
    step1: 'Creează profilul', step1Text: 'Adaugă ceea ce vrei să distribui: nume, rol, contacte și linkuri.',
    step2: 'Construiește-ți stilul', step2Text: 'Alege profil personal sau business și arată doar ceea ce contează.',
    step3: 'Distribuie printr-o atingere', step3Text: 'Link, cod QR sau card NFC — profilul duce mereu la informația actualizată.',
    useCases: 'Pentru oameni și locuri', personal: 'Profil personal', personalText: 'Pentru networking, antreprenori și profesioniști care vor să rămână conectați.',
    business: 'Profil business', businessText: 'Pentru studiouri, cafenele, magazine și echipe care vor să fie aproape de clienți.',
    explore: 'Deschide exemplul', featuresEyebrow: 'Funcții', featuresTitle: 'Tot ce ai nevoie ca oamenii să te țină minte.',
    featNfc: 'NFC-ready', featNfcText: 'Cardul fizic deschide linkul permanent al profilului. Fără aplicație.',
    featQr: 'Cod QR', featQrText: 'Descarcă sau afișează codul QR — perfect pentru întâlniri și materiale tipărite.',
    featEdit: 'Actualizat în timp real', featEditText: 'Schimbă rolul, linkurile și detaliile — cardul rămâne același.',
    featContact: 'Salvează contactul', featContactText: 'Vizitatorul poate descărca vCard și salva contactul într-un singur pas.',
    demoEyebrow: 'Exemplu viu', demoTitle: 'Un profil care lucrează pentru tine.', demoPersonal: 'Personal', demoBusiness: 'Business',
    nfcEyebrow: 'Un card. O adresă permanentă.', nfcTitle: 'NFC nu este magie. Este calea rapidă către profilul tău.', nfcText: 'Un smartphone compatibil deschide cartea digitală printr-o atingere. Dacă NFC nu este disponibil, folosește codul QR.',
    activate: 'Activează cardul', learnMore: 'Află mai mult', faqEyebrow: 'FAQ', faqTitle: 'Tot ce contează — pe scurt.',
    faq1: 'Ce este o carte de vizită digitală?', faq1a: 'Un profil cu datele de contact, linkurile și informațiile tale, accesibil printr-un singur link.',
    faq2: 'Am nevoie de un card NFC?', faq2a: 'Nu. Profilul poate fi folosit gratuit prin link și cod QR. NFC este un suport fizic comod.',
    faq3: 'Pot edita profilul după creare?', faq3a: 'Da. Actualizările apar la aceeași adresă permanentă, fără să schimbi codul QR sau cardul.',
    faq4: 'Vizitatorul are nevoie de cont?', faq4a: 'Nu. Profilurile publice se deschid fără înregistrare.', faq5: 'Cum se activează cardul NFC?', faq5a: 'Proprietarul introduce codul unic în zona protejată a contului. Codul nu este public.',
    footerLine: 'Un profil care rămâne actual.', footerDemo: 'Mod demo', footerNote: 'Datele de exemplu sunt fictive. VCard — identitate digitală fără zgomot.',
    continue: 'Continuă', email: 'Email', password: 'Parolă', passwordConfirm: 'Repetă parola', profileType: 'Tip profil', personalType: 'Personal', businessType: 'Business', activation: 'Cod de activare NFC', activationHint: 'Opțional. Poți activa cardul mai târziu.', register: 'Creează cont', already: 'Ai deja cont?', noAccount: 'Nu ai cont?', dashboard: 'Panou', overview: 'Sumar', editProfile: 'Editează profilul', cards: 'Cardurile mele', settings: 'Setări', logout: 'Ieșire', save: 'Salvează modificările', publish: 'Publică', unpublish: 'Retrage publicarea', copyLink: 'Copiază linkul', openProfile: 'Deschide profilul', profileUrl: 'Link public', status: 'Status publicare', published: 'Publicat', draft: 'Ciornă', qrTitle: 'Codul tău QR', downloadQr: 'Descarcă PNG', downloadContact: 'Salvează contactul', active: 'Activ', unassigned: 'Neactivat', cardId: 'ID card', addCard: 'Activează alt card', demoMode: 'Mod demo', demoModeText: 'Modificările se salvează în browser. Supabase se conectează în etapa următoare.', saved: 'Salvat', editorHint: 'Modificările apar imediat în previzualizare — salvează când ești gata.', fullName: 'Nume și prenume', title: 'Profesie / rol', company: 'Companie', bio: 'Despre tine', phone: 'Telefon', website: 'Site', location: 'Oraș', businessName: 'Numele companiei', category: 'Categorie', description: 'Descriere', address: 'Adresă', hours: 'Program', cardResolver: 'Acest card VCard nu este încă activat.', cardResolverText: 'Activează cardul din panou pentru ca linkul permanent să deschidă profilul publicat.', goToLogin: 'Intră în panou', viewPublic: 'Vezi pagina publică'
  }
} as const

export type CopyKey = keyof typeof copy.ru
export const t = (locale: Locale, key: CopyKey) => copy[locale][key]
