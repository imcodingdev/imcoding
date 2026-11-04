import { describe, it, expect } from 'vitest'
import { parseConcept, ConceptError } from '@/lib/concepts/parse'
import { GROUPS } from '@/lib/concepts/types'

interface Overrides {
  id?: string
  group?: string
  priority?: number
  signals?: string
  body?: string
}

function makeRaw(o: Overrides = {}): string {
  const signals = o.signals ?? '  - fetch\n  - axios'
  const body =
    o.body ??
    `## Giải thích đời thường

Quán ăn có khách và bếp.

## Trong code trông như thế nào

Gọi \`fetch('/api')\`.

## Hay gặp lỗi gì

Quên xử lý lỗi mạng.

## Tự kiểm tra

### Client là gì?

Bên gửi yêu cầu.

### Server là gì?

Bên trả lời yêu cầu.
`
  return `---
id: ${o.id ?? 'client-server'}
title: Client và Server
group: ${o.group ?? 'web'}
prerequisites: [http]
priority: ${o.priority ?? 1}
signals:
${signals}
---
${body}`
}

describe('GROUPS', () => {
  it('có 9 nhóm đúng thứ tự', () => {
    expect(GROUPS.map((g) => g.id)).toEqual([
      'web', 'frontend', 'backend', 'database', 'api', 'auth', 'deploy', 'ai-git', 'systems',
    ])
  })
})

describe('parseConcept', () => {
  it('parse hợp lệ', () => {
    const c = parseConcept('client-server.md', makeRaw())
    expect(c.id).toBe('client-server')
    expect(c.group).toBe('web')
    expect(c.prerequisites).toEqual(['http'])
    expect(c.sections.plain).not.toBe('')
    expect(c.sections.inCode).not.toBe('')
    expect(c.sections.pitfalls).not.toBe('')
    expect(c.quiz.length).toBe(2)
    expect(c.quiz[0].question).toBe('Client là gì?')
    expect(c.quiz[0].question).not.toContain('###')
    expect(c.quiz[0].answer).toBe('Bên gửi yêu cầu.')
  })

  it('chấp nhận CRLF và BOM', () => {
    const raw = makeRaw()
    const a = parseConcept('client-server.md', raw)
    const b = parseConcept('client-server.md', '\uFEFF' + raw.replace(/\n/g, '\r\n'))
    expect(b).toEqual(a)
  })

  it('id khác tên file', () => {
    expect(() => parseConcept('abc.md', makeRaw({ id: 'xyz' }))).toThrow(ConceptError)
    try {
      parseConcept('abc.md', makeRaw({ id: 'xyz' }))
    } catch (e) {
      expect((e as Error).message).toContain('abc.md')
      expect((e as Error).message).toContain('xyz')
      expect((e as Error).message.startsWith('abc.md')).toBe(true)
    }
  })

  it('group lạ', () => {
    expect(() => parseConcept('client-server.md', makeRaw({ group: 'zzz' }))).toThrow(/group/)
  })

  it('thiếu signals', () => {
    expect(() => parseConcept('client-server.md', makeRaw({ signals: ' []' }))).toThrow(/signals/)
  })

  it('priority = 3', () => {
    expect(() => parseConcept('client-server.md', makeRaw({ priority: 3 }))).toThrow(/priority/)
  })

  it('thiếu mục H2', () => {
    const body = `## Giải thích đời thường\n\na\n\n## Trong code trông như thế nào\n\nb\n\n## Tự kiểm tra\n\n### Q1?\n\nA1\n\n### Q2?\n\nA2\n`
    expect(() => parseConcept('client-server.md', makeRaw({ body }))).toThrow(/Hay gặp lỗi gì/)
  })

  it('sai thứ tự mục', () => {
    const body = `## Giải thích đời thường\n\na\n\n## Hay gặp lỗi gì\n\nc\n\n## Trong code trông như thế nào\n\nb\n\n## Tự kiểm tra\n\n### Q1?\n\nA1\n\n### Q2?\n\nA2\n`
    expect(() => parseConcept('client-server.md', makeRaw({ body }))).toThrow(/Trong code trông như thế nào|Hay gặp lỗi gì/)
  })

  const quizBody = (n: number) =>
    `## Giải thích đời thường\n\na\n\n## Trong code trông như thế nào\n\nb\n\n## Hay gặp lỗi gì\n\nc\n\n## Tự kiểm tra\n\n` +
    Array.from({ length: n }, (_, i) => `### Q${i + 1}?\n\nA${i + 1}\n`).join('\n')

  it('quiz 1 câu', () => {
    expect(() => parseConcept('client-server.md', makeRaw({ body: quizBody(1) }))).toThrow(/Tự kiểm tra/)
  })

  it('quiz 4 câu', () => {
    expect(() => parseConcept('client-server.md', makeRaw({ body: quizBody(4) }))).toThrow(/Tự kiểm tra/)
  })
})
