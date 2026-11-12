import { expect, it } from 'vitest'
import { buildPracticalPrompt, linkLessons } from '@/lib/ai/practical-prompt'
import { buildAskRequest } from '@/lib/ai/gemini'

const lessons = [{ id: 'database', title: 'Cơ sở dữ liệu' }]
it('chỉ biến id thuộc danh sách thành link, bỏ id lạ', () => {
  expect(linkLessons('Học [[database]] rồi [[fake]] và [[../../settings]].', lessons))
    .toBe('Học [Cơ sở dữ liệu](/concepts/database) rồi  và .')
})
it('gửi prompt thực chiến riêng mà vẫn giữ prompt bài học mặc định', () => {
  const systemPrompt = buildPracticalPrompt(lessons)
  const req = { apiKey: 'fake', lesson: { title: 'A', plain: '', inCode: '', pitfalls: '' }, history: [] }
  const custom = buildAskRequest({ ...req, systemPrompt })
  expect(custom.body.systemInstruction.parts[0].text).toBe(systemPrompt)
  expect(systemPrompt).toContain('database: Cơ sở dữ liệu')
  expect(buildAskRequest(req).body.systemInstruction.parts[0].text).not.toBe(systemPrompt)
})
