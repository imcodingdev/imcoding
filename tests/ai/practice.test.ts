import { describe, it, expect } from 'vitest'
import { PRACTICE_STEPS } from '@/lib/ai/practice'
import { loadConcepts } from '@/lib/concepts/load'

describe('PRACTICE_STEPS', () => {
  it('đúng 4 bước theo thứ tự', () => {
    expect(PRACTICE_STEPS.map((s) => s.conceptId)).toEqual([
      'api-endpoint',
      'secrets',
      'environment-variables',
      'http-request-response',
    ])
  })
  it('mọi conceptId tồn tại', () => {
    const ids = new Set(loadConcepts().map((c) => c.id))
    for (const s of PRACTICE_STEPS) expect(ids.has(s.conceptId)).toBe(true)
  })
})
