import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, summarizeSystemPrompt } from '@/lib/ai/prompt'

const lesson = { title: 'TIEU_DE', plain: 'PHAN_PLAIN', inCode: 'PHAN_CODE', pitfalls: 'PHAN_LOI' }

describe('buildSystemPrompt', () => {
  const p = buildSystemPrompt(lesson)
  it('chứa nội dung bài', () => {
    for (const v of Object.values(lesson)) expect(p).toContain(v)
  })
  it('chứa lời dặn', () => {
    expect(p).toContain('tiếng Việt')
    expect(p).toContain('đời thường')
    expect(p).toContain('thu hồi')
  })
})

describe('summarizeSystemPrompt', () => {
  it('rút gọn', () => {
    const p = buildSystemPrompt(lesson)
    expect(summarizeSystemPrompt(p)).toBe(`…(${p.length} ký tự nội dung bài)`)
  })
})
