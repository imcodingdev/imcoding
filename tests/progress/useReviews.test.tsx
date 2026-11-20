// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { AppUser, Backend, ReviewRow } from '@/lib/backend/types'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
const user: AppUser = { id: 'u1', email: null, name: null, avatarUrl: null }
const row: ReviewRow = { conceptId: 'a', understoodAt: '2026-11-01T00:00:00Z', lastReviewedAt: null }
let stub: Backend
let root: Root
vi.mock('@/lib/backend', () => ({ createBackend: () => stub }))
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-03T00:00:00Z')) })
afterEach(async () => { if (root) await act(async () => root.unmount()); vi.useRealTimers() })
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(res => { resolve = res })
  return { promise, resolve }
}

async function setup(overrides: Partial<Backend> = {}) {
  let auth!: (value: AppUser | null) => void
  stub = {
    getUser: async () => user, onAuthChange: cb => { auth = cb; return () => {} },
    signInWithGitHub: async () => {}, signOut: async () => {},
    loadProgress: async () => ({}), loadResume: async () => null, saveStep: async () => {},
    markUnderstood: async () => {}, markReviewed: vi.fn(async () => {}),
    loadReviews: vi.fn(async () => [row, { ...row, conceptId: 'unknown' }]), ...overrides,
  }
  vi.resetModules()
  const { BackendProvider, useReviews, useProgress } = await import('@/components/BackendProvider')
  const api = {} as { first: ReturnType<typeof useReviews>; second: ReturnType<typeof useReviews>; progress: ReturnType<typeof useProgress> }
  function Probe({ second = false }) {
    const review = useReviews(['a', 'b'])
    api[second ? 'second' : 'first'] = review
    api.progress = useProgress(['a', 'b'])
    return null
  }
  root = createRoot(document.createElement('div'))
  await act(async () => root.render(createElement(BackendProvider, null, createElement(Probe), createElement(Probe, { second: true }))))
  return { api, auth: (value: AppUser | null) => auth(value) }
}

it('tải một lần cho hai nơi dùng; lọc bài lạ và ẩn đồng thời sau khi ôn', async () => {
  const { api } = await setup()
  expect(stub.loadReviews).toHaveBeenCalledTimes(1)
  expect(api.first.due).toEqual([row])
  await act(async () => api.first.markReviewed('a'))
  expect(stub.markReviewed).toHaveBeenCalledWith('a')
  expect(api.first.due).toEqual([])
  expect(api.second.due).toEqual([])
  expect(stub.loadReviews).toHaveBeenCalledTimes(1)
})

it('lỗi ghi giữ bài để thử lại, lỗi tải không giả thành danh sách rỗng', async () => {
  const { api } = await setup({ markReviewed: async () => { throw new Error('ghi lỗi') } })
  await act(async () => { await expect(api.first.markReviewed('a')).rejects.toThrow('ghi lỗi') })
  expect(api.first.due).toEqual([row])
})

it('tải lỗi trả null kèm thông báo', async () => {
  const { api } = await setup({ loadReviews: async () => { throw new Error('lỗi tải') } })
  expect(api.first.due).toBeNull()
  expect(api.first.error).toBeTruthy()
})

it('hiểu lại trong lúc tải không bị dữ liệu cũ ghi đè; sau 24 giờ tự đến hạn', async () => {
  const pending = deferred<ReviewRow[]>()
  const { api } = await setup({ loadReviews: () => pending.promise })
  expect(api.first.due).toBeNull()
  await act(async () => api.progress.markUnderstood('a'))
  await act(async () => pending.resolve([row]))
  expect(api.first.due).toEqual([])
  await act(async () => vi.advanceTimersByTime(86_400_000))
  expect(api.first.due?.map(r => r.conceptId)).toEqual(['a'])
})

it('bài mới hiểu có lịch trong phiên mà không tải lại', async () => {
  const { api } = await setup({ loadReviews: vi.fn(async () => []) })
  await act(async () => api.progress.markUnderstood('b'))
  expect(api.first.due).toEqual([])
  await act(async () => vi.advanceTimersByTime(86_400_000))
  expect(api.first.due?.map(r => r.conceptId)).toEqual(['b'])
  expect(stub.loadReviews).toHaveBeenCalledTimes(1)
})

it('khách không tải, không được ghi; đăng nhập mới tải', async () => {
  const { api, auth } = await setup({ getUser: async () => null })
  expect(stub.loadReviews).not.toHaveBeenCalled()
  expect(api.first.due).toBeNull()
  await expect(api.first.markReviewed('a')).rejects.toThrow()
  await act(async () => auth(user))
  expect(api.first.due).toEqual([row])
})

it('đổi user bỏ kết quả tải và ghi cũ, đăng nhập lại không giữ dấu ôn cũ', async () => {
  const pending = deferred<void>()
  const { api, auth } = await setup({ markReviewed: () => pending.promise })
  let saving!: Promise<void>
  await act(async () => { saving = api.first.markReviewed('a') })
  await act(async () => auth(null))
  expect(api.first.due).toBeNull()
  await act(async () => auth({ ...user, id: 'u2' }))
  await act(async () => { pending.resolve(); await saving })
  expect(api.first.due).toEqual([row])
  await act(async () => auth(user))
  expect(api.first.due).toEqual([row])
})

it('kết quả tải của user cũ không lộ khi user mới đang tải', async () => {
  const first = deferred<ReviewRow[]>()
  const second = deferred<ReviewRow[]>()
  const { api, auth } = await setup({ loadReviews: vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise) })
  await act(async () => auth({ ...user, id: 'u2' }))
  await act(async () => first.resolve([row]))
  expect(api.first.due).toBeNull()
  await act(async () => second.resolve([]))
  expect(api.first.due).toEqual([])
})

it('hook ngoài provider dùng backend chưa sẵn sàng', async () => {
  const { useReviews, useBackend } = await import('@/components/BackendProvider')
  let api!: ReturnType<typeof useReviews>
  let backend!: Backend
  function Probe() { api = useReviews(['a']); backend = useBackend(); return null }
  root = createRoot(document.createElement('div'))
  await act(async () => root.render(createElement(Probe)))
  await expect(api.markReviewed('a')).rejects.toThrow('Backend chưa sẵn sàng')
  await expect(backend.loadReviews()).rejects.toThrow('Backend chưa sẵn sàng')
  await expect(backend.markReviewed('a')).rejects.toThrow('Backend chưa sẵn sàng')
})

it('ôn trong lúc tải không bị kết quả cũ ghi đè', async () => {
  const pending = deferred<ReviewRow[]>()
  const { api } = await setup({ loadReviews: () => pending.promise })
  await act(async () => api.first.markReviewed('a'))
  await act(async () => pending.resolve([row]))
  expect(api.first.due).toEqual([])
})

it('sự kiện cùng user không tải lại, getUser cũ không ghi đè sự kiện đăng nhập mới', async () => {
  const pending = deferred<AppUser | null>()
  const { api, auth } = await setup({ getUser: () => pending.promise })
  await act(async () => auth({ ...user, id: 'u2' }))
  await act(async () => pending.resolve(user))
  await act(async () => auth({ ...user, id: 'u2', name: 'Tên mới' }))
  expect(stub.loadReviews).toHaveBeenCalledTimes(1)
  expect(api.first.due).toEqual([row])
})

it('đăng xuất rồi đăng nhập trong cùng lượt xử lý cũng bỏ kết quả tải của phiên trước', async () => {
  const old = deferred<ReviewRow[]>()
  const current = deferred<ReviewRow[]>()
  const { api, auth } = await setup({ loadReviews: vi.fn().mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise) })
  await act(async () => {
    auth(null)
    auth(user)
    old.resolve([row])
    await Promise.resolve()
  })
  expect(api.first.due).toBeNull()
  await act(async () => current.resolve([]))
  expect(api.first.due).toEqual([])
})
