import { describe, it, expect } from 'vitest'
import { AiError, AI_ERROR_MESSAGES, classifyAskError, classifyStatus, explainStatus } from '@/lib/ai/errors'

describe('classifyStatus', () => {
  it('phân loại mã HTTP', () => {
    for (const s of [400, 401, 403]) expect(classifyStatus(s)).toBe('invalid')
    expect(classifyStatus(429)).toBe('quota')
    expect(classifyStatus(500)).toBe('unknown')
    expect(classifyStatus(503)).toBe('unknown')
  })
})

describe('classifyAskError', () => {
  it('400 chỉ là invalid khi có API_KEY_INVALID', () => {
    expect(classifyAskError(400, null)).toBe('unknown')
    expect(classifyAskError(400, { error: { status: 'INVALID_ARGUMENT' } })).toBe('unknown')
    expect(classifyAskError(400, { error: { details: [{ reason: 'API_KEY_INVALID' }] } })).toBe('invalid')
    expect(classifyAskError(400, 'không phải object')).toBe('unknown')
    expect(classifyAskError(401, null)).toBe('invalid')
    expect(classifyAskError(403, null)).toBe('invalid')
    expect(classifyAskError(429, null)).toBe('quota')
    expect(classifyAskError(500, null)).toBe('unknown')
  })
})

describe('AI_ERROR_MESSAGES', () => {
  it('đủ 4 loại, không rỗng', () => {
    expect(Object.keys(AI_ERROR_MESSAGES).sort()).toEqual(['invalid', 'network', 'quota', 'unknown'])
    for (const m of Object.values(AI_ERROR_MESSAGES)) expect(m.length).toBeGreaterThan(0)
    expect(AI_ERROR_MESSAGES.invalid).toContain('Cài đặt AI')
    expect(AI_ERROR_MESSAGES.quota).toContain('thử lại')
  })
})

describe('explainStatus', () => {
  it('giải thích bằng tiếng Việt', () => {
    expect(explainStatus(200)).toContain('thành công')
    expect(explainStatus(429)).toContain('hạn mức')
    expect(explainStatus(null)).toContain('mạng')
  })
})

describe('AiError', () => {
  it('giữ kind, trace và name', () => {
    const e = new AiError('quota', null)
    expect(e.name).toBe('AiError')
    expect(e.kind).toBe('quota')
    expect(e.trace).toBeNull()
    expect(e).toBeInstanceOf(Error)
  })
})
