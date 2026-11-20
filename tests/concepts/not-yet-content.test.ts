import fs from 'node:fs'
import matter from 'gray-matter'
import { expect, it } from 'vitest'
import { loadConcepts } from '@/lib/concepts/load'
import { lessonStepCount } from '@/lib/concepts/lesson'

it('bài đánh đổi giữ ba đề xuất chưa cần, chín bước và giới hạn âm tiết', () => {
  const concepts = loadConcepts('content/concepts')
  expect(concepts).toHaveLength(58)
  const concept = concepts.find(concept => concept.id === 'system-tradeoffs')!
  if (concept.format !== 2) throw new Error('Cần bài v2')
  const lines = concept.notYet!.split('\n').filter(line => line.startsWith('- '))
  expect(lines).toHaveLength(3)
  expect(lines[0]).toContain('microservices')
  expect(lines[1]).toContain('hàng đợi/cache riêng')
  expect(lines[2]).toContain('hạ tầng')
  for (const line of lines) expect(line).toMatch(/^- \*\*.+\*\* — chưa cần khi .+; cần khi .+/)
  expect(lessonStepCount(concept)).toBe(9)
  const body = matter(fs.readFileSync('content/concepts/system-tradeoffs.md', 'utf8')).content
  expect(body.trim().split(/\s+/).length).toBeLessThanOrEqual(2800)
})
