import fs from 'node:fs'
import matter from 'gray-matter'
import { describe, expect, it } from 'vitest'
import { parseConcept } from '@/lib/concepts/parse'

const lessons = [
  { id: 'github-remote', title: 'Repo trên máy và repo trên GitHub', group: 'ai-git', prerequisites: ['git-commit', 'secrets'], priority: 1, stage: 2 },
  { id: 'pull-request', title: 'Đọc và duyệt Pull Request do agent mở', group: 'ai-git', prerequisites: ['git-branch-merge', 'github-remote', 'code-review'], priority: 1, stage: 2 },
  { id: 'preview-deploy', title: 'Bản preview cho mỗi Pull Request', group: 'deploy', prerequisites: ['pull-request', 'hosting-deploy', 'environment-variables'], priority: 2, stage: 3 },
  { id: 'github-access', title: 'Bảo vệ nhánh chính và cấp quyền cho agent', group: 'auth', prerequisites: ['pull-request', 'secrets', 'security-boundaries'], priority: 1, stage: 3 },
] as const

describe('bốn bài GitHub theo ROUND-GITHUB-1', () => {
  it.each(lessons)('$id đúng metadata và hợp đồng v2.1', metadata => {
    const file = `content/concepts/${metadata.id}.md`
    expect(fs.existsSync(file), 'Bài được giao phải tồn tại').toBe(true)
    const raw = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')
    const concept = parseConcept(`${metadata.id}.md`, raw)
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
    expect(concept.sources?.length).toBeGreaterThan(0)
    for (const source of concept.sources ?? []) {
      expect(source.title.trim()).not.toBe('')
      const url = new URL(source.url)
      expect(url.protocol).toBe('https:')
      expect(['docs.github.com', 'vercel.com']).toContain(url.hostname)
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
