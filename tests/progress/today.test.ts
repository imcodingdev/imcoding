import { expect, it } from 'vitest'
import { buildToday } from '@/lib/progress/today'

const empty = { dueCount: 0, resume: null, next: null, includeNew: true }
const resume = { conceptId: 'a', title: 'Bài A', step: 4, stepCount: 9 }
const next = { id: 'b', title: 'Bài B' }

it('không có việc thì trả buổi học rỗng', () => {
  expect(buildToday(empty)).toEqual({ items: [], minutes: 0 })
})

it('chỉ ôn: mỗi bài năm phút', () => {
  expect(buildToday({ ...empty, dueCount: 3 })).toEqual({
    items: [{ kind: 'review', count: 3, minutes: 15, href: '/on-tap' }], minutes: 15,
  })
})

it('học tiếp: tính phần còn lại và giữ bước trong link', () => {
  expect(buildToday({ ...empty, resume })).toEqual({
    items: [{ kind: 'resume', ...resume, minutes: 20, href: '/concepts/a#buoc-4' }], minutes: 20,
  })
})

it('ôn trước học tiếp, cộng phút và không thêm bài mới khi có điểm dừng', () => {
  expect(buildToday({ ...empty, dueCount: 2, resume, next })).toEqual({
    items: [
      { kind: 'review', count: 2, minutes: 10, href: '/on-tap' },
      { kind: 'resume', ...resume, minutes: 20, href: '/concepts/a#buoc-4' },
    ], minutes: 30,
  })
})

it('làm tròn lên thời gian còn lại', () => {
  expect(buildToday({ ...empty, resume: { ...resume, step: 2 } }).minutes).toBe(27)
})

it('bước cuối vẫn dành ít nhất năm phút', () => {
  expect(buildToday({ ...empty, resume: { ...resume, step: 9 } }).minutes).toBe(5)
})

it('bài mới dành ba mươi phút, đứng sau ôn', () => {
  expect(buildToday({ ...empty, dueCount: 1, next })).toEqual({
    items: [
      { kind: 'review', count: 1, minutes: 5, href: '/on-tap' },
      { kind: 'new', conceptId: 'b', title: 'Bài B', minutes: 30, href: '/concepts/b' },
    ], minutes: 35,
  })
})

it('chỉ bài mới khi được phép và không có điểm dừng', () => {
  expect(buildToday({ ...empty, next })).toEqual({
    items: [{ kind: 'new', conceptId: 'b', title: 'Bài B', minutes: 30, href: '/concepts/b' }], minutes: 30,
  })
  expect(buildToday({ ...empty, next, includeNew: false })).toEqual({ items: [], minutes: 0 })
})

it('tắt bài mới vẫn giữ ôn và học tiếp', () => {
  expect(buildToday({ ...empty, dueCount: 1, resume, next, includeNew: false }).items.map(item => item.kind))
    .toEqual(['review', 'resume'])
})
