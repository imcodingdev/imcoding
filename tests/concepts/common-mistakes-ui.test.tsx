// @vitest-environment jsdom
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import Home from '@/app/page'
import { loadConcepts } from '@/lib/concepts/load'

it('trang chủ đặt tám lỗi đúng thứ tự trước cách học, kèm tên và liên kết bài thật', () => {
  const container = document.createElement('div')
  container.innerHTML = renderToStaticMarkup(createElement(Home))
  const section = container.querySelector('section[aria-labelledby="common-mistakes-heading"]')
  expect(section?.querySelector('h2')?.textContent).toBe('Lỗi founder hay gặp')
  expect(section?.nextElementSibling?.getAttribute('aria-labelledby')).toBe('learn-heading')
  const links = [...section!.querySelectorAll('a')]
  const ids = ['business-rules', 'idempotency-retries', 'concurrent-writes', 'debugging', 'authorization', 'secrets', 'done-evidence', 'python-scripts']
  expect(links.map(link => link.getAttribute('href'))).toEqual(ids.map(id => `/concepts/${id}`))
  const concepts = loadConcepts('content/concepts')
  links.forEach((link, i) => expect(link.textContent).toContain(concepts.find(concept => concept.id === ids[i])!.title))
  expect(links[3].textContent).toContain('Đã deploy mà vẫn thấy bản cũ')
})
