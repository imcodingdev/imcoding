import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseConcept, ConceptError } from '@/lib/concepts/parse'
import { invalidV2 } from '../fixtures/v2-invalid'

const raw = fs.readFileSync('tests/fixtures/concepts-v2/v2-lesson.md', 'utf8').replace(/\r\n/g, '\n')
const parse = (text = raw) => parseConcept('v2-lesson.md', text)
const headings = ['Nhắc lại', 'Đoán trước', 'Ví dụ mẫu', 'Tìm trong project của bạn', 'Tự giải thích', 'Kiểm tra không dùng AI', 'Lỗi suy luận hay gặp']
function replaceSection(title: string, content: string) {
  return raw.replace(new RegExp(`(## ${title}\\n)[\\s\\S]*?(?=\\n## |$)`), `$1\n${content}\n`)
}

describe('hợp đồng v2', () => {
  it('đọc đủ dữ liệu, không để lẫn heading đáp án', () => {
    const c = parse()
    expect(c).toMatchObject({ format: 2, stage: 1, recall: [{ question: 'Biến môi trường được dùng ở đâu?', answer: 'Server đọc cấu hình từ môi trường chạy.' }] })
    if (c.format !== 2) throw new Error('Expected v2')
    expect(c.explain).toHaveLength(2)
    expect(c.misconceptions).toHaveLength(2)
    expect(c.predict.scenario).toMatch(/không\?$/)
    expect(c.predict.answer).toMatch(/^Có, tiền tố/)
    expect(c.check.answer).toMatch(/^Thu hồi/)
    expect(c.example).toContain('```ts')
    expect(c.findInProject).toContain('1. Tìm')
  })
  it('không prerequisites thì không có Nhắc lại', () => {
    const c = parse(raw.replace('[environment-variables]', '[]').replace(/## Nhắc lại[\s\S]*?(?=## Đoán trước)/, ''))
    expect(c).toMatchObject({ format: 2, recall: [] })
  })
  it('BOM và CRLF', () => expect(parse('\uFEFF' + raw.replace(/\n/g, '\r\n'))).toEqual(parse()))
  it.each([1, 2, 3, 4])('stage %i hợp lệ', stage => expect(parse(raw.replace('stage: 1', `stage: ${stage}`))).toHaveProperty('stage', stage))
  it.each(invalidV2)('%s', (_name, mutate, message) => {
    expect(() => parse(mutate(raw))).toThrow(ConceptError)
    expect(() => parse(mutate(raw))).toThrow(/^v2-lesson\.md:/)
    expect(() => parse(mutate(raw))).toThrow(message)
  })
  it.each(headings)('không cho mục %s rỗng', title => {
    expect(() => parse(replaceSection(title, ''))).toThrow(new RegExp(title))
  })
  it.each(headings)('không cho thiếu mục %s', title => {
    expect(() => parse(raw.replace(new RegExp(`## ${title}\\n[\\s\\S]*?(?=\\n## |$)`), ''))).toThrow(ConceptError)
  })
  it.each([['Nhắc lại', 1, 2], ['Tự giải thích', 2, 3], ['Lỗi suy luận hay gặp', 2, 4]] as const)('%s kiểm tra hai biên số câu', (title, min, max) => {
    for (const n of [0, min - 1, max + 1]) {
      const content = Array.from({ length: n }, (_, i) => `### Câu ${i}?\nĐáp án.`).join('\n')
      expect(() => parse(replaceSection(title, content))).toThrow(new RegExp(title))
    }
    for (const n of [min, max]) {
      const content = Array.from({ length: n }, (_, i) => `### Câu ${i}?\nĐáp án.`).join('\n')
      expect(() => parse(replaceSection(title, content))).not.toThrow()
    }
  })
  it.each(['```', '~~~', '````', '~~~~'])('heading trong fence %s không tính, fence khác loại/ngắn hơn không đóng', fence => {
    const content = `### Câu hỏi?\nĐáp án\n${fence}md\n## Không phải mục\n### Không phải câu\n#### Đáp án\n${fence[0] === '`' ? '~~~' : '```'}\n## Vẫn trong code\n${fence}\n`
    expect(() => parse(replaceSection('Nhắc lại', content))).not.toThrow()
  })
})
