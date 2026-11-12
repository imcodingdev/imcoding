import { expect, it } from 'vitest'
import { searchLessons, type SearchLesson } from '@/lib/concepts/search'

const lessons: SearchLesson[] = [
  { id: 'database', title: 'Cơ sở dữ liệu', signals: ['bảng', 'đơn hàng'], group: 'database' },
  { id: 'rls', title: 'Phân quyền dữ liệu', signals: ['policy'], group: 'auth' },
  { id: 'backup', title: 'Sao lưu', signals: ['backup'], group: 'deploy' },
]
it.each(['cơ sở dữ liệu', 'CO SO DU LIEU', 'đơn hàng', 'don hang', 'database'])('tìm %s có/không dấu', query => {
  expect(searchLessons(query, lessons)[0].id).toBe('database')
})
it('tìm theo tên nhóm, không trả bài không liên quan, tối đa sáu bài', () => {
  expect(searchLessons('bao mat', lessons).map(c => c.id)).toEqual(['rls'])
  expect(searchLessons('xyz', lessons)).toEqual([])
  expect(searchLessons('  ', lessons)).toEqual([])
  const many = Array.from({ length: 10 }, (_, i) => ({ ...lessons[0], id: `db-${i}` }))
  expect(searchLessons('dữ liệu', many)).toHaveLength(6)
})
