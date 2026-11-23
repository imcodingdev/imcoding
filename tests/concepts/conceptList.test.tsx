import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import { ConceptList } from '@/components/ConceptList'
import type { ConceptRef } from '@/lib/progress/next'

const first: ConceptRef = { id: 'a', title: 'Nền tảng', group: 'web', stage: 1, priority: 1, prerequisites: [] }
const second: ConceptRef = { id: 'b', title: 'Bài tiếp theo', group: 'web', stage: 2, priority: 1, prerequisites: ['a'] }

it('ẩn tiêu đề và mô tả của chặng không có bài', () => {
  const html = renderToStaticMarkup(createElement(ConceptList, { concepts: [second], statuses: {}, showProgress: false }))
  expect(html).toContain('Chặng 2')
  expect(html).not.toContain('Chặng 1')
  expect(html).not.toContain('Chặng 3')
  expect(html).not.toContain('Chặng 4')
  expect(html).not.toContain('Sắp có')
})

it('danh sách rỗng không còn tiêu đề chặng', () => {
  const html = renderToStaticMarkup(createElement(ConceptList, { concepts: [], statuses: {}, showProgress: false }))
  expect(html).not.toContain('<h2')
})

it('lọc bài vẫn giữ tên dễ đọc của bài cần học trước', () => {
  const html = renderToStaticMarkup(createElement(ConceptList, {
    concepts: [second], allConcepts: [first, second], statuses: { a: 'understood' }, showProgress: true,
  }))
  expect(html).toContain('Nền tảng</a>')
  expect(html).not.toContain('Chặng 1')
})
