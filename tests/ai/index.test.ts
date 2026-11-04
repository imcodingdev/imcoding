import { describe, expect, it } from 'vitest'
import { createAiClient } from '@/lib/ai'

describe('createAiClient', () => {
  it('fake + vercel → throw', () => {
    expect(() => createAiClient({ fake: '1', vercel: '1' })).toThrow(/NEXT_PUBLIC_FAKE_BACKEND/)
  })
  it('fake → client dùng được', async () => {
    expect(await createAiClient({ fake: '1' }).checkKey('x')).toBe('ok')
  })
  it('không fake → client thật', () => {
    expect(typeof createAiClient({}).ask).toBe('function')
  })
})
