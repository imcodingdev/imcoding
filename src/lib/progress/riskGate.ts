import type { Stage } from '@/lib/concepts/stages'
import type { ProgressMap } from './status'

/** null là chưa đăng nhập hoặc chưa tải được tiến độ: không đưa ra cảnh báo thiếu dữ liệu. */
export function missingEarlierConcepts<T extends { id: string; stage: Stage }>(
  concepts: T[],
  stage: Stage,
  progress: ProgressMap | null,
): T[] {
  if (stage === 1 || progress === null) return []
  return concepts.filter(c => c.stage < stage && progress[c.id] !== 'understood')
}
