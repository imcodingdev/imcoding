import fs from 'node:fs'
import matter from 'gray-matter'
import { describe, expect, it } from 'vitest'
import { parseConcept } from '@/lib/concepts/parse'

const lessons = [
  { id: 'acceptance-criteria', terms: [/3 cấp/i, /mục tiêu kinh doanh/i, /người dùng cần làm/i, /hệ thống phải làm/i] },
  { id: 'ai-task-context', terms: [/bản mô tả yêu cầu/i, /luồng chính/i, /ngoài phạm vi/i, /founder.*duyệt/i] },
  { id: 'business-rules', terms: [/thêm cột/i, /\/concepts\/schema-migrations/, /trạng thái hữu hạn/i, /stateDiagram-v2/] },
  { id: 'system-tradeoffs', terms: [/tự xây.*dịch vụ sẵn/i, /ngân sách/i, /CDN/, /microservices/] },
  { id: 'data-flow', terms: [/sơ đồ tuần tự/i, /sequenceDiagram/, /đối chiếu.*code/i] },
  { id: 'hosting-deploy', terms: [/DNS/, /địa chỉ IP/i, /người dùng đồng thời/i, /tổng số tài khoản/i] },
  { id: 'debugging', terms: [/cache/i, /CDN/, /ẩn danh/i, /Cache-Control/, /Age/, /revalidatePath/] },
  { id: 'authorization', terms: [/multi-tenant/, /tenant_id/, /thành viên/i, /hai tài khoản thử/i, /RLS/] },
] as const

const technicalSources = [
  { id: 'business-rules', urls: ['https://mermaid.js.org/syntax/stateDiagram.html'] },
  { id: 'system-tradeoffs', urls: ['https://developer.mozilla.org/en-US/docs/Glossary/CDN'] },
  { id: 'data-flow', urls: ['https://mermaid.js.org/syntax/sequenceDiagram.html'] },
  { id: 'hosting-deploy', urls: ['https://developer.mozilla.org/en-US/docs/Glossary/DNS'] },
  { id: 'debugging', urls: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching', 'https://nextjs.org/docs/app/guides/cdn-caching'] },
  { id: 'authorization', urls: ['https://supabase.com/docs/guides/database/postgres/row-level-security'] },
] as const

describe('bổ sung bài học theo ROUND-SUPP-1', () => {
  it.each(lessons)('$id giữ các ý bổ sung trong thân bài', ({ id, terms }) => {
    const raw = fs.readFileSync(`content/concepts/${id}.md`, 'utf8')
    const body = matter(raw).content
    for (const term of terms) expect(term.test(body), `${id}: thiếu ${term}`).toBe(true)
  })

  it.each(lessons)('$id vẫn parse được theo v2.1 và không vượt 2.800 âm tiết', ({ id }) => {
    const raw = fs.readFileSync(`content/concepts/${id}.md`, 'utf8')
    const concept = parseConcept(`${id}.md`, raw)
    expect(concept.format).toBe(2)
    if (concept.format !== 2) throw new Error('Cần bài v2.1')
    expect(concept.quiz).toHaveLength(4)
    expect(concept.exercise?.expectedResult).toBeTruthy()
    const syllables = matter(raw).content.trim().split(/\s+/).length
    expect(syllables).toBeGreaterThanOrEqual(900)
    expect(syllables).toBeLessThanOrEqual(2800)
  })

  it.each(technicalSources)('$id dẫn nguồn kỹ thuật HTTPS đúng miền và đúng tài liệu', ({ id, urls }) => {
    const raw = fs.readFileSync(`content/concepts/${id}.md`, 'utf8')
    const concept = parseConcept(`${id}.md`, raw)
    if (concept.format !== 2) throw new Error('Cần bài v2.1')
    const sources = concept.sources ?? []
    for (const expectedUrl of urls) {
      const source = sources.find(item => item.url === expectedUrl)
      expect(source, `${id}: thiếu ${expectedUrl}`).toBeDefined()
      if (!source) throw new Error(`Thiếu nguồn ${expectedUrl}`)
      expect(source.title.trim()).not.toBe('')
      const url = new URL(source.url)
      expect(url.protocol).toBe('https:')
      expect(url.hostname).toBe(new URL(expectedUrl).hostname)
    }
    for (const source of sources) expect(new URL(source.url).protocol).toBe('https:')
  })
})
