import type { LessonContext } from '../ai/types'
import type { Concept, ConceptV2, QuizItem } from './types'

export function lessonStepCount(concept: ConceptV2): number {
  return 6 + Number(concept.recall.length > 0) + Number(!!concept.quiz) + Number(!!concept.exercise)
}

export function lessonQuiz(concept: Concept): QuizItem[] {
  return concept.format === 1 ? concept.quiz : [...concept.explain, concept.check]
}

/** Chọn rõ nội dung được gửi cho AI; không đưa bước kiểm tra độc lập vào context. */
export function lessonContext(concept: Concept): LessonContext {
  if (concept.format === 1) return { title: concept.title, ...concept.sections }
  const exercise = concept.exercise
  const practice = exercise ? [
    '## Bài tập thực hành', exercise.goal,
    '### Việc cần làm', exercise.steps.map((step, i) => `${i + 1}. ${step}`).join('\n'),
    '### Kết quả đúng', exercise.expectedResult,
    ...(exercise.reviewPrompt ? ['### Nhờ AI rà lại', exercise.reviewPrompt] : []),
  ].join('\n\n') : ''
  return {
    title: concept.title,
    plain: concept.predict.scenario,
    inCode: [concept.example, concept.findInProject, practice].filter(Boolean).join('\n\n'),
    pitfalls: concept.misconceptions.map(m => `### ${m.wrong}\n\n${m.correction}`).join('\n\n'),
  }
}
