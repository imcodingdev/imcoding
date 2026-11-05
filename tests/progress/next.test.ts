import { describe, it, expect } from 'vitest'
import { nextConcept, type ConceptRef } from '@/lib/progress/next'

const c = (id: string, prerequisites: string[] = [], priority: 1 | 2 = 1, stage: 1 | 2 | 3 | 4 = 1): ConceptRef => ({
  id,
  title: id,
  group: 'web',
  prerequisites,
  priority,
  stage,
})

const list = [c('a'), c('b', ['a']), c('c', ['a']), c('d', ['b', 'c'])]

describe('nextConcept', () => {
  it('ưu tiên chặng thấp trước priority và không sửa thứ tự đầu vào', () => {
    const items = [c('later', [], 1, 2), c('early', [], 2, 1)]
    expect(nextConcept(items, {})?.id).toBe('early')
    expect(items.map(x => x.id)).toEqual(['later', 'early'])
    expect(nextConcept(items, null)?.id).toBe('later')
  })
  it('chặng thấp chưa đủ prerequisite không được ưu tiên', () => {
    expect(nextConcept([c('blocked', ['missing']), c('ready', [], 2, 2)], {})?.id).toBe('ready')
  })
  it('chưa đăng nhập: bài đầu tiên không có prerequisite', () => {
    expect(nextConcept([c('x', ['y']), c('y'), c('z')], null)?.id).toBe('y')
  })
  it('đã hiểu a: bài kế tiếp chỉ cần a, theo thứ tự', () => {
    expect(nextConcept(list, { a: 'understood' })?.id).toBe('b')
  })
  it('bài đã gặp (seen) vẫn được gợi ý', () => {
    expect(nextConcept(list, { a: 'understood', b: 'seen' })?.id).toBe('b')
  })
  it('ưu tiên priority 1 trước priority 2', () => {
    const l = [c('p2', [], 2), c('p1', [], 1)]
    expect(nextConcept(l, {})?.id).toBe('p1')
  })
  it('hiểu hết thì null', () => {
    const all = Object.fromEntries(list.map((x) => [x.id, 'understood' as const]))
    expect(nextConcept(list, all)).toBeNull()
  })
  it('không bài nào đủ điều kiện mà còn bài chưa hiểu: bài chưa hiểu đầu tiên', () => {
    const l = [c('a', ['zzz']), c('b', ['a'])]
    expect(nextConcept(l, {})?.id).toBe('a')
  })
  it('danh sách rỗng thì null', () => {
    expect(nextConcept([], null)).toBeNull()
  })
})
