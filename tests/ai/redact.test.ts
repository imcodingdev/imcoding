import { describe, it, expect } from 'vitest'
import { redactKey, looksLikeGoogleKey } from '@/lib/ai/redact'

describe('redactKey', () => {
  it('che phần giữa', () => {
    expect(redactKey('AIzaSyA1234567890abcdefghijklmnopqrstuv')).toBe('AIza••••stuv')
  })
  it('key ngắn che hết', () => {
    expect(redactKey('abc')).toBe('••••')
  })
  it('không chứa key gốc khi dài >= 8', () => {
    for (const k of ['12345678', 'abcdefghijkl', 'AIza' + 'x'.repeat(35)]) {
      expect(redactKey(k)).not.toContain(k)
    }
  })
})

describe('looksLikeGoogleKey', () => {
  it('nhận ra key Google', () => {
    expect(looksLikeGoogleKey('key là AIza' + 'x'.repeat(35))).toBe(true)
  })
  it('không nhận chuỗi ngắn', () => {
    expect(looksLikeGoogleKey('AIza ngắn')).toBe(false)
  })
})
