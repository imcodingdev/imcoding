import { describe, expect, it } from 'vitest'
import { safeNext } from '@/lib/safeNext'

describe('safeNext', () => {
  it.each([
    ['//evil.com', '/'],
    ['/\\evil.com', '/'],
    ['https://evil.com', '/'],
    ['evil.com', '/'],
    ['', '/'],
    [null, '/'],
    ['/map', '/map'],
    ['/concepts/x?y=1', '/concepts/x?y=1'],
  ])('%j -> %j', (input, expected) => {
    expect(safeNext(input)).toBe(expected)
  })
})
