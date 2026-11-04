import { describe, expect, it } from 'vitest'
import { AiError } from '@/lib/ai/errors'
import { createFakeAiClient } from '@/lib/ai/fake'
import { redactKey } from '@/lib/ai/redact'

const lesson = { title: 'A', plain: 'p', inCode: 'c', pitfalls: 'x' }
const history = [{ role: 'user' as const, text: 'Câu hỏi cuối' }]

describe('fake ai client', () => {
  it('checkKey', async () => {
    const c = createFakeAiClient()
    expect(await c.checkKey('fake-invalid')).toBe('invalid')
    expect(await c.checkKey('fake-quota')).toBe('quota')
    expect(await c.checkKey('abc')).toBe('ok')
  })
  it('ask quota', async () => {
    const err = await createFakeAiClient()
      .ask({ apiKey: 'fake-quota', lesson, history }, () => {})
      .catch((e) => e)
    expect(err).toBeInstanceOf(AiError)
    expect(err.kind).toBe('quota')
    expect(err.trace.status).toBe(429)
  })
  it('ask thường', async () => {
    const got: string[] = []
    const trace = await createFakeAiClient().ask(
      { apiKey: 'my-secret-key-1234', lesson, history },
      (d) => got.push(d),
    )
    expect(got.length).toBeGreaterThan(1)
    expect(got.join('')).toBe('Đây là câu trả lời mẫu cho: Câu hỏi cuối')
    expect(trace.status).toBe(200)
    expect(trace.headers['x-goog-api-key']).toBe(redactKey('my-secret-key-1234'))
    expect(JSON.stringify(trace)).not.toContain('my-secret-key-1234')
  })
})
