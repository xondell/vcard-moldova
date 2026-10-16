import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Dashboard } from '../src/routes/Dashboard'
import { getOwnedProfile, saveOwnedProfile, emptyProfile } from '../src/lib/profiles'
vi.mock('../src/lib/profiles', async importOriginal => ({ ...await importOriginal<typeof import('../src/lib/profiles')>(), getOwnedProfile: vi.fn(), saveOwnedProfile: vi.fn() }))
const fixture = { ...emptyProfile('personal','test-profile'), id:'test-id', published:false, fullName:'Saved name' }
beforeEach(() => { vi.mocked(getOwnedProfile).mockReset().mockResolvedValue(fixture); vi.mocked(saveOwnedProfile).mockReset() })
afterEach(cleanup)
it('prevents a pending save from overwriting edits typed after submission', async () => {
  let finish!: (value: typeof fixture) => void
  vi.mocked(saveOwnedProfile).mockImplementation(() => new Promise(resolve => { finish=resolve }))
  render(<Dashboard locale="ru" initialTab="profile" />)
  const input = await screen.findByLabelText('Имя и фамилия') as HTMLInputElement
  fireEvent.change(input,{target:{value:'Submitted name'}})
  fireEvent.click(screen.getByRole('button',{name:'Сохранить изменения',exact:true}))
  expect(input.matches(':disabled')).toBe(true)
  await act(async()=>finish({...fixture,fullName:'Submitted name'}))
  expect(input.matches(':disabled')).toBe(false)
  expect(input.value).toBe('Submitted name')
})
it('keeps unsaved editor content when changing interface language', async () => {
  const {rerender}=render(<Dashboard locale="ru" initialTab="profile" />)
  const input=await screen.findByLabelText('Имя и фамилия')
  fireEvent.change(input,{target:{value:'Unsaved change'}})
  await act(async()=>rerender(<Dashboard locale="ro" initialTab="profile" />))
  expect((screen.getByLabelText('Nume și prenume') as HTMLInputElement).value).toBe('Unsaved change')
  expect(getOwnedProfile).toHaveBeenCalledTimes(1)
})
