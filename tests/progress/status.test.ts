import { describe, it, expect } from 'vitest'
import { nodeStatus, filterKnown } from '@/lib/progress/status'

describe('status', () => {
  it('nodeStatus', () => {
    expect(nodeStatus(null, 'x')).toBe('neutral')
    expect(nodeStatus({ x: 'understood' }, 'x')).toBe('understood')
    expect(nodeStatus({ y: 'seen' }, 'x')).toBe('neutral')
  })
  it('filterKnown bỏ id lạ', () => {
    expect(filterKnown({ a: 'seen', gone: 'understood' }, ['a'])).toEqual({ a: 'seen' })
  })
})
