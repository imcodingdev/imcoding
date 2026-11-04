import type { ConceptGroup } from '@/lib/concepts/types'
import type { ProgressMap } from './status'

export interface ConceptRef {
  id: string
  title: string
  group: ConceptGroup
  prerequisites: string[]
  priority: 1 | 2
}

/** Gợi ý bài nên học tiếp. `progress === null` nghĩa là chưa đăng nhập. */
export function nextConcept(concepts: ConceptRef[], progress: ProgressMap | null): ConceptRef | null {
  if (progress === null) {
    return concepts.find((c) => c.prerequisites.length === 0) ?? concepts[0] ?? null
  }
  const done = (id: string) => progress[id] === 'understood'
  const remaining = concepts.filter((c) => !done(c.id))
  if (remaining.length === 0) return null
  const ready = remaining.filter((c) => c.prerequisites.every(done))
  if (ready.length > 0) return ready.find((c) => c.priority === 1) ?? ready[0]
  return remaining[0]
}
