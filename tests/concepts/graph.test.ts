import { describe, it, expect } from 'vitest'
import { validateGraph } from '@/lib/concepts/graph'
import { ConceptError } from '@/lib/concepts/parse'
import type { Concept } from '@/lib/concepts/types'

function c(id: string, prerequisites: string[] = []): Concept {
  return {
    id,
    title: id,
    group: 'web',
    prerequisites,
    priority: 1,
    signals: ['x'],
    sections: { plain: 'a', inCode: 'b', pitfalls: 'c' },
    quiz: [
      { question: 'q1', answer: 'a1' },
      { question: 'q2', answer: 'a2' },
    ],
  }
}

describe('validateGraph', () => {
  it('chấp nhận đồ thị hợp lệ', () => {
    expect(() => validateGraph([c('a'), c('b', ['a']), c('c', ['a', 'b'])])).not.toThrow()
  })
  it('id trùng', () => {
    expect(() => validateGraph([c('a'), c('a')])).toThrow(ConceptError)
    expect(() => validateGraph([c('a'), c('a')])).toThrow(/a/)
  })
  it('prerequisite không tồn tại', () => {
    const f = () => validateGraph([c('a', ['ghost'])])
    expect(f).toThrow(ConceptError)
    expect(f).toThrow(/a/)
    expect(f).toThrow(/ghost/)
  })
  it('tự trỏ vào mình', () => {
    expect(() => validateGraph([c('a', ['a'])])).toThrow(/a/)
  })
  it('vòng a → b → c → a', () => {
    const f = () => validateGraph([c('a', ['b']), c('b', ['c']), c('c', ['a'])])
    expect(f).toThrow(ConceptError)
    expect(f).toThrow(/a → b → c → a/)
  })
})
