import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation, useParams, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './features/auth/AuthProvider'
import { isSupabaseConfigured } from './lib/supabase'
import { Landing } from './routes/Landing'
import { AuthView } from './routes/Auth'
import { Dashboard } from './routes/Dashboard'
import { PublicRoute } from './routes/Public'
import { CardResolver } from './routes/CardResolver'
import { PublicProfile } from './components/PublicProfile'
import { Logo } from './components/Brand'
import { demoPersonal, demoBusiness, type Tab } from './lib/product'
import { localeFromLocation } from './lib/navigation'
import './styles.css'

function AppRoutes() {
  const location = useLocation()
  const locale = localeFromLocation(location.pathname, location.search)
  return <Routes>
    <Route path="/" element={<Landing locale={locale} />} />
    <Route path="/:locale" element={<LocaleLanding />} />
    <Route path="/:locale/login" element={<AuthView locale={locale} mode="login" />} />
    <Route path="/:locale/register" element={<AuthView locale={locale} mode="register" />} />
    <Route path="/:locale/forgot-password" element={<AuthView locale={locale} mode="forgot-password" />} />
    <Route path="/:locale/reset-password" element={<AuthView locale={locale} mode="reset-password" />} />
    <Route path="/:locale/dashboard/:tab?" element={<DashboardRoute />} />
    <Route path="/:locale/demo/:type?" element={<DemoRoute />} />
    <Route path="/p/:slug" element={<PublicRoute locale={locale} />} />
    <Route path="/c/:cardId" element={<CardResolver locale={locale} />} />
    <Route path="*" element={<NotFound locale={locale} />} />
  </Routes>
}
function LocaleLanding() {
  const { locale } = useParams()
  return locale === 'ru' || locale === 'ro' ? <Landing locale={locale} /> : <NotFound locale="ru" />
}
function DashboardRoute() {
  const { tab, locale } = useParams()
  const { session, loading } = useAuth()
  if (loading) return <p role="status">…</p>
  if (!session || !isSupabaseConfigured) return <Navigate to={`/${locale === 'ro' ? 'ro' : 'ru'}/login`} replace />
  if (locale !== 'ru' && locale !== 'ro') return <NotFound locale="ru" />
  if (tab && !['overview', 'profile', 'cards', 'settings'].includes(tab)) return <NotFound locale={locale} />
  return <Dashboard locale={locale} initialTab={(tab || 'overview') as Tab} />
}
function DemoRoute() {
  const { locale, type } = useParams()
  return <PublicProfile locale={locale === 'ro' ? 'ro' : 'ru'} profile={type === 'business' ? demoBusiness : demoPersonal} demo />
}
export function NotFound({ locale }: { locale: 'ru' | 'ro' }) {
  return <div className="resolver-page"><div className="resolver-card"><Logo /><h1>404</h1><p>{locale === 'ru' ? 'Страница не найдена или не опубликована.' : 'Pagina nu a fost găsită sau nu este publicată.'}</p><a className="button button-dark" href={`/${locale}`}>{locale === 'ru' ? 'На главную' : 'Acasă'}</a></div></div>
}
createRoot(document.getElementById('root')!).render(<BrowserRouter><AuthProvider><AppRoutes /></AuthProvider></BrowserRouter>)
