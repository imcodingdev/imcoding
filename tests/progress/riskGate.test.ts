import { describe, expect, it } from 'vitest'
import { missingEarlierConcepts } from '@/lib/progress/riskGate'

const concepts = [
  { id: 'secret', stage: 1 as const },
  { id: 'git', stage: 1 as const },
  { id: 'api', stage: 2 as const },
  { id: 'deploy', stage: 3 as const },
  { id: 'monitor', stage: 4 as const },
]

describe('cổng rủi ro', () => {
  it('chặng 1 không cảnh báo', () => {
    expect(missingEarlierConcepts(concepts, 1, {})).toEqual([])
  })
  it('chưa đăng nhập hoặc chưa tải tiến độ không cảnh báo', () => {
    expect(missingEarlierConcepts(concepts, 3, null)).toEqual([])
  })
  it('hiểu hết chặng trước thì không cảnh báo dù bài hiện tại chưa học', () => {
    expect(missingEarlierConcepts(concepts, 2, { secret: 'understood', git: 'understood' })).toEqual([])
  })
  it('liệt kê bài chưa học và đã gặp ở tất cả chặng trước, không lấy chặng hiện tại hoặc sau', () => {
    expect(missingEarlierConcepts(concepts, 3, { secret: 'understood', git: 'seen' }).map(c => c.id)).toEqual(['git', 'api'])
    expect(missingEarlierConcepts(concepts, 4, {}).map(c => c.id)).toEqual(['secret', 'git', 'api', 'deploy'])
  })
})
