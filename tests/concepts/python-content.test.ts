import fs from 'node:fs'
import matter from 'gray-matter'
import { describe, expect, it } from 'vitest'
import { parseConcept } from '@/lib/concepts/parse'

describe('bài Python theo ROUND-PYTHON-1', () => {
  it('đọc được bài đúng metadata và hợp đồng v2.1', () => {
    const file = 'content/concepts/python-scripts.md'
    expect(fs.existsSync(file), 'Bài được giao phải tồn tại').toBe(true)
    const raw = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')
    const concept = parseConcept('python-scripts.md', raw)
    expect(concept).toMatchObject({
      id: 'python-scripts',
      title: 'Chạy script Python do AI viết',
      group: 'systems',
      prerequisites: ['package-dependencies', 'secrets', 'debugging'],
      priority: 2,
      stage: 2,
      format: 2,
    })
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

    const sources = concept.sources ?? []
    const hosts = sources.map(source => {
      expect(source.title.trim()).not.toBe('')
      const url = new URL(source.url)
      expect(url.protocol).toBe('https:')
      expect(['docs.python.org', 'packaging.python.org', 'pip.pypa.io']).toContain(url.hostname)
      return url.hostname
    })
    expect(new Set(hosts)).toEqual(new Set(['docs.python.org', 'packaging.python.org', 'pip.pypa.io']))
    for (const term of ['venv', 'requirements.txt', 'traceback']) {
      expect(body.toLowerCase()).toContain(term)
    }
    const blocks = [...concept.example.matchAll(/^```(\S*)\n([\s\S]*?)^```/gm)]
    expect(blocks.length).toBeGreaterThanOrEqual(1)
    expect(blocks.length).toBeLessThanOrEqual(2)
    for (const [, language, code] of body.matchAll(/^```(\S*)\n([\s\S]*?)^```/gm)) {
      expect(language).not.toBe('')
      expect(code.trimEnd().split('\n').length).toBeLessThanOrEqual(15)
    }
  })
})
