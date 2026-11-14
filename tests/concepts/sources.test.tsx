import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { parseConcept, ConceptError } from '@/lib/concepts/parse'
import { lessonContext } from '@/lib/concepts/lesson'
import { buildSystemPrompt } from '@/lib/ai/prompt'

const raw = fs.readFileSync('tests/fixtures/concepts-v2/v2-lesson.md', 'utf8').replace(/\r\n/g, '\n')
const sources = [
  { title: 'Nguồn tham khảo riêng', url: 'https://example.org/lecture-01' },
  { title: 'Nguồn thứ hai', url: 'https://example.org/lecture-02' },
]
const parse = (value: unknown) => parseConcept('v2-lesson.md', raw.replace('format: 2', `format: 2\nsources: ${JSON.stringify(value)}`))

describe('nguồn tham khảo v2', () => {
  it('giữ danh sách title/url và thứ tự', () => {
    expect(parse(sources)).toHaveProperty('sources', sources)
  })
  it('không bắt buộc nguồn và chấp nhận danh sách rỗng', () => {
    expect(parseConcept('v2-lesson.md', raw)).not.toHaveProperty('sources')
    expect(parse([])).toHaveProperty('sources', [])
  })
  it.each([
    null, 'https://example.org', {}, [null], ['nguồn'], [[]],
    [{ url: 'https://example.org' }], [{ title: 'Nguồn' }],
    [{ title: '   ', url: 'https://example.org' }], [{ title: 3, url: 'https://example.org' }],
    ...['', 'http://example.org', '//example.org', '/lecture', 'javascript:alert(1)', 'https://', 'https://bad host', 'https:/example.org'].map(url => ({ title: 'Nguồn', url })).map(source => [source]),
    [{ title: 'Nguồn', url: 42 }],
  ].map(value => ({ value })))('từ chối sources sai: $value', ({ value }) => {
    expect(() => parse(value)).toThrow(ConceptError)
    expect(() => parse(value)).toThrow(/^v2-lesson\.md:.*sources/)
  })
  it('không gửi metadata nguồn vào context hoặc prompt Hỏi AI', () => {
    const concept = parse(sources)
    expect(concept).toHaveProperty('sources', sources)
    const context = lessonContext(concept)
    expect(context).toEqual(lessonContext(parseConcept('v2-lesson.md', raw)))
    for (const source of sources) {
      expect(buildSystemPrompt(context)).not.toContain(source.title)
      expect(buildSystemPrompt(context)).not.toContain(source.url)
    }
  })
  it('hiện liên kết an toàn, giữ nhãn dưới dạng văn bản', async () => {
    const { LessonSources } = await import('@/components/LessonSources')
    const html = renderToStaticMarkup(createElement(LessonSources, { sources: [...sources, { title: '<script>test</script>', url: 'https://example.org/3' }] }))
    expect(html).toContain('Tham khảo:')
    expect(html.match(/target="_blank"/g)).toHaveLength(3)
    expect(html.match(/rel="noopener noreferrer"/g)).toHaveLength(3)
    for (const source of sources) expect(html).toContain(`href="${source.url}"`)
    expect(html).toContain('&lt;script&gt;test&lt;/script&gt;')
    expect(html).not.toContain('<script>')
    expect(renderToStaticMarkup(createElement(LessonSources, {}))).toBe('')
    expect(renderToStaticMarkup(createElement(LessonSources, { sources: [] }))).toBe('')
  })
})
