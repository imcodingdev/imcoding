// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest'
import { createFakeBackend } from '@/lib/backend/fake'
import { readResume, writeResume } from '@/lib/progress/resumeStore'

beforeEach(() => { localStorage.clear(); vi.useRealTimers() })

it('tạo seen, lưu bước mới nhất và không hạ understood', async () => {
  const backend = createFakeBackend()
  await backend.saveStep('a', 4)
  expect(await backend.loadProgress()).toEqual({ a: 'seen' })
  expect(await backend.loadResume()).toMatchObject({ conceptId: 'a', step: 4 })
  await backend.markUnderstood('a')
  await backend.saveStep('a', 5)
  expect(await backend.loadProgress()).toEqual({ a: 'understood' })
  expect(await backend.loadResume()).toBeNull()
})

it('chọn dòng chưa hiểu có thời gian mới nhất, giữ qua backend mới', async () => {
  vi.useFakeTimers()
  const backend = createFakeBackend()
  vi.setSystemTime(new Date('2026-11-10T01:00:00Z'))
  await backend.saveStep('a', 3)
  vi.setSystemTime(new Date('2026-11-10T02:00:00Z'))
  await backend.saveStep('b', 4)
  expect(await createFakeBackend().loadResume()).toMatchObject({ conceptId: 'b', step: 4 })
  await backend.markUnderstood('b')
  expect(await backend.loadResume()).toMatchObject({ conceptId: 'a', step: 3 })
})

it('từ chối bước sai trước khi ghi', async () => {
  const backend = createFakeBackend()
  for (const step of [0, 21, 1.5, NaN]) await expect(backend.saveStep('a', step)).rejects.toThrow()
  expect(await backend.loadProgress()).toEqual({})
})

it('khách chỉ lưu ResumePoint và chịu được dữ liệu hỏng/storage bị chặn', () => {
  const point = { conceptId: 'a', step: 4, at: '2026-11-10T00:00:00Z' }
  writeResume(point)
  expect(readResume()).toEqual(point)
  expect(Object.keys(localStorage)).toEqual(['imcoding-resume'])
  localStorage.setItem('imcoding-resume', '{')
  expect(readResume()).toBeNull()
  localStorage.setItem('imcoding-resume', JSON.stringify({ ...point, step: 30 }))
  expect(readResume()).toBeNull()
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
  expect(() => writeResume(point)).not.toThrow()
  vi.restoreAllMocks()
})
