import { useState } from 'react'
import {
  ArrowRight, ArrowUpRight, AtSign, Check, ChevronDown, Globe2, Link2, QrCode, Radio,
  Share2, Sparkles, UserRound, X, Zap
} from 'lucide-react'
import { demoBusiness, demoPersonal, Locale, t, ProfileType
} from '../lib/product'


import { navigate as navigateTo, localePath as withLocale } from '../lib/navigation'
import { Logo, Header, Eyebrow, MiniProfileCard } from '../components/Brand'
type IconType = typeof ArrowRight
const navigate = navigateTo
export function Landing({ locale }: { locale: Locale }) {
  const navigate = (path: string) => navigateTo(path === '/p/boris-colesov' ? `/${locale}/demo/personal` : path === '/p/arina-studio' ? `/${locale}/demo/business` : path)
  const [demoType, setDemoType] = useState<ProfileType>('personal')
  const [faqOpen, setFaqOpen] = useState(0)
  const demo = demoType === 'personal' ? demoPersonal : demoBusiness
  const featureCards: { icon: IconType; title: string; text: string; className?: string }[] = [
    { icon: Radio, title: t(locale, 'featNfc'), text: t(locale, 'featNfcText'), className: 'feature-yellow' },
    { icon: QrCode, title: t(locale, 'featQr'), text: t(locale, 'featQrText') },
    { icon: Zap, title: t(locale, 'featEdit'), text: t(locale, 'featEditText') },
    { icon: UserRound, title: t(locale, 'featContact'), text: t(locale, 'featContactText') }
  ]
  const faqs = [
    [t(locale, 'faq1'), t(locale, 'faq1a')], [t(locale, 'faq2'), t(locale, 'faq2a')],
    [t(locale, 'faq3'), t(locale, 'faq3a')], [t(locale, 'faq4'), t(locale, 'faq4a')], [t(locale, 'faq5'), t(locale, 'faq5a')]
  ]
  return <div className="page landing-page" id="top">
    <Header locale={locale} />
    <main>
      <section className="hero-section">
        <div className="hero-sun" /><div className="hero-grid" />
        <div className="container hero-grid-layout">
          <div className="hero-copy reveal"><Eyebrow>{t(locale, 'heroEyebrow')}</Eyebrow>
            <h1>{t(locale, 'heroTitle').split('\n').map((line, i) => <span key={line} className={i === 1 ? 'highlight-line' : ''}>{line}</span>)}</h1>
            <p className="hero-text">{t(locale, 'heroText')}</p>
            <div className="hero-actions"><button className="button button-yellow button-large" onClick={() => navigate(withLocale(locale, '/register'))}>{t(locale, 'start')} <ArrowUpRight size={18} /></button><button className="text-button" onClick={() => navigate(withLocale(locale, '/demo'))}>{t(locale, 'viewExample')} <ArrowRight size={17} /></button></div>
            <div className="hero-proof"><div className="proof-avatars"><span>BK</span><span>AS</span><span>+</span></div><span>{t(locale, 'trust')}</span></div>
          </div>
          <div className="hero-visual reveal reveal-delay"><div className="hero-note note-one"><span className="note-icon"><QrCode size={15} /></span><span><strong>QR / NFC</strong><small>one permanent link</small></span></div><div className="hero-note note-two"><span className="note-icon note-icon-yellow"><Check size={15} /></span><span><strong>Always current</strong><small>edit once, share everywhere</small></span></div><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-card-stack"><MiniProfileCard profile={demoPersonal} /></div><div className="hero-tag">01 / 02</div></div>
        </div>
      </section>

      <section className="logo-strip"><div className="container logo-strip-inner"><span className="strip-label">{locale === 'ru' ? 'Для тех, кто ценит хороший контакт' : 'Pentru oamenii care apreciază un contact bun'}</span><div className="strip-items"><span>link <b>first</b></span><span className="strip-divider" /><span>offline <b>friendly</b></span><span className="strip-divider" /><span>made for <b>real life</b></span></div></div></section>

      <section className="section how-section" id="how"><div className="container"><div className="section-intro"><Eyebrow>{t(locale, 'howEyebrow')}</Eyebrow><h2>{t(locale, 'howTitle')}</h2></div><div className="steps-grid">{[
        ["01", t(locale, 'step1'), t(locale, 'step1Text'), UserRound], ["02", t(locale, 'step2'), t(locale, 'step2Text'), Sparkles], ["03", t(locale, 'step3'), t(locale, 'step3Text'), Share2]
      ].map(([number, title, text, Icon]) => <div className="step-card" key={number as string}><div className="step-number">{number as string}</div><div className="step-icon"><Icon size={21} /></div><h3>{title as string}</h3><p>{text as string}</p><ArrowUpRight className="step-arrow" size={19} /></div>)}</div></div></section>

      <section className="section usecases-section" id="examples"><div className="container"><div className="section-heading-row"><div><Eyebrow>{t(locale, 'useCases')}</Eyebrow><h2>{locale === 'ru' ? 'Один продукт.\nДва естественных сценария.' : 'Un produs.\nDouă scenarii naturale.'}</h2></div><button className="text-button" onClick={() => navigate(withLocale(locale, '/demo'))}>{t(locale, 'viewExample')} <ArrowRight size={17} /></button></div><div className="usecases-grid"><div className="usecase-card usecase-personal"><div className="usecase-copy"><span className="usecase-index">01 / PERSONAL</span><h3>{t(locale, 'personal')}</h3><p>{t(locale, 'personalText')}</p><button className="outline-button" onClick={() => navigate('/p/boris-colesov')}>{t(locale, 'explore')} <ArrowUpRight size={16} /></button></div><MiniProfileCard profile={demoPersonal} compact /></div><div className="usecase-card usecase-business"><div className="usecase-copy"><span className="usecase-index">02 / BUSINESS</span><h3>{t(locale, 'business')}</h3><p>{t(locale, 'businessText')}</p><button className="outline-button" onClick={() => navigate('/p/arina-studio')}>{t(locale, 'explore')} <ArrowUpRight size={16} /></button></div><MiniProfileCard profile={demoBusiness} compact /></div></div></div></section>

      <section className="section feature-section" id="features"><div className="container"><div className="section-intro centered"><Eyebrow>{t(locale, 'featuresEyebrow')}</Eyebrow><h2>{t(locale, 'featuresTitle')}</h2></div><div className="features-grid">{featureCards.map(({ icon: Icon, title, text, className }) => <div className={`feature-card ${className || ''}`} key={title}><div className="feature-icon"><Icon size={21} /></div><h3>{title}</h3><p>{text}</p><ArrowUpRight className="feature-arrow" size={17} /></div>)}</div></div></section>

      <section className="section demo-section"><div className="container demo-shell"><div className="demo-copy"><Eyebrow light>{t(locale, 'demoEyebrow')}</Eyebrow><h2>{t(locale, 'demoTitle')}</h2><p>{locale === 'ru' ? 'Посмотри, как один и тот же продукт меняется под разные задачи — от личного знакомства до записи в студию.' : 'Vezi cum același produs se adaptează diferitelor nevoi — de la o întâlnire personală la o programare.'}</p><div className="demo-switch"><button className={demoType === 'personal' ? 'active' : ''} onClick={() => setDemoType('personal')}><UserRound size={16} /> {t(locale, 'demoPersonal')}</button><button className={demoType === 'business' ? 'active' : ''} onClick={() => setDemoType('business')}><Globe2 size={16} /> {t(locale, 'demoBusiness')}</button></div><button className="button button-yellow" onClick={() => navigate(demoType === 'personal' ? '/p/boris-colesov' : '/p/arina-studio')}>{t(locale, 'explore')} <ArrowUpRight size={16} /></button></div><div className="demo-preview"><div className="preview-topline"><span>LIVE PREVIEW</span><span>vcard.md/{demo.slug}</span></div><MiniProfileCard profile={demo} /></div></div></section>

      <section className="section nfc-section"><div className="container nfc-grid"><div className="nfc-visual"><div className="nfc-card"><div className="nfc-chip" /><div className="nfc-wave"><span /><span /><span /></div><div className="nfc-word">VCard</div><div className="nfc-id">VC / 000123</div></div><div className="nfc-link-label"><Link2 size={16} /> vcard.md/c/VC000123</div></div><div className="nfc-copy"><Eyebrow>{t(locale, 'nfcEyebrow')}</Eyebrow><h2>{t(locale, 'nfcTitle')}</h2><p>{t(locale, 'nfcText')}</p><div className="nfc-points"><span><Check size={15} /> {locale === 'ru' ? 'Не требует приложения' : 'Nu necesită aplicație'}</span><span><Check size={15} /> {locale === 'ru' ? 'Постоянная ссылка' : 'Link permanent'}</span><span><Check size={15} /> {locale === 'ru' ? 'QR как альтернатива' : 'QR ca alternativă'}</span></div><button className="text-button" onClick={() => navigate(withLocale(locale, '/register'))}>{t(locale, 'activate')} <ArrowRight size={17} /></button></div></div></section>

      <section className="section faq-section" id="faq"><div className="container faq-grid"><div className="faq-intro"><Eyebrow>{t(locale, 'faqEyebrow')}</Eyebrow><h2>{t(locale, 'faqTitle')}</h2><p>{locale === 'ru' ? 'Понятные ответы на вопросы до первого касания.' : 'Răspunsuri clare înainte de prima atingere.'}</p></div><div className="faq-list">{faqs.map(([question, answer], index) => <div className={`faq-item ${faqOpen === index ? 'open' : ''}`} key={question}><button onClick={() => setFaqOpen(faqOpen === index ? -1 : index)}><span>{question}</span>{faqOpen === index ? <X size={17} /> : <ChevronDown size={17} />}</button>{faqOpen === index && <p>{answer}</p>}</div>)}</div></div></section>

      <section className="cta-section"><div className="container cta-inner"><div><Eyebrow>{locale === 'ru' ? 'Готов к следующему знакомству?' : 'Gata pentru următoarea conexiune?'}</Eyebrow><h2>{locale === 'ru' ? 'Сделай контакт\nсвоим преимуществом.' : 'Transformă fiecare contact\nîntr-un avantaj.'}</h2></div><button className="button button-yellow button-large" onClick={() => navigate(withLocale(locale, '/register'))}>{t(locale, 'start')} <ArrowUpRight size={18} /></button></div></section>
    </main>
    <Footer locale={locale} />
  </div>
}

function Footer({ locale }: { locale: Locale }) {
  return <footer className="site-footer"><div className="container footer-top"><div><Logo light /><p>{t(locale, 'footerLine')}</p></div><div className="footer-links"><div><span>{locale === 'ru' ? 'Навигация' : 'Navigare'}</span><a href="#features">{t(locale, 'navFeatures')}</a><a href="#how">{t(locale, 'navHow')}</a><a href="#faq">{t(locale, 'navFaq')}</a></div><div><span>{locale === 'ru' ? 'Следить' : 'Urmărește'}</span><a href="https://www.instagram.com/vcard.md/" target="_blank" rel="noreferrer"><AtSign size={15} /> Instagram</a><button onClick={() => navigate(withLocale(locale, '/login'))}>{t(locale, 'login')}</button></div></div></div><div className="container footer-bottom"><span>© 2026 VCard Moldova</span><span className="footer-demo"><span className="status-dot" /> {t(locale, 'footerDemo')} · {t(locale, 'footerNote')}</span></div></footer>
}
