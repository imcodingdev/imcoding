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
  answer: string
}

export interface Concept {
  id: string
  title: string
  group: ConceptGroup
  prerequisites: string[]
  priority: 1 | 2
  signals: string[]
  /** markdown của 3 mục đầu */
  sections: { plain: string; inCode: string; pitfalls: string }
  /** từ mục "Tự kiểm tra" */
  quiz: QuizItem[]
}

/** message luôn bắt đầu bằng tên file */
export class ConceptError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConceptError'
  }
}
