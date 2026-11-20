import type { AppUser, Backend, ReviewRow } from './types'
import { validateStep, type ResumePoint } from './types'
import type { ProgressMap } from '@/lib/progress/status'

const USER_KEY = 'imcoding-fake-user'
const PROGRESS_KEY = 'imcoding-fake-progress'
const FAIL_KEY = 'imcoding-fake-fail'
const STEPS_KEY = 'imcoding-fake-steps'
// E2E có thể đặt JSON mảng ReviewRow: [{ conceptId, understoodAt: ISO, lastReviewedAt: ISO | null }].
// Đồng thời đặt imcoding-fake-progress[conceptId] = 'understood' và imcoding-fake-user.
const REVIEWS_KEY = 'imcoding-fake-reviews'

const FAKE_USER: AppUser = {
  id: 'fake-user',
  email: 'hocvien@example.com',
  name: 'Học viên',
  avatarUrl: null,
}

export function createFakeBackend(): Backend {
  const listeners = new Set<(u: AppUser | null) => void>()
  const readUser = (): AppUser | null => {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AppUser) : null
  }
  const emit = () => {
    const u = readUser()
    listeners.forEach((cb) => cb(u))
  }
  const failing = () => localStorage.getItem(FAIL_KEY) === '1'
  const readProgress = (): ProgressMap => {
    const raw = localStorage.getItem(PROGRESS_KEY)
    return raw ? (JSON.parse(raw) as ProgressMap) : {}
  }
  const readSteps = (): Record<string, ResumePoint> => JSON.parse(localStorage.getItem(STEPS_KEY) ?? '{}')
  const readReviews = (): ReviewRow[] => JSON.parse(localStorage.getItem(REVIEWS_KEY) ?? '[]')

  return {
    async getUser() {
      return readUser()
    },
    onAuthChange(cb) {
      listeners.add(cb)
      return () => {
        listeners.delete(cb)
      }
    },
    async signInWithGitHub(next) {
      if (failing()) throw new Error('Bản giả: lỗi đăng nhập')
      localStorage.setItem(USER_KEY, JSON.stringify(FAKE_USER))
      emit()
      location.assign(next)
    },
    async signOut() {
      if (failing()) throw new Error('Bản giả: lỗi đăng xuất')
      localStorage.removeItem(USER_KEY)
      emit()
    },
    async loadProgress() {
      if (failing()) throw new Error('Bản giả: lỗi tải tiến độ')
      return readProgress()
    },
    async loadResume() {
      if (failing()) throw new Error('Bản giả: lỗi tải bước')
      const progress = readProgress()
      return Object.values(readSteps())
        .filter(point => progress[point.conceptId] !== 'understood')
        .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))[0] ?? null
    },
    async saveStep(conceptId, step) {
      validateStep(step)
      if (failing()) throw new Error('Bản giả: lỗi lưu bước')
      const progress = readProgress()
      if (!progress[conceptId]) {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify({ ...progress, [conceptId]: 'seen' }))
      }
      localStorage.setItem(STEPS_KEY, JSON.stringify({
        ...readSteps(), [conceptId]: { conceptId, step, at: new Date().toISOString() },
      }))
    },
    async markUnderstood(conceptId) {
      if (failing()) throw new Error('Bản giả: lỗi lưu tiến độ')
      localStorage.setItem(
        PROGRESS_KEY,
        JSON.stringify({ ...readProgress(), [conceptId]: 'understood' }),
      )
      const rows = readReviews()
      localStorage.setItem(REVIEWS_KEY, JSON.stringify([
        ...rows.filter(row => row.conceptId !== conceptId),
        { conceptId, understoodAt: new Date().toISOString(), lastReviewedAt: rows.find(row => row.conceptId === conceptId)?.lastReviewedAt ?? null },
      ]))
    },
    async loadReviews() {
      if (!readUser()) throw new Error('Chưa đăng nhập')
      if (failing()) throw new Error('Bản giả: lỗi tải lịch ôn')
      const progress = readProgress()
      return readReviews().filter(row => progress[row.conceptId] === 'understood' && !!row.understoodAt)
    },
    async markReviewed(conceptId) {
      if (!readUser()) throw new Error('Chưa đăng nhập')
      if (failing()) throw new Error('Bản giả: lỗi lưu ôn tập')
      const rows = readReviews()
      const row = rows.find(row => row.conceptId === conceptId && row.understoodAt)
      if (!row || readProgress()[conceptId] !== 'understood') throw new Error('Chưa có tiến độ đã hiểu để ôn bài này')
      const now = new Date().toISOString()
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(rows.map(item => item === row ? { ...item, lastReviewedAt: now } : item)))
    },
  }
}
