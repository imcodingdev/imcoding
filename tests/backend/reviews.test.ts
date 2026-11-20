// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createFakeBackend } from '@/lib/backend/fake'

const start = '2026-11-01T08:00:00.000Z'
beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('imcoding-fake-user', JSON.stringify({ id: 'fake-user' }))
  vi.useFakeTimers()
  vi.setSystemTime(new Date(start))
})
afterEach(() => vi.useRealTimers())

it('lưu thời điểm hiểu và ôn, giữ qua backend mới, không đổi tiến độ', async () => {
  const backend = createFakeBackend()
  expect(await backend.loadReviews()).toEqual([])
  await backend.markUnderstood('a')
  expect(await backend.loadReviews()).toEqual([{ conceptId: 'a', understoodAt: start, lastReviewedAt: null }])
  const later = '2026-11-03T08:00:00.000Z'
  vi.setSystemTime(new Date(later))
  await backend.markReviewed('a')
  expect(await createFakeBackend().loadReviews()).toEqual([{ conceptId: 'a', understoodAt: start, lastReviewedAt: later }])
  expect(await backend.loadProgress()).toEqual({ a: 'understood' })
  await backend.markUnderstood('a')
  expect(await backend.loadReviews()).toEqual([{ conceptId: 'a', understoodAt: later, lastReviewedAt: later }])
})

it('đọc key seed ReviewRow, chỉ nhận bài đã hiểu có thời điểm', async () => {
  localStorage.setItem('imcoding-fake-progress', JSON.stringify({ a: 'understood', b: 'seen', c: 'understood' }))
  const row = { conceptId: 'a', understoodAt: start, lastReviewedAt: null }
  localStorage.setItem('imcoding-fake-reviews', JSON.stringify([row, { ...row, conceptId: 'b' }, { ...row, conceptId: 'c', understoodAt: null }]))
  expect(await createFakeBackend().loadReviews()).toEqual([row])
})

it('từ chối tải/ôn khi chưa đăng nhập; không tự tạo dòng chưa hiểu', async () => {
  const backend = createFakeBackend()
  await expect(backend.markReviewed('missing')).rejects.toThrow()
  await backend.saveStep('seen', 1)
  await expect(backend.markReviewed('seen')).rejects.toThrow()
  await backend.markUnderstood('a')
  localStorage.removeItem('imcoding-fake-user')
  await expect(backend.loadReviews()).rejects.toThrow('Chưa đăng nhập')
  await expect(backend.markReviewed('a')).rejects.toThrow('Chưa đăng nhập')
  expect(JSON.parse(localStorage.getItem('imcoding-fake-reviews')!)[0].lastReviewedAt).toBeNull()
})

it('lỗi giả không làm thay đổi thời điểm ôn', async () => {
  const backend = createFakeBackend()
  await backend.markUnderstood('a')
  localStorage.setItem('imcoding-fake-fail', '1')
  await expect(backend.loadReviews()).rejects.toThrow()
  await expect(backend.markReviewed('a')).rejects.toThrow()
  localStorage.removeItem('imcoding-fake-fail')
  expect((await backend.loadReviews())[0].lastReviewedAt).toBeNull()
})
