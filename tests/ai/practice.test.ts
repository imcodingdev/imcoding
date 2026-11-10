import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import { PRACTICE_STEPS } from '@/lib/ai/practice'
import { parseConcept } from '@/lib/concepts/parse'
import { lessonContext, lessonQuiz } from '@/lib/concepts/lesson'

describe('PRACTICE_STEPS', () => {
  it('đúng 4 bước theo thứ tự', () => {
    expect(PRACTICE_STEPS.map((s) => s.conceptId)).toEqual([
      'api-endpoint',
      'secrets',
      'environment-variables',
      'http-request-response',
    ])
  })
  it.each(PRACTICE_STEPS)('$conceptId tồn tại và cung cấp nội dung theo format', ({ conceptId }) => {
    const name = `${conceptId}.md`
    const concept = parseConcept(name, fs.readFileSync(`content/concepts/${name}`, 'utf8'))
    expect(concept.id).toBe(conceptId)
    if (concept.format === 1) {
      expect(lessonContext(concept)).toEqual({ title: concept.title, ...concept.sections })
      expect(lessonQuiz(concept)).toEqual(concept.quiz)
    } else {
      const ctx = lessonContext(concept)
      const all = Object.values(ctx).join('\n')
      expect(ctx.title).toBe(concept.title)
      expect(ctx.plain).toBe(concept.predict.scenario)
      expect(ctx.inCode).toContain(concept.example)
      expect(ctx.inCode).toContain(concept.findInProject)
      if (concept.exercise) expect(ctx.inCode).toContain(concept.exercise.expectedResult)
      // Bước kiểm tra độc lập và trắc nghiệm không được lọt vào prompt Hỏi AI
      expect(all).not.toContain(concept.check.answer)
      for (const q of concept.quiz ?? []) expect(all).not.toContain(q.explanation)
      expect(lessonQuiz(concept)).toEqual([...concept.explain, concept.check])
    }
  })
})
