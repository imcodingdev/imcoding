import { createClient } from '@supabase/supabase-js'

const EVENTS = ['lesson_open', 'step_reached', 'quiz_done', 'check_opened', 'understood', 'practical_search', 'practical_ai'] as const
export type LearningEvent = {
  event: typeof EVENTS[number]
  concept_id?: string
  step?: number
  score?: number
  total?: number
}
export type LearningPayload = LearningEvent & { visitor: string }

declare global {
  interface Window { __imcodingLearningEvents?: LearningPayload[] }
}

const VISITOR_KEY = 'imcoding-visitor'
const OFF_KEY = 'imcoding-metrics-off'
const WINDOW_KEY = 'imcoding-metrics-window'
const HOUR = 3_600_000

export function privacySignalEnabled(): boolean {
  if (typeof navigator === 'undefined') return true
  return navigator.doNotTrack === '1' || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true
}

export function metricsEnabled(): boolean {
  if (typeof window === 'undefined' || privacySignalEnabled()) return false
  try { return localStorage.getItem(OFF_KEY) !== '1' } catch { return false }
}

export function setMetricsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(OFF_KEY, enabled ? '0' : '1')
    window.dispatchEvent(new Event('imcoding-metrics-change'))
  } catch { /* Không có storage thì mặc định không gửi. */ }
}

function cleanEvent(input: LearningEvent): LearningEvent | null {
  if (!EVENTS.includes(input.event)) return null
  if (input.concept_id !== undefined && (typeof input.concept_id !== 'string' || !/^[a-z0-9-]{1,64}$/.test(input.concept_id))) return null
  for (const [value, min] of [[input.step, 1], [input.score, 0], [input.total, 0]] as const) {
    if (value !== undefined && (!Number.isInteger(value) || value < min || value > 20)) return null
  }
  if ((input.score === undefined) !== (input.total === undefined)) return null
  if (input.score !== undefined && input.total !== undefined && input.score > input.total) return null
  // Tạo payload mới theo danh sách cho phép, không spread dữ liệu của caller.
  return {
    event: input.event,
    ...(input.concept_id !== undefined ? { concept_id: input.concept_id } : {}),
    ...(input.step !== undefined ? { step: input.step } : {}),
    ...(input.score !== undefined ? { score: input.score, total: input.total } : {}),
  }
}

function reserveVisitor(): string | null {
  let visitor = localStorage.getItem(VISITOR_KEY)
  if (!visitor || !/^[A-Za-z0-9_-]{16,64}$/.test(visitor)) {
    visitor = Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('')
    localStorage.setItem(VISITOR_KEY, visitor)
  }
  const now = Date.now()
  const raw = localStorage.getItem(WINDOW_KEY)
  const stored = raw ? JSON.parse(raw) as { visitor: string; times: number[] } : null
  // Đồng hồ bị lùi: giữ cả mốc tương lai để không vượt hạn mức.
  const times = stored?.visitor === visitor ? stored.times.filter(time => Number.isFinite(time) && time > now - HOUR) : []
  if (times.length >= 60) return null
  localStorage.setItem(WINDOW_KEY, JSON.stringify({ visitor, times: [...times, now] }))
  return visitor
}

async function send(event: LearningEvent): Promise<void> {
  if (!metricsEnabled()) return
  const fake = process.env.NEXT_PUBLIC_FAKE_BACKEND === '1'
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!fake && (!url || !key)) return
  const visitor = reserveVisitor()
  if (!visitor) return
  const payload: LearningPayload = { ...event, visitor }
  if (fake) {
    (window.__imcodingLearningEvents ??= []).push(payload)
    return
  }
  // Client riêng không đọc/lưu phiên Auth, không gửi token tài khoản cùng visitor.
  const client = createClient(url!, key!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  await client.from('learning_events').insert(payload)
}

/** Không chờ trong giao diện; mọi lỗi bị bỏ qua, không ghi nội dung vào log. */
export function track(input: LearningEvent): void {
  try {
    if (!metricsEnabled()) return
    const event = cleanEvent(input)
    if (!event) return
    // Web Locks tuần tự hóa hạn mức giữa các tab cùng origin khi trình duyệt hỗ trợ.
    const pending = navigator.locks
      ? navigator.locks.request('imcoding-metrics', () => send(event))
      : send(event)
    void pending.catch(() => {})
  } catch { /* Số liệu không được làm gián đoạn việc học. */ }
}
