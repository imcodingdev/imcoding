// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import type { AppUser, Backend } from '@/lib/backend/types'
import type { ProgressMap } from '@/lib/progress/status'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const user: AppUser = { id: 'u1', email: null, name: 'A', avatarUrl: null }
let stub: Backend

vi.mock('@/lib/backend', () => ({ createBackend: () => stub }))

type Api = {
  progress: ProgressMap | null
  error: string | null
  markUnderstood(id: string): Promise<void>
}
const deferred = <T,>() => {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => ((resolve = res), (reject = rej)))
  return { promise, resolve, reject }
}

async function setup(overrides: Partial<Backend>) {
  stub = {
    getUser: async () => user,
    onAuthChange: () => () => {},
    signInWithGitHub: async () => {},
    signOut: async () => {},
    loadProgress: async () => ({}),
    loadResume: async () => null,
    saveStep: async () => {},
    markUnderstood: async () => {},
    ...overrides,
  }
  vi.resetModules() // BackendProvider cache backend ở module scope
  const { BackendProvider, useProgress } = await import('@/components/BackendProvider')
  const api: { current: Api | null } = { current: null }
  function Probe() {
    api.current = useProgress(['a', 'b'])
    return null
  }
  const root = createRoot(document.createElement('div'))
  await act(async () => {
    root.render(createElement(BackendProvider, null, createElement(Probe)))
  })
  return api as { current: Api }
}

describe('useProgress', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('mark thành công → understood; mark lỗi → giữ nguyên và ném lại', async () => {
    const mark = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('x'))
    const api = await setup({ loadProgress: async () => ({ a: 'seen' }), markUnderstood: mark })
    expect(api.current.progress).toEqual({ a: 'seen' })
    await act(async () => {
      await api.current.markUnderstood('b')
    })
    expect(api.current.progress).toEqual({ a: 'seen', b: 'understood' })
    await act(async () => {
      await expect(api.current.markUnderstood('a')).rejects.toThrow('x')
    })
    expect(api.current.progress).toEqual({ a: 'seen', b: 'understood' })
  })

  it('mark xong khi load còn đang chạy: không bị load ghi đè', async () => {
    const d = deferred<ProgressMap>()
    const api = await setup({ loadProgress: () => d.promise })
    await act(async () => {
      await api.current.markUnderstood('a')
    })
    await act(async () => {
      d.resolve({ a: 'seen', b: 'seen' })
    })
    expect(api.current.progress).toEqual({ a: 'understood', b: 'seen' })
    expect(api.current.error).toBeNull()
  })

  it('load lỗi rồi mark thành công: vẫn giữ error, không giả làm bản đầy đủ', async () => {
    const api = await setup({ loadProgress: () => Promise.reject(new Error('net')) })
    expect(api.current.progress).toBeNull()
    expect(api.current.error).toBeTruthy()
    await act(async () => {
      await api.current.markUnderstood('a')
    })
    expect(api.current.error).toBeTruthy()
    expect(api.current.progress).toEqual({ a: 'understood' })
  })
})
