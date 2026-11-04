import { ConceptError } from './types'
import type { Concept } from './types'

export function validateGraph(concepts: Concept[]): void {
  const byId = new Map<string, Concept>()
  for (const c of concepts) {
    if (byId.has(c.id)) {
      throw new ConceptError(`${c.id}.md: id "${c.id}" bị trùng`)
    }
    byId.set(c.id, c)
  }
  for (const c of concepts) {
    for (const p of c.prerequisites) {
      if (!byId.has(p)) {
        throw new ConceptError(`${c.id}.md: học trước "${p}" không tồn tại (khái niệm "${c.id}" trỏ tới "${p}")`)
      }
    }
  }

  // DFS ba màu: 0 = chưa thăm, 1 = đang thăm, 2 = xong
  const color = new Map<string, 0 | 1 | 2>()
  const stack: string[] = []
  const visit = (id: string): void => {
    color.set(id, 1)
    stack.push(id)
    for (const p of byId.get(id)!.prerequisites) {
      const state = color.get(p) ?? 0
      if (state === 1) {
        const cycle = [...stack.slice(stack.indexOf(p)), p]
        throw new ConceptError(`${p}.md: vòng lặp học trước: ${cycle.join(' → ')}`)
      }
      if (state === 0) visit(p)
    }
    stack.pop()
    color.set(id, 2)
  }
  for (const c of concepts) {
    if ((color.get(c.id) ?? 0) === 0) visit(c.id)
  }
}
