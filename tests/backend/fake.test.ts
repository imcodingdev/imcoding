// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createFakeBackend } from '@/lib/backend/fake'

beforeEach(() => {
  localStorage.clear()
})

describe('fake backend', () => {
  it('đăng nhập, ghi tiến độ, đăng xuất', async () => {
    const b = createFakeBackend()
    expect(await b.getUser()).toBeNull()
    vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, assign: vi.fn() } as unknown as Location)
    await b.signInWithGitHub('/map')
    expect((await b.getUser())?.id).toBe('fake-user')
    await b.markUnderstood('a')
    expect(await b.loadProgress()).toEqual({ a: 'understood' })
    await b.signOut()
    expect(await b.getUser()).toBeNull()
  })
  it('lỗi theo ý muốn', async () => {
    const b = createFakeBackend()
    localStorage.setItem('imcoding-fake-fail', '1')
    await expect(b.loadProgress()).rejects.toThrow()
    await expect(b.markUnderstood('a')).rejects.toThrow()
  })
})
