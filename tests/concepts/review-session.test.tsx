// @vitest-environment jsdom
import { act, createElement, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ReviewRow } from '@/lib/backend/types'
import type { ConceptV1, ConceptV2 } from '@/lib/concepts/types'
import { ReviewSession, type ReviewLesson } from '@/components/ReviewSession'
import { LessonQuiz } from '@/components/LessonQuiz'
import ReviewPage, { metadata } from '@/app/on-tap/page'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
const state = vi.hoisted(() => ({
  user: { id: 'u' } as { id: string } | null, loading: false,
  due: [] as ReviewRow[] | null, error: null as string | null,
  markReviewed: vi.fn(), signInWithGitHub: vi.fn(), track: vi.fn(), load: vi.fn(),
}))
vi.mock('@/components/BackendProvider', () => ({ useUser: () => state, useReviews: () => state, useBackend: () => state }))
vi.mock('@/lib/metrics', () => ({ track: state.track }))
vi.mock('@/lib/concepts/load', () => ({ loadConcepts: state.load }))
const quiz = Array.from({ length: 4 }, (_, i) => ({ question: `Câu ${i + 1}`, body: '', options: ['Đúng', 'Sai'], correctIndex: 0, explanation: 'Lý do đúng' }))
const lesson: ReviewLesson = { id: 'a', title: 'Bài A', quiz, checks: [{ question: 'Tự giải', body: 'Tình huống', answer: 'Đáp án riêng' }] }
const row: ReviewRow = { conceptId: 'a', understoodAt: '2026-11-01T00:00:00Z', lastReviewedAt: null }
let root: Root | undefined
let container: HTMLDivElement
beforeEach(() => {
  vi.clearAllMocks()
  state.user = { id: 'u' }; state.loading = false; state.due = [row]; state.error = null
  state.markReviewed.mockResolvedValue(undefined)
  state.signInWithGitHub.mockResolvedValue(undefined)
})
afterEach(() => { act(() => root?.unmount()); root = undefined; container?.remove() })
function render(element: ReactElement = createElement(ReviewSession, { lessons: [lesson] })) {
  if (!root) { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container) }
  act(() => root!.render(element))
}
const button = (text: string) => [...container.querySelectorAll('button')].find(b => b.textContent === text)!
const click = async (element: HTMLElement) => { await act(async () => element.click()) }

it('khách được mời đăng nhập, trả về đúng trang ôn; báo lỗi đăng nhập', async () => {
  state.user = null
  state.signInWithGitHub.mockRejectedValue(new Error('lỗi'))
  history.replaceState(null, '', '/on-tap')
  render()
  expect(container.textContent).toContain('Đăng nhập để xem lịch ôn tập')
  expect(container.querySelectorAll('fieldset')).toHaveLength(0)
  await click(button('Đăng nhập bằng GitHub'))
  expect(state.signInWithGitHub).toHaveBeenCalledWith('/on-tap')
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('Không đăng nhập được')
})

it.each(['auth', 'load', 'error', 'empty'])('phân biệt trạng thái %s', mode => {
  if (mode === 'auth') state.loading = true
  if (mode === 'load') state.due = null
  if (mode === 'error') { state.error = 'Không tải được lịch ôn'; state.due = null }
  if (mode === 'empty') state.due = []
  render()
  if (mode === 'empty') {
    expect(container.textContent).toContain('Chưa có bài cần ôn hôm nay')
    expect(container.querySelector('a')?.getAttribute('href')).toBe('/map')
  } else if (mode === 'error') expect(container.querySelector('[role="alert"]')?.textContent).toBe(state.error)
  else expect(container.textContent).toContain('Đang tải')
  expect(container.querySelectorAll('fieldset')).toHaveLength(0)
})

it.each([[null, '1/3'], ['2026-11-02T00:00:00Z', '2/3'], ['2026-11-04T00:00:00Z', '3/3']])('hiện mốc %s thành %s', (lastReviewedAt, milestone) => {
  state.due = [{ ...row, lastReviewedAt }]
  render()
  expect(container.textContent).toContain(`Lần ôn ${milestone}`)
  expect(container.querySelector('a')?.getAttribute('href')).toBe('/concepts/a')
})

it('bốn câu quiz chấm được, đáp án ẩn và ôn xong không ghi số liệu', async () => {
  render()
  expect(container.querySelectorAll('fieldset')).toHaveLength(4)
  const details = container.querySelector('details')!
  expect(details.open).toBe(false)
  await click(details.querySelector('summary')!)
  expect(details.open).toBe(true)
  expect(details.textContent).toContain('Đáp án riêng')
  await click(container.querySelector('input')!)
  await click(button('Kiểm tra'))
  expect(container.textContent).toContain('Chính xác')
  await click(button('Đã ôn xong'))
  expect(state.markReviewed).toHaveBeenCalledWith('a')
  expect(state.track).not.toHaveBeenCalled()
})

it('quiz tại bài học vẫn ghi quiz_done theo mặc định', async () => {
  render(createElement(LessonQuiz, { conceptId: 'a', items: quiz }))
  await click(container.querySelector('input')!)
  await click(button('Kiểm tra'))
  expect(state.track).toHaveBeenCalledWith({ event: 'quiz_done', concept_id: 'a', score: 1, total: 1 })
})

it('lưu đang chờ thì khóa nút, thất bại giữ bài và cho thử lại', async () => {
  let reject!: (error: Error) => void
  state.markReviewed.mockReturnValueOnce(new Promise((_, rej) => { reject = rej }))
  render()
  await click(button('Đã ôn xong'))
  expect(container.querySelector<HTMLButtonElement>('button[disabled]')).not.toBeNull()
  expect(button('Đang lưu…').disabled).toBe(true)
  await act(async () => reject(new Error('lỗi')))
  expect(container.textContent).toContain('Chưa lưu được, thử lại nhé')
  expect(button('Đã ôn xong').disabled).toBe(false)
  await click(button('Đã ôn xong'))
  expect(state.markReviewed).toHaveBeenCalledTimes(2)
})

it('bài không có quiz hoặc phần tự kiểm tra vẫn ôn được', () => {
  render(createElement(ReviewSession, { lessons: [{ id: 'a', title: 'Bài cũ', checks: [] }] }))
  expect(container.querySelectorAll('fieldset, details')).toHaveLength(0)
  expect(button('Đã ôn xong')).toBeTruthy()
})

it('trang server có metadata và chuyển đúng nội dung v1/v2', () => {
  const base = { id: 'a', title: 'Bài A', group: 'web' as const, prerequisites: [], priority: 1 as const, signals: [], stage: 1 as const }
  const v1: ConceptV1 = { ...base, format: 1, sections: { plain: '', inCode: '', pitfalls: '' }, quiz: lesson.checks }
  const v2: ConceptV2 = { ...base, id: 'b', format: 2, recall: [], predict: { scenario: '', answer: '' }, example: '', findInProject: '', explain: [], check: lesson.checks[0], misconceptions: [], quiz }
  state.load.mockReturnValue([v1, v2])
  state.due = [row, { ...row, conceptId: 'b' }]
  render(createElement(ReviewPage))
  expect(metadata.title).toBe('Ôn tập – ImCoding')
  expect(container.querySelector('h1')?.textContent).toBe('Ôn tập')
  expect(container.querySelectorAll('fieldset')).toHaveLength(4)
  expect(container.querySelectorAll('details')).toHaveLength(2)
  expect([...container.querySelectorAll('a')].map(a => a.getAttribute('href'))).toContain('/concepts/b')
})
