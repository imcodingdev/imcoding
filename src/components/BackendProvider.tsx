'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import { createBackend } from '@/lib/backend'
import type { AppUser, Backend } from '@/lib/backend/types'
import { filterKnown, type ProgressMap } from '@/lib/progress/status'

interface Ctx {
  backend: Backend | null
  user: AppUser | null
  loading: boolean
  shared: SharedProgress | null
  markUnderstood(id: string): Promise<void>
}

// Tiến độ dùng chung: tải một lần cho mỗi user; marks là các lần đánh dấu thành công trong phiên,
// luôn được gộp đè lên kết quả load
interface SharedProgress {
  userId: string
  loaded: ProgressMap | null
  marks: ProgressMap
  error: string | null
}

const BackendContext = createContext<Ctx>({
  backend: null,
  user: null,
  loading: true,
  shared: null,
  markUnderstood: () => Promise.reject(new Error('Backend chưa sẵn sàng')),
})

const noBackend = (): Backend => {
  const fail = () => Promise.reject(new Error('Backend chưa sẵn sàng'))
  return {
    getUser: async () => null,
    onAuthChange: () => () => {},
    signInWithGitHub: fail,
    signOut: fail,
    loadProgress: fail,
    loadResume: fail,
    saveStep: fail,
    markUnderstood: fail,
  }
}

let clientBackend: Backend | null = null
const getClientBackend = (): Backend => (clientBackend ??= createBackend())
const subscribeNever = () => () => {}

export function BackendProvider({ children }: { children: React.ReactNode }) {
  // null trên server (prerender) và lần render hydrate đầu; backend chỉ tạo ở client
  const backend = useSyncExternalStore(subscribeNever, getClientBackend, () => null)
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!backend) return
    let alive = true
    const b = backend
    const off = b.onAuthChange((u) => {
      if (alive) setUser(u)
    })
    b.getUser()
      .then((u) => {
        if (alive) setUser(u)
      })
      .catch(() => {
        if (alive) setUser(null)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
      off()
    }
  }, [backend])

  const [state, setState] = useState<SharedProgress | null>(null)
  const userId = user?.id ?? null

  useEffect(() => {
    if (!backend || !userId) return
    let alive = true
    const prev = (st: SharedProgress | null) => (st && st.userId === userId ? st.marks : {})
    backend
      .loadProgress()
      .then((p) => {
        if (alive) setState((st) => ({ userId, loaded: p, marks: prev(st), error: null }))
      })
      .catch(() => {
        if (alive)
          setState((st) => ({
            userId,
            loaded: null,
            marks: prev(st),
            error: 'Không tải được tiến độ, thử tải lại trang',
          }))
      })
    return () => {
      alive = false
    }
  }, [backend, userId])

  const shared = state && state.userId === userId ? state : null

  const markUnderstood = useCallback(
    async (id: string) => {
      if (!backend) throw new Error('Backend chưa sẵn sàng')
      await backend.markUnderstood(id)
      if (!userId) return
      setState((st) => {
        const base: SharedProgress =
          st && st.userId === userId ? st : { userId, loaded: null, marks: {}, error: null }
        return { ...base, marks: { ...base.marks, [id]: 'understood' } }
      })
    },
    [backend, userId],
  )

  const value = useMemo(
    () => ({ backend, user, loading, shared, markUnderstood }),
    [backend, user, loading, shared, markUnderstood],
  )
  return <BackendContext.Provider value={value}>{children}</BackendContext.Provider>
}

export function useUser(): { user: AppUser | null; loading: boolean } {
  const { user, loading } = useContext(BackendContext)
  return { user, loading }
}

export function useBackend(): Backend {
  const { backend } = useContext(BackendContext)
  return useMemo(() => backend ?? noBackend(), [backend])
}

export function useProgress(knownIds: string[]): {
  progress: ProgressMap | null
  error: string | null
  markUnderstood(id: string): Promise<void>
} {
  const { shared, markUnderstood } = useContext(BackendContext)
  const key = knownIds.join('|')
  const hasMarks = !!shared && Object.keys(shared.marks).length > 0
  // Đang tải (chưa có kết quả) → null; load lỗi → chỉ các mark đã lưu (một phần) kèm error
  const progress = useMemo<ProgressMap | null>(() => {
    if (!shared) return null
    const known = key ? key.split('|') : []
    if (shared.loaded) return filterKnown({ ...shared.loaded, ...shared.marks }, known)
    if (shared.error && hasMarks) return filterKnown(shared.marks, known)
    return null
  }, [shared, key, hasMarks])
  return { progress, error: shared?.error ?? null, markUnderstood }
}
