import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import matter from 'gray-matter'
import { loadConcepts } from '@/lib/concepts/load'
import { parseConcept } from '@/lib/concepts/parse'

import { validateGraph } from '@/lib/concepts/graph'
import { CURRICULUM, LESSON_IDS } from '../fixtures/curriculum'

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

describe('nội dung lộ trình 45 bài', () => {
  it.each(files)('$name tuân thủ parser theo format của bài', ({ name, raw }) => {
    expect(() => parseConcept(name, raw)).not.toThrow()
  })
  it.each(files.filter(file => file.data.format === 2))('$name v2 dài 900–2.800 âm tiết, tính cả code', ({ content }) => {
    const words = content.split(/\s+/).filter(Boolean).length
    expect(words).toBeGreaterThanOrEqual(900)
    expect(words).toBeLessThanOrEqual(2800)
  })
  it.each(files.filter(file => file.data.format === 2))('$name có Trắc nghiệm thì đủ 4 câu', ({ name, raw }) => {
    const concept = parseConcept(name, raw)
    if (concept.format === 2 && concept.quiz) expect(concept.quiz, name).toHaveLength(4)
  })
  it('loadConcepts() đọc được thư mục content/concepts không lỗi', () => {
    expect(() => loadConcepts()).not.toThrow()
  })
  it('đúng 45 bài với priority đã chốt cho từng id', () => {
    const list = loadConcepts()
    expect(list).toHaveLength(45)
    for (const [id, , priority] of CURRICULUM) {
      expect(list.find(c => c.id === id)?.priority, id).toBe(priority)
    }
  })
  it('tập id đúng 45 id đã chốt', () => {
    expect(loadConcepts().map((c) => c.id).sort()).toEqual([...LESSON_IDS].sort())
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
  it('stage của từng bài đúng frontmatter đã chốt ở cả bốn chặng', () => {
    const list = loadConcepts()
    for (const [id, stage] of CURRICULUM) {
      expect(list.find(c => c.id === id)?.stage, id).toBe(stage)
    }
    expect([1, 2, 3, 4].map(stage => list.filter(c => c.stage === stage).length)).toEqual([6, 24, 11, 4])
  })
  it('mọi prerequisite có thật và đồ thị 45 bài không có vòng', () => {
    const concepts = files.map(({ name, raw }) => parseConcept(name, raw))
    const ids = new Set(concepts.map(c => c.id))
    for (const concept of concepts) {
      for (const prerequisite of concept.prerequisites) {
        expect(ids.has(prerequisite), concept.id + ' → ' + prerequisite).toBe(true)
      }
    }
    expect(() => validateGraph(concepts)).not.toThrow()
  })
  it.each(['ai-cost-limits', 'prompt-injection'])('%s giữ thân bài không quá 2.700 âm tiết', id => {
    const file = files.find(file => file.data.id === id)!
    expect(file.content.trim().split(/\s+/).length).toBeLessThanOrEqual(2700)
  })
})
