import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { PublicProfile } from '../src/components/PublicProfile'
import { demoBusiness, demoPersonal } from '../src/lib/product'
afterEach(cleanup)
it('renders saved business contact, hours, action and map without invented status', () => {
  render(<PublicProfile locale="ro" profile={{ ...demoBusiness, name: 'Test Business', email: 'contact@example.md', hours: ['Luni 09–18'], actions: [{ label: 'Recenzii', url: 'https://example.md/reviews', icon: 'link' }] }} />)
  expect(screen.getByRole('heading', { name: 'Test Business' })).toBeTruthy()
  expect(screen.getByRole('link', { name: 'contact@example.md' }).getAttribute('href')).toBe('mailto:contact@example.md')
  expect(screen.getByRole('link', { name: 'Recenzii' }).getAttribute('href')).toBe('https://example.md/reviews')
  expect(screen.getByText('Luni 09–18')).toBeTruthy()
  expect(screen.queryByText('OPEN TODAY')).toBeNull()
})
it('omits unsafe social links and exposes the personal website', () => {
  render(<PublicProfile locale="ru" profile={{ ...demoPersonal, website: 'https://example.md', socials: { telegram: 'javascript:alert(1)' } }} />)
  expect(screen.queryByRole('link', { name: 'telegram' })).toBeNull()
  expect(screen.getByRole('link', { name: 'example.md' }).getAttribute('href')).toBe('https://example.md/')
})
