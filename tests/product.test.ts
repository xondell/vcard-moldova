import { expect, it } from 'vitest'
import { createVCard, demoPersonal, displayUrl, isSafeUrl, normalizeWebUrl, initials } from '../src/lib/product'
it('rejects dangerous schemes instead of prefixing https to them', () => {
  for (const value of ['javascript:alert(1)', 'data:text/html,x', '//evil.md', 'https://user:password@example.md', 'https://example.md\nX']) expect(isSafeUrl(value)).toBe(false)
  expect(normalizeWebUrl('example.md/book')).toBe('https://example.md/book')
  expect(isSafeUrl('https://example.md')).toBe(true)
})
it('escapes every vCard field to prevent injected properties', () => {
  const vcf = createVCard({ ...demoPersonal, fullName: 'A\r\nX-EVIL:yes', title: 'One;Two', phone: '123\r\nEND:VCARD', email: 'x@y.md\nNOTE:evil', company: 'A,B\\C' })
  expect(vcf.match(/\r\nEND:VCARD/g)).toHaveLength(1)
  expect(vcf).not.toContain('\r\nX-EVIL')
  expect(vcf).toContain('TITLE:One\\;Two')
  expect(vcf).toContain('ORG:A\\,B\\\\C')
})
it('shows the real hostname and dynamic initials', () => {
  expect(displayUrl('http://localhost:3000/p/alex')).toBe('localhost:3000/p/alex')
  expect(initials('Ana Maria')).toBe('AM')
  expect(initials('')).toBe('VC')
})
