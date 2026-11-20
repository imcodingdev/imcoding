import fs from 'node:fs'
import matter from 'gray-matter'
import { describe, expect, it } from 'vitest'
import { loadConcepts } from '@/lib/concepts/load'

const notYetIds = [
  'system-tradeoffs', 'non-functional-requirements', 'concurrent-writes',
  'idempotency-retries', 'automated-tests', 'ci-cd', 'logging-monitoring',
  'backup-restore', 'schema-migrations', 'deployment-environments',
  'preview-deploy', 'agent-loops',
]
const concepts = loadConcepts('content/concepts')

describe('nội dung ROUND-TEACH-2', () => {
  it('đúng 12 bài đã chọn có mục Khi nào chưa cần', () => {
    const ids = concepts.filter(c => c.format === 2 && c.notYet).map(c => c.id)
    expect(ids.sort()).toEqual([...notYetIds].sort())
  })

  it.each(notYetIds)('%s có 2–4 đề xuất với điều kiện chưa cần và cần', id => {
    const concept = concepts.find(c => c.id === id)
    if (!concept || concept.format !== 2) throw new Error(`Thiếu bài v2: ${id}`)
    expect(concept.notYet).toBeTruthy()
    const lines = concept.notYet!.split('\n').filter(line => line.startsWith('- '))
    expect(lines.length).toBeGreaterThanOrEqual(2)
    expect(lines.length).toBeLessThanOrEqual(4)
    for (const line of lines) {
      expect(line).toMatch(/^- \*\*.+\*\* — chưa cần khi .+; cần khi .+/)
    }
  })

  it.each(concepts)('$id có thân bài không quá 2.800 âm tiết, tính cả code', ({ id }) => {
    const raw = fs.readFileSync(`content/concepts/${id}.md`, 'utf8')
    expect(matter(raw).content.trim().split(/\s+/).length).toBeLessThanOrEqual(2800)
  })
})
