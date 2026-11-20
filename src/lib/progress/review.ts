import type { ReviewRow } from '@/lib/backend/types'

export const REVIEW_OFFSETS_DAYS = [1, 3, 7] as const
const DAY_MS = 24 * 60 * 60 * 1000

export function reviewState(understoodAt: string, lastReviewedAt: string | null, now: Date): {
  done: number; dueAt: Date | null; isDue: boolean
} {
  const start = Date.parse(understoodAt)
  const reviewed = lastReviewedAt === null ? null : Date.parse(lastReviewedAt)
  if (!Number.isFinite(start) || (reviewed !== null && !Number.isFinite(reviewed))) {
    return { done: 0, dueAt: null, isDue: false }
  }
  const done = REVIEW_OFFSETS_DAYS.filter(offset => reviewed !== null && reviewed >= start + offset * DAY_MS).length
  const dueAt = done === REVIEW_OFFSETS_DAYS.length ? null : new Date(start + REVIEW_OFFSETS_DAYS[done] * DAY_MS)
  return { done, dueAt, isDue: dueAt !== null && now.getTime() >= dueAt.getTime() }
}

export function dueReviews(rows: ReviewRow[], knownIds: string[], now: Date): ReviewRow[] {
  const known = new Set(knownIds)
  return rows
    .filter(row => known.has(row.conceptId))
    .map(row => ({ row, state: reviewState(row.understoodAt, row.lastReviewedAt, now) }))
    .filter(({ state }) => state.isDue)
    .sort((a, b) => a.state.dueAt!.getTime() - b.state.dueAt!.getTime() ||
      (a.row.conceptId < b.row.conceptId ? -1 : a.row.conceptId > b.row.conceptId ? 1 : 0))
    .map(({ row }) => row)
}
