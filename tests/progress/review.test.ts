import { describe, expect, it } from 'vitest'
import { dueReviews, REVIEW_OFFSETS_DAYS, reviewState } from '@/lib/progress/review'
import type { ReviewRow } from '@/lib/backend/types'

const start = '2026-11-01T08:00:00.000Z'
const day = (offset: number) => new Date(Date.parse(start) + offset * 86_400_000)

describe('lịch ôn theo mốc 24 giờ', () => {
  it('giữ đúng ba mốc', () => expect(REVIEW_OFFSETS_DAYS).toEqual([1, 3, 7]))
  it.each([0, 1 - 1 / 86_400_000, 1, 2])('chưa ôn ở ngày %s', offset => {
    expect(reviewState(start, null, day(offset))).toEqual({ done: 0, dueAt: day(1), isDue: offset >= 1 })
  })
  it.each([[1, 1, 3], [3, 2, 7], [5, 2, 7]])('ôn ngày %s gộp đúng các mốc', (offset, done, next) => {
    expect(reviewState(start, day(offset).toISOString(), day(offset))).toEqual({ done, dueAt: day(next), isDue: false })
    expect(reviewState(start, day(offset).toISOString(), day(next)).isDue).toBe(true)
  })
  it.each([7, 10])('xong cả ba mốc ngày %s', offset => {
    expect(reviewState(start, day(offset).toISOString(), day(20))).toEqual({ done: 3, dueAt: null, isDue: false })
  })
  it('lần ôn trước lúc hiểu không được tính', () => {
    expect(reviewState(start, day(-1).toISOString(), day(2))).toEqual({ done: 0, dueAt: day(1), isDue: true })
  })
  it.each([['sai', null], [start, 'sai'], ['', null]])('ngày hỏng không tạo lịch: %s / %s', (understood, reviewed) => {
    expect(reviewState(understood!, reviewed, day(10))).toEqual({ done: 0, dueAt: null, isDue: false })
  })
  it('không phụ thuộc múi giờ hoặc đổi giờ mùa hè', () => {
    expect(reviewState('2026-03-07T12:00:00-05:00', null, new Date('2026-03-08T16:59:59Z')).isDue).toBe(false)
    expect(reviewState('2026-03-07T12:00:00-05:00', null, new Date('2026-03-08T17:00:00Z')).isDue).toBe(true)
  })
  it('lọc bài biết/đến hạn, sắp thời điểm rồi id, không sửa đầu vào', () => {
    const row = (conceptId: string, offset = 0): ReviewRow => ({ conceptId, understoodAt: day(offset).toISOString(), lastReviewedAt: null })
    const rows = [row('b'), row('unknown', -5), row('future', 10), row('a'), row('old', -1), { ...row('bad'), understoodAt: 'sai' }]
    const snapshot = structuredClone(rows)
    expect(dueReviews(rows, ['a', 'b', 'old', 'future', 'bad'], day(2)).map(r => r.conceptId)).toEqual(['old', 'a', 'b'])
    expect(rows).toEqual(snapshot)
    expect(dueReviews(rows, [], day(2))).toEqual([])
  })
})
