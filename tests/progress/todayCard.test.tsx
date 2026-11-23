// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { TodayCard } from '@/components/TodayCard'
import type { ProgressMap } from '@/lib/progress/status'
import type { ResumePoint, ReviewRow } from '@/lib/backend/types'
import type { ConceptRef } from '@/lib/progress/next'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
const state = vi.hoisted(() => ({
  user: { id: 'u' } as { id: string } | null, loading: false,
  progress: {} as ProgressMap | null, progressError: null as string | null,
  due: [] as ReviewRow[] | null, error: null as string | null, loadResume: vi.fn(),
}))
const backend = { loadResume: state.loadResume }
vi.mock('@/components/BackendProvider', () => ({
  useUser: () => ({ user: state.user, loading: state.loading }),
  useBackend: () => backend,
  useProgress: () => ({ progress: state.progress, error: state.progressError }),
  useReviews: () => ({ due: state.due, error: state.error }),
}))

const lessons = [{ id: 'a', title: 'Bài A', stepCount: 9 }]
const concepts: ConceptRef[] = [
  { id: 'a', title: 'Bài A', group: 'web', prerequisites: [], priority: 1, stage: 1 },
  { id: 'b', title: 'Bài B', group: 'web', prerequisites: ['a'], priority: 1, stage: 1 },
]
const point = { conceptId: 'a', step: 4, at: '2026-11-10T00:00:00Z' }
const review = { conceptId: 'b', understoodAt: '2026-11-01', lastReviewedAt: null }
let root: Root
let container: HTMLDivElement
beforeEach(() => {
  state.user = { id: 'u' }; state.loading = false; state.progress = {}; state.progressError = null
  state.due = []; state.error = null; state.loadResume.mockReset().mockResolvedValue(null)
  localStorage.clear()
  container = document.createElement('div')
  root = createRoot(container)
})
afterEach(async () => { await act(async () => root.unmount()); localStorage.clear() })
async function render(includeNew = false) {
  await act(async () => root.render(createElement(TodayCard, { lessons, concepts, includeNew })))
}

it('giữ link và tổng bước; bỏ mục học tiếp ngay khi bài đã hiểu', async () => {
  state.loadResume.mockResolvedValue(point)
  await render()
  expect(container.textContent).toContain('Học tiếp · Bài A · bước 4/9')
  expect(container.querySelector('a')?.getAttribute('href')).toBe('/concepts/a#buoc-4')
  state.progress = { a: 'understood' }
  await render()
  expect(container.textContent).toBe('')
})

it.each([null, { ...point, conceptId: 'missing' }, { ...point, step: 10 }, { ...point, step: 0 }])(
  'ẩn điểm dừng thiếu hoặc ngoài khoảng: %j', async resume => {
    state.loadResume.mockResolvedValue(resume)
    await render()
    expect(container.textContent).toBe('')
  },
)

it('chỉ ôn: hiện số bài và link ôn', async () => {
  state.due = [review]
  await render()
  expect(container.textContent).toContain('Buổi học hôm nay · khoảng 5 phút')
  expect(container.querySelector('a')?.textContent).toBe('Ôn 1 bài đến hạn')
  expect(container.querySelector('a')?.getAttribute('href')).toBe('/on-tap')
})

it('ôn trước học tiếp, cộng thời gian, chỉ mục đầu có nền accent', async () => {
  state.due = [review, { ...review, conceptId: 'a' }]
  state.loadResume.mockResolvedValue(point)
  await render(true)
  expect(container.textContent).toContain('khoảng 30 phút')
  const links = [...container.querySelectorAll('a')]
  expect(links.map(link => link.textContent)).toEqual(['Ôn 2 bài đến hạn', 'Học tiếp · Bài A · bước 4/9'])
  expect(links[0].classList.contains('bg-accent')).toBe(true)
  expect(links[1].classList.contains('bg-accent')).toBe(false)
  expect(links.every(link => link.classList.contains('min-h-[44px]'))).toBe(true)
})

it.each(['guest', 'loading', 'pending', 'empty', 'error'])('không hiện thẻ chỉ ôn khi %s', async mode => {
  state.due = [review]
  if (mode === 'guest') state.user = null
  if (mode === 'loading') state.loading = true
  if (mode === 'pending') state.due = null
  if (mode === 'empty') state.due = []
  if (mode === 'error') state.error = 'Lỗi tải'
  await render()
  expect(container.textContent).toBe('')
})

it.each(['user', 'progress', 'reviews'])('không nháy thẻ khi đang tải %s', async mode => {
  state.loadResume.mockResolvedValue(point)
  if (mode === 'user') state.loading = true
  if (mode === 'progress') state.progress = null
  if (mode === 'reviews') state.due = null
  await render(true)
  expect(container.textContent).toBe('')
  state.loading = false; state.progress = {}; state.due = []
  await render(true)
  expect(container.textContent).toContain('Học tiếp · Bài A')
})

it('chờ điểm dừng tải xong trước khi chọn bài mới', async () => {
  let finish!: (value: ResumePoint | null) => void
  state.loadResume.mockReturnValue(new Promise(resolve => { finish = resolve }))
  await render(true)
  expect(container.textContent).toBe('')
  await act(async () => finish(point))
  expect(container.textContent).toContain('Học tiếp · Bài A')
  expect(container.textContent).not.toContain('Bài mới')
})

it.each([false, true])('lỗi lịch ôn không chặn học tiếp/bài mới: includeNew=%s', async includeNew => {
  state.due = null; state.error = 'Lỗi tải'
  state.loadResume.mockResolvedValue(includeNew ? null : point)
  await render(includeNew)
  expect(container.textContent).toContain(includeNew ? 'Bài mới · Bài A' : 'Học tiếp · Bài A')
  expect(container.textContent).not.toContain('đến hạn')
})

it('khách dùng localStorage, cập nhật khi có sự kiện storage và không có mục ôn', async () => {
  state.user = null; state.progress = null; state.due = [review]
  localStorage.setItem('imcoding-resume', JSON.stringify(point))
  await render(true)
  expect(container.querySelector('a')?.getAttribute('href')).toBe('/concepts/a#buoc-4')
  expect(container.querySelectorAll('a')).toHaveLength(1)
  await act(async () => {
    localStorage.setItem('imcoding-resume', JSON.stringify({ ...point, step: 7 }))
    window.dispatchEvent(new StorageEvent('storage', { key: 'imcoding-resume' }))
  })
  expect(container.querySelector('a')?.getAttribute('href')).toBe('/concepts/a#buoc-7')
  await act(async () => { localStorage.removeItem('imcoding-resume'); window.dispatchEvent(new StorageEvent('storage')) })
  expect(container.textContent).toContain('Bài mới · Bài A')
})

it('khách mới chỉ có bài mới ở trang chủ, không có mục đó trên map', async () => {
  state.user = null; state.progress = null; state.due = null
  await render(true)
  expect(container.textContent).toContain('khoảng 30 phút')
  expect(container.querySelector('a')?.getAttribute('href')).toBe('/concepts/a')
  await render(false)
  expect(container.textContent).toBe('')
})

it('bài mới dùng tiến độ; đã hiểu hết thì không còn thẻ', async () => {
  state.progress = { a: 'understood' }
  await render(true)
  expect(container.querySelector('a')?.getAttribute('href')).toBe('/concepts/b')
  state.progress = { a: 'understood', b: 'understood' }
  await render(true)
  expect(container.textContent).toBe('')
})

it('lỗi tải điểm dừng vẫn cho học bài mới', async () => {
  state.loadResume.mockRejectedValue(new Error('Lỗi tải'))
  await render(true)
  expect(container.textContent).toContain('Bài mới · Bài A')
})

it('lỗi tiến độ không đưa ra gợi ý thiếu dữ liệu', async () => {
  state.progress = null; state.progressError = 'Lỗi tải'
  await render(true)
  expect(container.textContent).toBe('')
})

it('bỏ kết quả tải cũ sau khi đổi tài khoản', async () => {
  let finish!: (value: ResumePoint | null) => void
  state.loadResume.mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
  await render(true)
  state.user = { id: 'other' }
  await render(true)
  expect(container.textContent).toContain('Bài mới · Bài A')
  await act(async () => finish(point))
  expect(container.textContent).not.toContain('Học tiếp')
})
