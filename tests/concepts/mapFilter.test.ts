import { expect, it } from 'vitest'
import { filterLessons, type SearchLesson } from '@/lib/concepts/search'

const lessons: SearchLesson[] = [
  { id: 'login', title: 'Đăng nhập an toàn', signals: ['session', 'OAuth'], group: 'auth' },
  { id: 'database', title: 'Cơ sở dữ liệu', signals: ['bảng', 'đơn hàng'], group: 'database' },
  { id: 'permissions', title: 'Phân quyền dữ liệu', signals: ['policy'], group: 'auth' },
  { id: 'backup', title: 'Sao lưu', signals: ['snapshot'], group: 'deploy' },
]

it.each(['ĐĂNG NHẬP AN', 'dang nhap an', '  Đăng   nhập an ', 'đa nh a'])('bỏ dấu, hoa thường và khớp tiền tố: %s', query => {
  expect(filterLessons(query, lessons).map(lesson => lesson.id)).toEqual(['login'])
})

it.each([
  ['sess', ['login']],
  ['data', ['database']],
  ['bao mat', ['login', 'permissions']],
  ['don ha', ['database']],
  ['van hanh', ['backup']],
  ['nhap poli', ['permissions']],
  ['du lieu', ['database', 'permissions']],
])('lọc theo tên, signals, id, nhóm và kết hợp trường: %s', (query, ids) => {
  expect(filterLessons(query, lessons).map(lesson => lesson.id)).toEqual(ids)
})

it.each(['dang database', 'khongkhop', 'ession', 'a toanxyz'])('phải khớp mọi từ và không khớp giữa từ: %s', query => {
  expect(filterLessons(query, lessons)).toEqual([])
})

it.each(['', '  ', '---'])('không có từ tìm kiếm thì giữ toàn bộ danh sách: %j', query => {
  expect(filterLessons(query, lessons)).toEqual(lessons)
})

it('không giới hạn sáu bài và không đổi thứ tự hoặc dữ liệu đầu vào', () => {
  const many = Array.from({ length: 10 }, (_, index) => ({ ...lessons[0], id: `login-${index}` }))
  const original = structuredClone(many)
  expect(filterLessons('dang', many)).toEqual(original)
  expect(many).toEqual(original)
})

it('ConceptRef không có signals vẫn tìm theo tên và nhóm được', () => {
  const refs = [{ id: 'a', title: 'Đăng nhập', group: 'auth' as const }]
  expect(filterLessons('bao mat', refs)).toEqual(refs)
})
