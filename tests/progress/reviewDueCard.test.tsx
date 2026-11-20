// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ReviewRow } from '@/lib/backend/types'
import { ReviewDueCard } from '@/components/ReviewDueCard'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
const state = vi.hoisted(() => ({ user: { id: 'u' } as { id: string } | null, loading: false, due: [] as ReviewRow[] | null, error: null as string | null, hook: vi.fn() }))
vi.mock('@/components/BackendProvider', () => ({
  useUser: () => state,
  useReviews: (ids: string[]) => { state.hook(ids); return state },
}))
let root: Root
let container: HTMLDivElement
beforeEach(() => { state.user = { id: 'u' }; state.loading = false; state.error = null; state.due = [{ conceptId: 'a', understoodAt: '2026-11-01', lastReviewedAt: null }] })
afterEach(() => act(() => root.unmount()))
function render() {
  container = document.createElement('div')
  root = createRoot(container)
  act(() => root.render(createElement(ReviewDueCard, { knownIds: ['a'] })))
}
it('hiện số bài đến hạn và link ôn', () => {
  render()
  expect(container.textContent).toContain('Hôm nay có 1 bài cần ôn')
  expect(container.querySelector('a')?.getAttribute('href')).toBe('/on-tap')
  expect(state.hook).toHaveBeenCalledWith(['a'])
})
it.each(['guest', 'loading', 'pending', 'empty', 'error'])('ẩn thẻ khi %s', mode => {
  if (mode === 'guest') state.user = null
  if (mode === 'loading') state.loading = true
  if (mode === 'pending') state.due = null
  if (mode === 'empty') state.due = []
  if (mode === 'error') state.error = 'Lỗi tải'
  render()
  expect(container.textContent).toBe('')
})
