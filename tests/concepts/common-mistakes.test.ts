import { describe, expect, it } from 'vitest'
import { COMMON_MISTAKES } from '@/lib/concepts/common-mistakes'
import { loadConcepts } from '@/lib/concepts/load'

describe('lỗi founder hay gặp', () => {
  it('đủ tám lỗi, không trùng bài và mọi bài đích đều tồn tại', () => {
    const concepts = loadConcepts('content/concepts')
    expect(COMMON_MISTAKES).toHaveLength(8)
    expect(new Set(COMMON_MISTAKES.map(item => item.lessonId)).size).toBe(8)
    for (const item of COMMON_MISTAKES) {
      expect(item.mistake.trim()).not.toBe('')
      expect(item.lessonId.trim()).not.toBe('')
      expect(concepts.find(concept => concept.id === item.lessonId)?.title.trim(), item.lessonId).toBeTruthy()
    }
  })
})
