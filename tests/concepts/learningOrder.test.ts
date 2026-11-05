import { expect, it } from 'vitest'
import { learningOrder } from '@/lib/concepts/learningOrder'

it('đặt prerequisite trước bài phụ thuộc dù đầu vào đảo thứ tự', () => {
  const concepts = [
    { id: 'last', prerequisites: ['middle'] },
    { id: 'independent', prerequisites: [] },
    { id: 'middle', prerequisites: ['first'] },
    { id: 'first', prerequisites: [] },
  ]
  expect(learningOrder(concepts).map(c => c.id)).toEqual(['first', 'middle', 'last', 'independent'])
  expect(concepts[0].id).toBe('last')
})

it('giữ thứ tự bài độc lập và không lặp prerequisite dùng chung', () => {
  expect(learningOrder([
    { id: 'a', prerequisites: [] },
    { id: 'b', prerequisites: ['a'] },
    { id: 'c', prerequisites: ['a'] },
  ]).map(c => c.id)).toEqual(['a', 'b', 'c'])
})
