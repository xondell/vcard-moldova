import { expect, it } from 'vitest'
import { emptyProfile, validateProfile } from '../src/lib/profiles'
it('creates blank personal and business profiles without fabricated contact data', () => {
  const personal = emptyProfile('personal', 'alex')
  expect(personal.phone).toBe('')
  expect(personal.socials).toEqual({})
  expect(emptyProfile('business', 'studio')).toMatchObject({ name: '', actions: [], hours: [] })
})
it('rejects unsafe URLs and invalid slugs before persistence', () => {
  const profile = emptyProfile('personal', 'alex')
  expect(() => validateProfile({ ...profile, website: 'javascript:alert(1)' })).toThrow()
  expect(() => validateProfile({ ...profile, slug: 'a/b' })).toThrow()
  expect(() => validateProfile({ ...profile, socials: { telegram: 'data:text/html,test' } })).toThrow()
  expect(validateProfile({ ...profile, fullName: 'Alex', website: 'https://example.md' })).toBeTruthy()
})
it('rejects invalid business action links and non-array hours', () => {
  const profile = emptyProfile('business', 'studio')
  expect(() => validateProfile({ ...profile, actions: [{ label: 'Book', url: 'javascript:alert(1)', icon: 'link' }] })).toThrow()
  expect(() => validateProfile({ ...profile, hours: '09-18' })).toThrow()
})
