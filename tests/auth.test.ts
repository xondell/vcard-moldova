import { describe, expect, it } from 'vitest'
import { validateCredentials, authError } from '../src/features/auth/validation'
describe('authentication input', () => {
  it('rejects invalid email and short passwords', () => {
    expect(validateCredentials('wrong', 'longpassword')).toBe('email')
    expect(validateCredentials('a@b.md', '123')).toBe('password')
  })
  it('checks password confirmation only for registration', () => {
    expect(validateCredentials('a@b.md', 'abcdefgh', 'different')).toBe('confirmation')
    expect(validateCredentials('a@b.md', 'abcdefgh')).toBeNull()
  })
  it('localizes errors without leaking backend internals', () => {
    expect(authError('Invalid login credentials', 'ro')).toContain('parola')
    expect(authError('postgres secret internal stack', 'ru')).not.toContain('postgres')
  })
})
