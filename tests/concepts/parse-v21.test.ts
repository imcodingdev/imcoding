import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseConcept, ConceptError } from '@/lib/concepts/parse'
import { addLessonSections, quizSection, exerciseSection } from '../fixtures/lesson-additions'

const raw = fs.readFileSync('tests/fixtures/concepts-v2/v2-lesson.md', 'utf8').replace(/\r\n/g, '\n')
// Giữ bài gốc để kiểm tra tương thích sau khi fixture E2E có hai mục mới.
const base = raw.replace(/## Trắc nghiệm\n[\s\S]*?(?=## Kiểm tra không dùng AI)/, '').replace(/\n## Bài tập thực hành[\s\S]*$/, '')
const parse = (quiz = quizSection, exercise = exerciseSection) => parseConcept('v2-lesson.md', addLessonSections(base, quiz, exercise))

describe('hợp đồng v2.1', () => {
  it('đọc câu hỏi, tình huống có code, phương án, giải thích và bài tập', () => {
    const c = parse()
    expect(c).toHaveProperty('quiz.0.correctIndex', 1)
    expect(c).toHaveProperty('quiz.0.options', ['Chỉ server đọc được', 'Trình duyệt đọc được', 'Framework tự chặn'])
    expect(c).toHaveProperty('quiz.0.body', expect.stringContaining('## Đây là code'))
    expect(c).toHaveProperty('quiz.0.explanation', 'Tiền tố công khai đưa giá trị xuống trình duyệt.')
    expect(c).toHaveProperty('exercise.steps', ['Tạo nhánh thử.', 'Tìm tên biến công khai.', 'Ghi lại vị trí cần sửa.'])
    expect(c).toHaveProperty('exercise.reviewPrompt', expect.stringContaining('Chỉ báo cáo, không tự sửa.'))
  })
  it.each([[false, false], [true, false], [false, true], [true, true]])('hai mục độc lập: %s / %s', (quiz, exercise) => {
    const c = parse(quiz ? quizSection : '', exercise ? exerciseSection : '')
    expect('quiz' in c).toBe(quiz)
    expect('exercise' in c).toBe(exercise)
  })
  it('bài tập không bắt buộc prompt AI', () => {
    expect(parse(quizSection, exerciseSection.split('### Nhờ AI rà lại')[0])).toHaveProperty('exercise.reviewPrompt', undefined)
  })
  it('chấp nhận 5 câu, 4 phương án và 6 bước', () => {
    const extra = quizSection.slice(quizSection.indexOf('### AI gửi'))
    expect(() => parse(quizSection.replace('- [ ] Framework tự chặn', '- [ ] Framework tự chặn\n- [ ] Tự mã hóa') + extra,
      exerciseSection.replace('3. Ghi lại vị trí cần sửa.', '3. Ghi lại vị trí cần sửa.\n4. Đọc lại.\n5. So sánh.\n6. Ghi kết luận.'))).not.toThrow()
  })
  const invalidQuiz = [
    ['ít câu', quizSection.slice(0, quizSection.indexOf('### AI gửi'))],
    ['nhiều câu', quizSection + quizSection.replace('## Trắc nghiệm', '')],
    ['ít phương án', quizSection.replace('- [ ] Framework tự chặn\n', '')],
    ['nhiều phương án', quizSection.replace('- [ ] Framework tự chặn', '- [ ] C\n- [ ] D\n- [ ] E')],
    ['không có đáp án', quizSection.replace('- [x] Trình duyệt', '- [ ] Trình duyệt')],
    ['hai đáp án', quizSection.replace('- [ ] Chỉ server', '- [x] Chỉ server')],
    ['thiếu giải thích', quizSection.replace('**Giải thích:** Tiền tố công khai đưa giá trị xuống trình duyệt.', '')],
    ['giải thích rỗng', quizSection.replace('Tiền tố công khai đưa giá trị xuống trình duyệt.', '')],
    ['đáp án cùng vị trí', quizSection.replace('- [ ] Chỉ server', '- [x] Chỉ server').replace('- [x] Trình duyệt', '- [ ] Trình duyệt').replace('- [ ] Commit mọi khóa', '- [x] Commit mọi khóa').replace('- [x] Dùng cấu hình', '- [ ] Dùng cấu hình')],
    ['câu hỏi rỗng', quizSection.replace('### AI thêm biến công khai. Rủi ro nào?', '### ')],
    ['phương án rỗng', quizSection.replace('- [ ] Chỉ server đọc được', '- [ ] ')],
    ['heading sai cấp', quizSection.replace('### AI thêm', '#### AI thêm')],
    ['nội dung trước câu hỏi', quizSection.replace('## Trắc nghiệm', '## Trắc nghiệm\nNội dung thừa')],
    ['sai dấu chọn', quizSection.replace('- [ ] Chỉ server', '- [X] Chỉ server')],
  ]
  it.each(invalidQuiz)('từ chối trắc nghiệm: %s', (_name, quiz) => {
    expect(() => parse(quiz)).toThrow(ConceptError)
    expect(() => parse(quiz)).toThrow(/^v2-lesson\.md:.*Trắc nghiệm/)
  })
  const invalidExercise = [
    ['thiếu mục tiêu', exerciseSection.replace('Rà soát khóa giả trong nhánh thử, không đụng dữ liệu thật.', '')],
    ['thiếu việc', exerciseSection.replace('### Việc cần làm', '### Việc khác')],
    ['ít bước', exerciseSection.replace('3. Ghi lại vị trí cần sửa.', '')],
    ['nhiều bước', exerciseSection.replace('3. Ghi lại vị trí cần sửa.', '3. Ba\n4. Bốn\n5. Năm\n6. Sáu\n7. Bảy')],
    ['không đánh số', exerciseSection.replace(/\d\. /g, '- ')],
    ['thiếu kết quả', exerciseSection.replace('### Kết quả đúng', '### Kết quả khác')],
    ['kết quả rỗng', exerciseSection.replace('Danh sách chỉ có tên biến và vị trí, không có giá trị khóa.', '')],
    ['sai thứ tự', exerciseSection.replace('### Việc cần làm', '### Kết quả đúng').replace('### Kết quả đúng\n\nDanh', '### Việc cần làm\n\nDanh')],
    ['không code block', exerciseSection.replace(/```text\n|```/g, '')],
    ['hai code block', exerciseSection + '\n```text\nThêm\n```'],
    ['code rỗng', exerciseSection.replace('Rà lại danh sách trên nhánh thử. Chỉ báo cáo, không tự sửa.', '')],
    ['fence chưa đóng', exerciseSection.trim().slice(0, -3)],
  ]
  it.each(invalidExercise)('từ chối bài tập: %s', (_name, exercise) => {
    expect(() => parse(quizSection, exercise)).toThrow(ConceptError)
    expect(() => parse(quizSection, exercise)).toThrow(/^v2-lesson\.md:.*Bài tập thực hành/)
  })
  it('không nhận trắc nghiệm sai thứ tự, trùng mục hoặc bài tập không ở cuối', () => {
    for (const text of [addLessonSections(base, '', '') + quizSection,
      addLessonSections(base, quizSection + quizSection),
      base.replace('## Đoán trước', `${exerciseSection}\n## Đoán trước`)]) {
      expect(() => parseConcept('v2-lesson.md', text)).toThrow(ConceptError)
    }
  })
})
