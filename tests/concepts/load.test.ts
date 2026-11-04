import { describe, it, expect } from 'vitest'
import { loadConcepts, getConcept } from '@/lib/concepts/load'

const dir = 'tests/fixtures/concepts-valid'

describe('loadConcepts', () => {
  it('đọc 3 khái niệm theo thứ tự nhóm rồi id, bỏ qua file không phải .md', () => {
    const list = loadConcepts(dir)
    expect(list.map((x) => x.id)).toEqual(['alpha-web', 'beta-web', 'aaa-api'])
  })
  it('getConcept', () => {
    expect(getConcept('beta-web', dir)?.prerequisites).toEqual(['alpha-web'])
    expect(getConcept('khong-co', dir)).toBeUndefined()
  })
})
