import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createSupabaseBackend, createUnconfiguredBackend } from '@/lib/backend/supabase'

const mock = vi.hoisted(() => ({ create: vi.fn() }))
vi.mock('@supabase/ssr', () => ({ createBrowserClient: mock.create }))
beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.invalid')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'fake')
})
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers() })

function setup(data: unknown = [], error: Error | null = null, signedIn = true) {
  const query = { data, error, select: vi.fn(), eq: vi.fn(), not: vi.fn(), update: vi.fn(), maybeSingle: vi.fn(), upsert: vi.fn() }
  for (const method of [query.select, query.eq, query.not, query.update, query.maybeSingle]) method.mockReturnValue(query)
  const from = vi.fn(() => query)
  mock.create.mockReturnValue({ auth: { getSession: async () => ({ data: { session: signedIn ? { user: { id: 'u' } } : null } }) }, from })
  return { backend: createSupabaseBackend(), query, from }
}

it('tải đúng cột và chỉ tiến độ đã hiểu có thời điểm của user', async () => {
  const { backend, query, from } = setup([{ concept_id: 'a', understood_at: '2026-11-01T00:00:00Z', last_reviewed_at: null }])
  expect(await backend.loadReviews()).toEqual([{ conceptId: 'a', understoodAt: '2026-11-01T00:00:00Z', lastReviewedAt: null }])
  expect(from).toHaveBeenCalledWith('progress')
  expect(query.select).toHaveBeenCalledWith('concept_id, understood_at, last_reviewed_at')
  expect(query.eq.mock.calls).toEqual([['user_id', 'u'], ['status', 'understood']])
  expect(query.not).toHaveBeenCalledWith('understood_at', 'is', null)
})

it('ôn chỉ update hai cột thời điểm của đúng user và bài đã hiểu', async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-03T00:00:00Z'))
  const { backend, query, from } = setup({ concept_id: 'a' })
  await backend.markReviewed('a')
  expect(from).toHaveBeenCalledWith('progress')
  expect(query.update).toHaveBeenCalledWith({ last_reviewed_at: '2026-11-03T00:00:00.000Z', updated_at: '2026-11-03T00:00:00.000Z' })
  expect(query.eq.mock.calls).toEqual([['user_id', 'u'], ['concept_id', 'a'], ['status', 'understood']])
  expect(query.not).toHaveBeenCalledWith('understood_at', 'is', null)
  expect(query.select).toHaveBeenCalledWith('concept_id')
  expect(query.upsert).not.toHaveBeenCalled()
})

it('thiếu dòng, lỗi DB hoặc chưa đăng nhập đều ném lỗi', async () => {
  await expect(setup(null).backend.markReviewed('a')).rejects.toThrow()
  const failed = setup(null, new Error('db'))
  await expect(failed.backend.loadReviews()).rejects.toThrow('db')
  await expect(failed.backend.markReviewed('a')).rejects.toThrow('db')
  const guest = setup(null, null, false)
  await expect(guest.backend.loadReviews()).rejects.toThrow('Chưa đăng nhập')
  await expect(guest.backend.markReviewed('a')).rejects.toThrow('Chưa đăng nhập')
  expect(guest.from).not.toHaveBeenCalled()
})

it('backend chưa cấu hình từ chối cả hai method', async () => {
  const backend = createUnconfiguredBackend()
  await expect(backend.loadReviews()).rejects.toThrow('Chưa cấu hình')
  await expect(backend.markReviewed('a')).rejects.toThrow('Chưa cấu hình')
})
