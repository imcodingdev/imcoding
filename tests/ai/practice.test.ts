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
      expect(lessonContext(concept)).toEqual({
        title: concept.title,
        plain: concept.predict.scenario,
        inCode: `${concept.example}\n\n${concept.findInProject}`,
        pitfalls: concept.misconceptions.map(m => `### ${m.wrong}\n\n${m.correction}`).join('\n\n'),
      })
      expect(lessonQuiz(concept)).toEqual([...concept.explain, concept.check])
    }
  })
})
