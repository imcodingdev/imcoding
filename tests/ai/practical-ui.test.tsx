// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, expect, it } from 'vitest'
import { PracticalAnswer } from '@/components/PracticalAsk'
import { createFakeAiClient } from '@/lib/ai/fake'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
let root: Root | undefined
afterEach(async () => { await act(async () => root?.unmount()); localStorage.clear() })
async function render(query = 'Cần database gì?', apiKey = 'fake-ok') {
  const container = document.createElement('div')
  root = createRoot(container)
  await act(async () => root!.render(createElement(PracticalAnswer, {
    query, apiKey, client: createFakeAiClient(), lessons: [{ id: 'database', title: 'Cơ sở dữ liệu' }],
  })))
  await act(async () => container.querySelector('button')!.click())
  return container
}
it('stream câu trả lời thành link bài hợp lệ, bỏ id lạ và không lưu câu hỏi', async () => {
  const container = await render()
  const answer = container.querySelector('[data-testid="practical-answer"]')!
  expect(answer.querySelector('a')?.getAttribute('href')).toBe('/concepts/database')
  expect(answer.textContent).not.toContain('khong-co-bai-nay')
  expect(answer.querySelectorAll('h2')).toHaveLength(6)
  expect(container.textContent).toContain('Xem bên trong')
  expect(localStorage.length).toBe(0)
})
it('quota dùng thông báo chung và cho phép thử lại', async () => {
  const container = await render('database', 'fake-quota')
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('Đã hết hạn mức')
  expect(container.querySelector('button')!.disabled).toBe(false)
})
it('chặn câu hỏi chứa key trước khi gọi AI', async () => {
  const container = await render('AIza' + 'x'.repeat(35))
  expect(container.querySelector('button')!.disabled).toBe(true)
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('khoá bí mật')
  expect(container.querySelector('[data-testid="practical-answer"]')).toBeNull()
})
