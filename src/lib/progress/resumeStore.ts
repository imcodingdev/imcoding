import type { ResumePoint } from '@/lib/backend/types'

const KEY = 'imcoding-resume'

export function readResume(): ResumePoint | null {
  try {
    const point = JSON.parse(window.localStorage.getItem(KEY) ?? 'null')
    if (!point || typeof point.conceptId !== 'string' || !point.conceptId ||
      !Number.isInteger(point.step) || point.step < 1 || point.step > 20 ||
      typeof point.at !== 'string' || !Number.isFinite(Date.parse(point.at))) return null
    return { conceptId: point.conceptId, step: point.step, at: point.at }
  } catch {
    return null
  }
}

export function writeResume({ conceptId, step, at }: ResumePoint): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ conceptId, step, at }))
  } catch {
    // Trình duyệt chặn storage: vẫn cho học bình thường.
  }
}
