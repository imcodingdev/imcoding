// @vitest-environment jsdom
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { track, metricsEnabled, setMetricsEnabled } from '@/lib/metrics'

const { insert, createClient } = vi.hoisted(() => {
  const insert = vi.fn().mockResolvedValue({ error: null })
  return { insert, createClient: vi.fn(() => ({ from: vi.fn(() => ({ insert })) })) }
})
vi.mock('@supabase/supabase-js', () => ({ createClient }))
const flush = async () => { await Promise.resolve(); await Promise.resolve() }

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  vi.stubEnv('NEXT_PUBLIC_FAKE_BACKEND', '0')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://metrics.invalid')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'fake-public-key')
  vi.stubGlobal('navigator', { doNotTrack: null, globalPrivacyControl: false })
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.useRealTimers() })

it('visitor ngẫu nhiên giữ nguyên sau đăng nhập, đăng xuất và tải lại module', async () => {
  const random = vi.spyOn(crypto, 'getRandomValues')
  track({ event: 'lesson_open', concept_id: 'client-server' })
  await flush()
  const visitor = localStorage.getItem('imcoding-visitor')
  expect(visitor).toMatch(/^[A-Za-z0-9_-]{16,64}$/)
  expect(random).toHaveBeenCalledOnce()
  localStorage.setItem('imcoding-fake-user', JSON.stringify({ id: 'account-1', email: 'private@example.test' }))
  track({ event: 'understood', concept_id: 'client-server' })
  localStorage.removeItem('imcoding-fake-user')
  vi.resetModules()
  const reloaded = await import('@/lib/metrics')
  reloaded.track({ event: 'lesson_open', concept_id: 'json' })
  await flush()
  expect(insert).toHaveBeenCalledTimes(3)
  expect(insert.mock.calls.every(([payload]) => payload.visitor === visitor)).toBe(true)
  expect(JSON.stringify(insert.mock.calls)).not.toContain('account-1')
  expect(createClient).toHaveBeenCalledWith('https://metrics.invalid', 'fake-public-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
})

it('mặc định bật, tắt thì không sinh visitor hoặc gửi, bật lại dùng visitor cũ', async () => {
  expect(metricsEnabled()).toBe(true)
  setMetricsEnabled(false)
  expect(localStorage.getItem('imcoding-metrics-off')).toBe('1')
  track({ event: 'lesson_open' })
  await flush()
  expect(insert).not.toHaveBeenCalled()
  expect(localStorage.getItem('imcoding-visitor')).toBeNull()
  setMetricsEnabled(true)
  track({ event: 'lesson_open' })
  const visitor = localStorage.getItem('imcoding-visitor')
  setMetricsEnabled(false)
  track({ event: 'quiz_done', score: 1, total: 1 })
  setMetricsEnabled(true)
  track({ event: 'lesson_open' })
  await flush()
  expect(insert).toHaveBeenCalledTimes(2)
  expect(localStorage.getItem('imcoding-visitor')).toBe(visitor)
})

it.each(['dnt', 'gpc'])('%s chặn gửi ngay cả khi đã bật thủ công', async signal => {
  vi.stubGlobal('navigator', { doNotTrack: signal === 'dnt' ? '1' : null, globalPrivacyControl: signal === 'gpc' })
  setMetricsEnabled(true)
  expect(metricsEnabled()).toBe(false)
  track({ event: 'practical_search' })
  await flush()
  expect(insert).not.toHaveBeenCalled()
  expect(localStorage.getItem('imcoding-visitor')).toBeNull()
})

it('tối đa 60 trong cửa sổ trượt một giờ, giữ giới hạn khi tải lại', async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-12T00:00:00Z'))
  for (let i = 0; i < 61; i++) track({ event: 'step_reached', step: 2 })
  await flush()
  expect(insert).toHaveBeenCalledTimes(60)
  vi.resetModules()
  const reloaded = await import('@/lib/metrics')
  reloaded.track({ event: 'lesson_open' })
  await flush()
  expect(insert).toHaveBeenCalledTimes(60)
  vi.advanceTimersByTime(3_600_000)
  reloaded.track({ event: 'lesson_open' })
  await flush()
  expect(insert).toHaveBeenCalledTimes(61)
})

it('payload chỉ chứa trường cho phép, bỏ tài khoản, câu hỏi, URL, created_at', async () => {
  const input = { event: 'quiz_done' as const, concept_id: 'json', step: 3, score: 2, total: 3,
    user_id: 'private-id', email: 'private-email', question: 'private-question', url: 'private-url', created_at: '1999', visitor: 'injected' }
  track(input)
  await flush()
  expect(insert.mock.calls[0][0]).toEqual({ event: 'quiz_done', concept_id: 'json', step: 3, score: 2, total: 3, visitor: localStorage.getItem('imcoding-visitor') })
})

it('không gửi giá trị sai mẫu hoặc số ngoài giới hạn', async () => {
  for (const input of [
    { event: 'unknown' }, { event: 'lesson_open', concept_id: 'BAD/ID' },
    { event: 'step_reached', step: 21 }, { event: 'step_reached', step: 1.5 },
    { event: 'quiz_done', score: 3, total: 2 }, { event: 'quiz_done', score: -1, total: 3 },
  ]) track(input as Parameters<typeof track>[0])
  await flush()
  expect(insert).not.toHaveBeenCalled()
})

it('storage bị chặn thì bỏ sự kiện, lỗi mạng không văng hoặc log', async () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {})
  const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
  expect(() => track({ event: 'lesson_open' })).not.toThrow()
  expect(insert).not.toHaveBeenCalled()
  get.mockRestore()
  insert.mockRejectedValueOnce(new Error('private server message'))
  expect(track({ event: 'lesson_open' })).toBeUndefined()
  await flush()
  expect(log).not.toHaveBeenCalled()
})

it('backend giả chỉ ghi trong bộ nhớ và vẫn áp dụng opt-out', async () => {
  vi.stubEnv('NEXT_PUBLIC_FAKE_BACKEND', '1')
  track({ event: 'practical_search' })
  await flush()
  expect(window.__imcodingLearningEvents?.at(-1)?.event).toBe('practical_search')
  const count = window.__imcodingLearningEvents?.length
  setMetricsEnabled(false)
  track({ event: 'practical_ai' })
  await flush()
  expect(window.__imcodingLearningEvents).toHaveLength(count!)
  expect(insert).not.toHaveBeenCalled()
})

it('sự kiện đợi khóa giữa các tab phải kiểm tra lại opt-out trước khi gửi', async () => {
  const callbacks: Array<() => Promise<void>> = []
  vi.stubGlobal('navigator', { locks: { request: vi.fn((_name: string, callback: () => Promise<void>) => {
    callbacks.push(callback)
    return Promise.resolve()
  }) } })
  track({ event: 'lesson_open' })
  setMetricsEnabled(false)
  await callbacks[0]()
  expect(insert).not.toHaveBeenCalled()
  expect(localStorage.getItem('imcoding-visitor')).toBeNull()
})

it('hạn mức dùng chung cho hai module/tab khi cùng tranh khóa', async () => {
  let queue = Promise.resolve()
  vi.stubGlobal('navigator', { locks: { request: vi.fn((_name: string, callback: () => Promise<void>) => {
    queue = queue.then(callback)
    return queue
  }) } })
  vi.resetModules()
  const other = await import('@/lib/metrics')
  for (let i = 0; i < 40; i++) {
    track({ event: 'lesson_open' })
    other.track({ event: 'lesson_open' })
  }
  await queue
  expect(insert).toHaveBeenCalledTimes(60)
})
