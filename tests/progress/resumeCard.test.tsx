// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import { ResumeCard } from '@/components/ResumeCard'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
const state = vi.hoisted(() => ({ progress: {} as Record<string, string>, user: { id: 'u' }, loadResume: vi.fn() }))
vi.mock('@/components/BackendProvider', () => ({
  useUser: () => ({ user: state.user, loading: false }),
  useBackend: () => backend,
  useProgress: () => ({ progress: state.progress }),
}))
const backend = { loadResume: state.loadResume }

it('hiện đúng link và tổng bước; biến mất ngay khi bài được đánh dấu đã hiểu', async () => {
  state.loadResume.mockResolvedValue({ conceptId: 'a', step: 4, at: '2026-11-10T00:00:00Z' })
  state.progress = {}
  const container = document.createElement('div')
  const root = createRoot(container)
  const render = () => root.render(createElement(ResumeCard, { lessons: [{ id: 'a', title: 'Bài A', stepCount: 9 }] }))
  await act(async () => render())
  expect(container.textContent).toContain('bước 4/9')
  expect(container.querySelector('a')?.getAttribute('href')).toBe('/concepts/a#buoc-4')
  state.progress = { a: 'understood' }
  await act(async () => render())
  expect(container.textContent).toBe('')
  await act(async () => root.unmount())
})

it.each([null, { conceptId: 'missing', step: 4 }, { conceptId: 'a', step: 10 }])('không hiện điểm dừng thiếu hoặc vượt nội dung: %j', async point => {
  state.loadResume.mockResolvedValue(point)
  state.progress = {}
  const container = document.createElement('div')
  const root = createRoot(container)
  await act(async () => root.render(createElement(ResumeCard, { lessons: [{ id: 'a', title: 'Bài A', stepCount: 9 }] })))
  expect(container.textContent).toBe('')
  await act(async () => root.unmount())
})
