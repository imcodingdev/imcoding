import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseConcept } from '../../src/lib/concepts/parse'
import { lessonContext, lessonQuiz } from '../../src/lib/concepts/lesson'
import { buildSystemPrompt } from '../../src/lib/ai/prompt'

const concept = parseConcept('v2-lesson.md', fs.readFileSync('tests/fixtures/concepts-v2/v2-lesson.md', 'utf8'))

describe('bài v2 cho SelfCheck và Hỏi AI', () => {
  it('giữ nguyên nội dung Hỏi AI và quiz của v1', () => {
    const v1 = parseConcept('alpha-web.md', fs.readFileSync('tests/fixtures/concepts-valid/alpha-web.md', 'utf8'))
    if (v1.format !== 1) throw new Error('fixture phải là v1')
    expect(lessonQuiz(v1)).toEqual(v1.quiz)
    expect(lessonContext(v1)).toEqual({ title: v1.title, ...v1.sections })
  })
  it('dùng câu hỏi bước 5 và 6 để tự kiểm tra', () => {
    expect(lessonQuiz(concept).map(q => q.question)).toEqual([
      'Vì sao không đưa khóa vào phản hồi?',
      'Bỏ tiền tố công khai thì sao?',
      'Đồng đội đã commit khóa giả sk-proj-XXXX vào Git. Bạn xử lý rủi ro thế nào và vì sao?',
    ])
  })
  it('prompt có nội dung bài nhưng không chứa câu hỏi hoặc đáp án bước 6', () => {
    if (concept.format !== 2) throw new Error('fixture phải là v2')
    const prompt = buildSystemPrompt(lessonContext(concept))
    expect(prompt).toContain(concept.example)
    expect(prompt).toContain(concept.findInProject)
    expect(prompt).toContain(concept.misconceptions[0].correction)
    expect(prompt).not.toContain(concept.check.question)
    expect(prompt).not.toContain(concept.check.answer)
  })
})
