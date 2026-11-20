import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseConcept, ConceptError } from '@/lib/concepts/parse'
import { addNotYet, notYetContent } from '../fixtures/not-yet'

const raw = fs.readFileSync('tests/fixtures/concepts-v2/v2-lesson.md', 'utf8').replace(/\r\n/g, '\n')
const parse = (text: string) => parseConcept('v2-lesson.md', text)
const section = `## Khi nào chưa cần\n\n${notYetContent}\n\n`

function expectInvalid(text: string) {
  expect(() => parse(text)).toThrow(ConceptError)
  expect(() => parse(text)).toThrow(/^v2-lesson\.md: mục "Khi nào chưa cần"/)
}

describe('mục tùy chọn v2.2', () => {
  it.each([true, false])('giữ nguyên markdown và dữ liệu cũ, có Nhắc lại = %s', recall => {
    const base = recall ? raw : raw.replace('[environment-variables]', '[]').replace(/## Nhắc lại[\s\S]*?(?=## Đoán trước)/, '')
    const original = parse(base)
    expect(original).not.toHaveProperty('notYet')
    expect(parse(addNotYet(base))).toEqual({ ...original, notYet: notYetContent })
  })
  it('chuẩn hóa BOM/CRLF giống các mục khác', () => {
    expect(parse('\uFEFF' + addNotYet(raw).replace(/\n/g, '\r\n'))).toEqual(parse(addNotYet(raw)))
  })
  it.each(['Nhắc lại', 'Đoán trước', 'Ví dụ mẫu', 'Tự giải thích', 'Trắc nghiệm', 'Kiểm tra không dùng AI', 'Lỗi suy luận hay gặp', 'Bài tập thực hành'])('từ chối đặt trước %s và nêu đúng mục lỗi', title => {
    expectInvalid(raw.replace(`## ${title}`, `${section}## ${title}`))
  })
  it('từ chối đặt cuối bài hoặc lặp mục', () => {
    expectInvalid(raw + '\n' + section)
    expectInvalid(addNotYet(raw).replace('## Khi nào chưa cần', section + '## Khi nào chưa cần'))
  })
  it.each([
    ['rỗng', ' \n\t '],
    ['heading con', notYetContent + '\n\n### Gợi ý\nKhông thêm.'],
    ['heading cấp bốn', notYetContent + '\n\n#### Gợi ý\nKhông thêm.'],
    ['code backtick', notYetContent + '\n\n```ts\nconst value = 1\n```'],
    ['code tilde', notYetContent + '\n\n~~~ts\nconst value = 1\n~~~'],
    ['code thụt bốn dấu cách', notYetContent + '\n\n    const value = 1'],
    ['code thụt tab', notYetContent + '\n\n\tconst value = 1'],
    ['code thụt ngay đầu mục', '    const value = 1'],
    ['code tab ngay đầu mục', '  \tconst value = 1'],
    ['fence chưa đóng', notYetContent + '\n\n```ts\nconst value = 1'],
  ])('từ chối nội dung %s', (_name, content) => expectInvalid(addNotYet(raw, content)))
  it('không coi tên mục trong code ví dụ là mục tùy chọn', () => {
    const text = raw.replace(/(## Ví dụ mẫu[\s\S]*?```)[^\n]*\n/, '$1md\n## Khi nào chưa cần\n')
    expect(parse(text)).not.toHaveProperty('notYet')
  })
})
