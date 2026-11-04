// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getKey, setKey, clearKey, subscribeKeys } from '@/lib/ai/keyStore'

beforeEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('keyStore', () => {
  it('lưu theo userId', () => {
    setKey('u1', 'k1')
    expect(getKey('u1')).toBe('k1')
    expect(getKey('u2')).toBeNull()
    expect(localStorage.getItem('imcoding-gemini-key:u1')).toBe('k1')
  })
  it('cắt khoảng trắng; key rỗng coi như clear', () => {
    setKey('u1', '  abc  ')
    expect(getKey('u1')).toBe('abc')
    setKey('u1', '   ')
    expect(getKey('u1')).toBeNull()
    expect(localStorage.getItem('imcoding-gemini-key:u1')).toBeNull()
  })
  it('clearKey xoá key', () => {
    setKey('u1', 'k1')
    clearKey('u1')
    expect(getKey('u1')).toBeNull()
  })
  it('localStorage ném lỗi thì không sập', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(getKey('u1')).toBeNull()
    expect(() => setKey('u1', 'k')).not.toThrow()
  })
  it('subscribeKeys được gọi sau set và clear', () => {
    const cb = vi.fn()
    const off = subscribeKeys(cb)
    setKey('u1', 'k1')
    expect(cb).toHaveBeenCalledTimes(1)
    clearKey('u1')
    expect(cb).toHaveBeenCalledTimes(2)
    off()
    setKey('u1', 'k2')
    expect(cb).toHaveBeenCalledTimes(2)
  })
})
