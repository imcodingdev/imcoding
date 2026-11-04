// Key Gemini lưu ở localStorage theo từng người dùng; không bao giờ log hay gửi đi
const PREFIX = 'imcoding-gemini-key:'
const CHANGE_EVENT = 'imcoding-gemini-key-change'

export function getKey(userId: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(PREFIX + userId) || null
  } catch {
    return null
  }
}

function notify(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

export function clearKey(userId: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(PREFIX + userId)
  } catch {
    // bị chặn: coi như đã xoá
  }
  notify()
}

export function setKey(userId: string, key: string): void {
  const k = key.trim()
  if (!k) return clearKey(userId)
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PREFIX + userId, k)
  } catch {
    // bị chặn: bỏ qua
  }
  notify()
}

export function subscribeKeys(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('storage', cb)
  window.addEventListener(CHANGE_EVENT, cb)
  return () => {
    window.removeEventListener('storage', cb)
    window.removeEventListener(CHANGE_EVENT, cb)
  }
}
