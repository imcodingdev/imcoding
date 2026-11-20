import fs from 'node:fs'
import matter from 'gray-matter'
import { describe, expect, it } from 'vitest'
import { parseConcept } from '@/lib/concepts/parse'

const lessons = [
  { id: 'non-functional-requirements', title: 'Yêu cầu phi chức năng: nhanh, ổn định, an toàn đến mức nào', group: 'systems', prerequisites: ['acceptance-criteria', 'ai-task-context'], priority: 2, stage: 2, hosts: ['sre.google', 'web.dev'], terms: ['SLI', 'SLO', 'LCP', 'INP', 'CLS'] },
  { id: 'idempotency-retries', title: 'Bấm hai lần, trừ tiền hai lần: thao tác lặp lại an toàn', group: 'api', prerequisites: ['http-request-response', 'async-requests', 'error-handling', 'forms-validation'], priority: 1, stage: 3, hosts: ['developer.mozilla.org', 'docs.stripe.com'], terms: ['idempotency key', 'event ID'] },
  { id: 'concurrent-writes', title: 'Hai người cùng giành một chỗ: chống đặt trùng và bán quá số lượng', group: 'database', prerequisites: ['database-table', 'data-crud', 'business-rules'], priority: 1, stage: 3, hosts: ['www.postgresql.org'], terms: ['transaction', 'UNIQUE', 'FOR UPDATE'] },
] as const

describe('ba bài theo ROUND-SA-1', () => {
  it.each(lessons)('$id đúng metadata, định dạng, độ dài và nguồn', lesson => {
    const file = `content/concepts/${lesson.id}.md`
    expect(fs.existsSync(file), 'Bài được giao phải tồn tại').toBe(true)
    const raw = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')
    const concept = parseConcept(`${lesson.id}.md`, raw)
    const { hosts, terms, ...metadata } = lesson
    expect(concept).toMatchObject({ ...metadata, format: 2 })
    if (concept.format !== 2) throw new Error('Cần bài v2.1')
    const body = matter(raw).content
    const syllables = body.trim().split(/\s+/).length
    expect(syllables).toBeGreaterThanOrEqual(1500)
    expect(syllables).toBeLessThanOrEqual(2600)
    expect(concept.quiz).toHaveLength(4)
    expect(new Set(concept.quiz!.map(question => question.correctIndex)).size).toBe(4)
    expect(concept.exercise?.steps.length).toBeGreaterThanOrEqual(3)
    expect(concept.exercise?.steps.length).toBeLessThanOrEqual(6)
    expect(concept.exercise?.expectedResult).toBeTruthy()
    const sourceHosts = (concept.sources ?? []).map(source => {
      expect(source.title.trim()).not.toBe('')
      const url = new URL(source.url)
      expect(url.protocol).toBe('https:')
      expect(hosts).toContain(url.hostname)
      return url.hostname
    })
    expect(new Set(sourceHosts)).toEqual(new Set(hosts))
    for (const term of terms) expect(body.toLowerCase()).toContain(term.toLowerCase())
    const blocks = [...concept.example.matchAll(/^```(\S*)\n([\s\S]*?)^```/gm)]
    expect(blocks.length).toBeGreaterThanOrEqual(1)
    expect(blocks.length).toBeLessThanOrEqual(2)
    for (const [, language, code] of body.matchAll(/^```(\S*)\n([\s\S]*?)^```/gm)) {
      expect(language).not.toBe('')
      expect(code.trimEnd().split('\n').length).toBeLessThanOrEqual(15)
    }
  })
})
