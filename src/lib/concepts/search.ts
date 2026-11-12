import { GROUPS, type Concept } from './types'

export type SearchLesson = Pick<Concept, 'id' | 'title' | 'signals' | 'group'>
const normalize = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
const words = (text: string) => normalize(text).match(/[a-z0-9]+/g) ?? []

/** Xếp theo số từ khớp; tên bài có trọng số cao nhất, giữ thứ tự khi đồng điểm. */
export function searchLessons<T extends SearchLesson>(query: string, concepts: T[]): T[] {
  const terms = [...new Set(words(query))]
  if (!terms.length) return []
  return concepts.map((concept, index) => {
    const fields = [
      [concept.title, 4], [concept.signals.join(' '), 3], [concept.id, 2],
      [GROUPS.find(group => group.id === concept.group)?.title ?? '', 1],
    ] as const
    const score = fields.reduce((total, [value, weight]) => {
      const tokens = new Set(words(value))
      return total + terms.filter(term => tokens.has(term)).length * weight
    }, 0)
    return { concept, score, index }
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 6).map(item => item.concept)
}
