import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import matter from 'gray-matter'
import { loadConcepts } from '@/lib/concepts/load'
import { parseConcept } from '@/lib/concepts/parse'

const IDS = [
  'client-server',
  'http-request-response',
  'html-css-js',
  'component',
  'routing',
  'server-code',
  'environment-variables',
  'database-table',
  'api-endpoint',
  'json',
  'authentication',
  'secrets',
  'package-dependencies',
  'hosting-deploy',
  'git-commit',
  'data-flow',
]

const files = fs.readdirSync('content/concepts').filter(name => name.endsWith('.md')).map(name => {
  const raw = fs.readFileSync(`content/concepts/${name}`, 'utf8')
  return { name, raw, ...matter(raw) }
})

function v1Concepts() {
  return files.filter(file => (file.data.format ?? 1) === 1).map(file => {
    const c = parseConcept(file.name, file.raw)
    expect(c.format, c.id).toBe(1)
    if (c.format !== 1) throw new Error('Expected v1')
    return c
  })
}

describe('nội dung 16 khái niệm ưu tiên', () => {
  it.each(files)('$name tuân thủ parser theo format của bài', ({ name, raw }) => {
    expect(() => parseConcept(name, raw)).not.toThrow()
  })
  it.each(files.filter(file => file.data.format === 2))('$name v2 dài 900–1.700 âm tiết, tính cả code', ({ content }) => {
    const words = content.split(/\s+/).filter(Boolean).length
    expect(words).toBeGreaterThanOrEqual(900)
    expect(words).toBeLessThanOrEqual(1700)
  })
  it('loadConcepts() đọc được thư mục content/concepts không lỗi', () => {
    expect(() => loadConcepts()).not.toThrow()
  })
  it('đúng 16 khái niệm, tất cả priority 1', () => {
    const list = loadConcepts()
    expect(list).toHaveLength(16)
    expect(list.every((c) => c.priority === 1)).toBe(true)
  })
  it('tập id đúng 16 id ưu tiên', () => {
    expect(loadConcepts().map((c) => c.id).sort()).toEqual([...IDS].sort())
  })
  it('mỗi mục "Trong code" có khối code', () => {
    for (const c of v1Concepts()) expect(c.sections.inCode, c.id).toContain('```')
  })
  it('"Giải thích đời thường" dài 80–200 chữ', () => {
    for (const c of v1Concepts()) {
      const words = c.sections.plain.split(/\s+/).filter(Boolean).length
      expect(words, c.id).toBeGreaterThanOrEqual(80)
      expect(words, c.id).toBeLessThanOrEqual(200)
    }
  })
  it('mỗi khối code có tên ngôn ngữ và không quá 15 dòng', () => {
    for (const c of v1Concepts()) {
      const blocks = [...c.sections.inCode.matchAll(/^```(\S*)\n([\s\S]*?)^```/gm)]
      expect(blocks.length, c.id).toBeGreaterThan(0)
      for (const [, lang, code] of blocks) {
        expect(lang, c.id).not.toBe('')
        expect(code.trimEnd().split('\n').length, c.id).toBeLessThanOrEqual(15)
      }
    }
  })
  it('stage của 16 bài đúng bảng BRIEF', () => {
    const stages = [
      ['client-server', 'git-commit', 'server-code', 'environment-variables', 'secrets', 'package-dependencies'],
      ['html-css-js', 'http-request-response', 'json', 'api-endpoint', 'database-table', 'data-flow', 'component', 'routing'],
      ['authentication', 'hosting-deploy'],
    ]
    stages.forEach((ids, i) => ids.forEach(id => expect(loadConcepts().find(c => c.id === id)?.stage, id).toBe(i + 1)))
  })
})
