import { describe, it, expect } from 'vitest'
import { createBackend } from '@/lib/backend'

describe('createBackend', () => {
  it('throw khi fake bật trên Vercel', () => {
    expect(() => createBackend({ fake: '1', vercel: '1' })).toThrow(/NEXT_PUBLIC_FAKE_BACKEND/)
  })
})
