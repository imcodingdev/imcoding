import type { AppUser, Backend } from './types'
import type { ProgressMap } from '@/lib/progress/status'

const USER_KEY = 'imcoding-fake-user'
const PROGRESS_KEY = 'imcoding-fake-progress'
const FAIL_KEY = 'imcoding-fake-fail'

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
    async markUnderstood(conceptId) {
      if (failing()) throw new Error('Bản giả: lỗi lưu tiến độ')
      localStorage.setItem(
        PROGRESS_KEY,
        JSON.stringify({ ...readProgress(), [conceptId]: 'understood' }),
      )
    },
  }
}
