import type { LessonContext } from '../ai/types'
import type { Concept, QuizItem } from './types'

export function lessonQuiz(concept: Concept): QuizItem[] {
  return concept.format === 1 ? concept.quiz : [...concept.explain, concept.check]
}

/** Chọn rõ nội dung được gửi cho AI; không đưa bước kiểm tra độc lập vào context. */
export function lessonContext(concept: Concept): LessonContext {
  if (concept.format === 1) return { title: concept.title, ...concept.sections }
  return {
    title: concept.title,
    plain: concept.predict.scenario,
    inCode: `${concept.example}\n\n${concept.findInProject}`,
    pitfalls: concept.misconceptions.map(m => `### ${m.wrong}\n\n${m.correction}`).join('\n\n'),
  }
}
