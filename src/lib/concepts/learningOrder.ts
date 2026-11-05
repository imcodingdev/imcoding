/** Đồ thị đã được loadConcepts kiểm tra; duyệt prerequisite trước bài phụ thuộc. */
export function learningOrder<T extends { id: string; prerequisites: string[] }>(concepts: T[]): T[] {
  const byId = new Map(concepts.map(c => [c.id, c]))
  const visited = new Set<string>()
  const ordered: T[] = []
  const visit = (concept: T) => {
    if (visited.has(concept.id)) return
    visited.add(concept.id)
    for (const id of concept.prerequisites) {
      const prerequisite = byId.get(id)
      if (prerequisite) visit(prerequisite)
    }
    ordered.push(concept)
  }
  concepts.forEach(visit)
  return ordered
}
