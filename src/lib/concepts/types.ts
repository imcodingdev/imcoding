import type { Stage } from './stages'

export type ConceptGroup =
  | 'web'
  | 'frontend'
  | 'backend'
  | 'database'
  | 'api'
  | 'auth'
  | 'deploy'
  | 'ai-git'
  | 'systems'

export const GROUPS: readonly { id: ConceptGroup; title: string }[] = [
  { id: 'web', title: 'Web chạy thế nào' },
  { id: 'frontend', title: 'Frontend' },
  { id: 'backend', title: 'Backend' },
  { id: 'database', title: 'Database' },
  { id: 'api', title: 'API' },
  { id: 'auth', title: 'Đăng nhập & bảo mật' },
  { id: 'deploy', title: 'Deploy & vận hành' },
  { id: 'ai-git', title: 'Làm việc với AI & Git' },
  { id: 'systems', title: 'Tư duy hệ thống' },
]

export interface QuizItem {
  question: string
  body?: string
  answer: string
}

interface ConceptBase {
  id: string
  title: string
  group: ConceptGroup
  prerequisites: string[]
  priority: 1 | 2
  signals: string[]
  stage: Stage
}

export interface ConceptV1 extends ConceptBase {
  format: 1
  /** markdown của 3 mục đầu */
  sections: { plain: string; inCode: string; pitfalls: string }
  /** từ mục "Tự kiểm tra" */
  quiz: QuizItem[]
}

export interface MultipleChoiceQuestion {
  question: string
  body: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface LessonExercise {
  goal: string
  steps: string[]
  expectedResult: string
  /** Markdown chứa đúng một fenced code block để dùng lại nút sao chép. */
  reviewPrompt?: string
}

export interface ConceptV2 extends ConceptBase {
  format: 2
  recall: QuizItem[]
  predict: { scenario: string; answer: string }
  example: string
  findInProject: string
  explain: QuizItem[]
  check: QuizItem
  misconceptions: { wrong: string; correction: string }[]
  quiz?: MultipleChoiceQuestion[]
  exercise?: LessonExercise
}

export type Concept = ConceptV1 | ConceptV2

/** message luôn bắt đầu bằng tên file */
export class ConceptError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConceptError'
  }
}
