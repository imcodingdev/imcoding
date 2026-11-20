'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { createBackend } from '@/lib/backend'
import type { AppUser, Backend, ReviewRow } from '@/lib/backend/types'
import { filterKnown, type ProgressMap } from '@/lib/progress/status'
import { dueReviews, reviewState } from '@/lib/progress/review'

interface Ctx {
  backend: Backend | null
  user: AppUser | null
  loading: boolean
  shared: SharedProgress | null
  reviews: SharedReviews | null
  markUnderstood(id: string): Promise<void>
  markReviewed(id: string): Promise<void>
}

// Tiến độ dùng chung: tải một lần cho mỗi user; marks là các lần đánh dấu thành công trong phiên,
// luôn được gộp đè lên kết quả load
interface SharedProgress {
  userId: string
  loaded: ProgressMap | null
  marks: ProgressMap
  error: string | null
}

interface SharedReviews {
  userId: string
  loaded: ReviewRow[] | null
  understood: Record<string, string>
  reviewed: Record<string, string>
  error: string | null
}

const emptyReviews = (userId: string): SharedReviews => ({ userId, loaded: null, understood: {}, reviewed: {}, error: null })

const BackendContext = createContext<Ctx>({
  backend: null,
  user: null,
  loading: true,
  shared: null,
  reviews: null,
  markUnderstood: () => Promise.reject(new Error('Backend chưa sẵn sàng')),
  markReviewed: () => Promise.reject(new Error('Backend chưa sẵn sàng')),
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
    loadReviews: fail,
    markReviewed: fail,
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
  const [state, setState] = useState<SharedProgress | null>(null)
  const [reviewsState, setReviewsState] = useState<SharedReviews | null>(null)
  // Tách các phiên kể cả khi đăng nhập lại cùng user trước lúc React dọn effect cũ.
  const [authEpoch, setAuthEpoch] = useState(0)
  const session = useRef({ userId: null as string | null, epoch: 0 })

  useEffect(() => {
    if (!backend) return
    let alive = true
    let authChanged = false
    const b = backend
    const acceptUser = (u: AppUser | null) => {
      if (!alive) return
      const id = u?.id ?? null
      if (session.current.userId !== id) {
        session.current = { userId: id, epoch: session.current.epoch + 1 }
        setAuthEpoch(session.current.epoch)
        setState(null)
        setReviewsState(null)
      }
      setUser(u)
    }
    const off = b.onAuthChange((u) => {
      authChanged = true
      acceptUser(u)
    })
    b.getUser()
      .then((u) => {
        if (!authChanged) acceptUser(u)
      })
      .catch(() => {
        if (!authChanged) acceptUser(null)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
      off()
    }
  }, [backend])

  const userId = user?.id ?? null

  useEffect(() => {
    if (!backend || !userId) return
    let alive = true
    const prev = (st: SharedProgress | null) => (st && st.userId === userId ? st.marks : {})
    backend
      .loadProgress()
      .then((p) => {
        if (alive && session.current.epoch === authEpoch) setState((st) => ({ userId, loaded: p, marks: prev(st), error: null }))
      })
      .catch(() => {
        if (alive && session.current.epoch === authEpoch)
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
  }, [backend, userId, authEpoch])

  useEffect(() => {
    if (!backend || !userId) return
    let alive = true
    backend.loadReviews().then(loaded => {
      if (alive && session.current.epoch === authEpoch) setReviewsState(st => ({ ...(st?.userId === userId ? st : emptyReviews(userId)), loaded, error: null }))
    }).catch(() => {
      if (alive && session.current.epoch === authEpoch) setReviewsState(st => ({
        ...(st?.userId === userId ? st : emptyReviews(userId)),
        error: 'Không tải được lịch ôn, thử tải lại trang',
      }))
    })
    return () => { alive = false }
  }, [backend, userId, authEpoch])

  const shared = state && state.userId === userId ? state : null
  const reviews = reviewsState?.userId === userId ? reviewsState : null

  const markUnderstood = useCallback(
    async (id: string) => {
      if (!backend) throw new Error('Backend chưa sẵn sàng')
      const epoch = session.current.epoch
      await backend.markUnderstood(id)
      if (!userId || session.current.epoch !== epoch) return
      const now = new Date().toISOString()
      setState((st) => {
        const base: SharedProgress =
          st && st.userId === userId ? st : { userId, loaded: null, marks: {}, error: null }
        return { ...base, marks: { ...base.marks, [id]: 'understood' } }
      })
      setReviewsState(st => {
        const base = st?.userId === userId ? st : emptyReviews(userId)
        return { ...base, understood: { ...base.understood, [id]: now } }
      })
    },
    [backend, userId],
  )

  const markReviewed = useCallback(async (id: string) => {
    if (!backend) throw new Error('Backend chưa sẵn sàng')
    if (!userId || session.current.userId !== userId) throw new Error('Chưa đăng nhập')
    const epoch = session.current.epoch
    await backend.markReviewed(id)
    if (session.current.epoch !== epoch) return
    const now = new Date().toISOString()
    setReviewsState(st => {
      const base = st?.userId === userId ? st : emptyReviews(userId)
      return { ...base, reviewed: { ...base.reviewed, [id]: now } }
    })
  }, [backend, userId])

  const value = useMemo(
    () => ({ backend, user, loading, shared, reviews, markUnderstood, markReviewed }),
    [backend, user, loading, shared, reviews, markUnderstood, markReviewed],
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

export function useReviews(knownIds: string[]): {
  due: ReviewRow[] | null
  error: string | null
  markReviewed(id: string): Promise<void>
} {
  const { reviews, markReviewed } = useContext(BackendContext)
  const [tick, setTick] = useState(0)
  const key = JSON.stringify(knownIds)
  const rows = useMemo(() => {
    if (!reviews?.loaded) return null
    const merged = new Map(reviews.loaded.map(row => [row.conceptId, row]))
    // Thao tác đã lưu trong phiên luôn thắng dữ liệu tải về muộn.
    for (const [conceptId, understoodAt] of Object.entries(reviews.understood)) {
      merged.set(conceptId, { conceptId, understoodAt, lastReviewedAt: merged.get(conceptId)?.lastReviewedAt ?? null })
    }
    for (const [conceptId, lastReviewedAt] of Object.entries(reviews.reviewed)) {
      const row = merged.get(conceptId)
      if (row) merged.set(conceptId, { ...row, lastReviewedAt })
    }
    return [...merged.values()]
  }, [reviews])

  useEffect(() => {
    if (!rows) return
    const refresh = () => setTick(value => value + 1)
    const now = new Date()
    const known = new Set<string>(JSON.parse(key))
    const next = rows.filter(row => known.has(row.conceptId))
      .map(row => reviewState(row.understoodAt, row.lastReviewedAt, now).dueAt?.getTime() ?? Infinity)
      .filter(time => time > now.getTime())
    const delay = Math.min(...next) - now.getTime()
    const timer = Number.isFinite(delay) ? window.setTimeout(refresh, Math.min(delay, 2_147_483_647)) : undefined
    window.addEventListener('focus', refresh)
    return () => { window.clearTimeout(timer); window.removeEventListener('focus', refresh) }
  }, [rows, key, tick])

  return {
    due: rows ? dueReviews(rows, knownIds, new Date()) : null,
    error: reviews?.error ?? null,
    markReviewed,
  }
}
