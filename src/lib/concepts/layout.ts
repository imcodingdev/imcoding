import { GROUPS, type Concept, type ConceptGroup } from './types'

export interface MapNode {
  id: string
  title: string
  group: ConceptGroup
  x: number
  y: number
}
export interface MapEdge {
  from: string // khái niệm học trước
  to: string // khái niệm phụ thuộc
}

export const COLUMN_WIDTH = 240
export const ROW_HEIGHT = 90

export function buildMapLayout(concepts: Concept[]): { nodes: MapNode[]; edges: MapEdge[] } {
  const byId = new Map(concepts.map((c) => [c.id, c]))
  const depthCache = new Map<string, number>()
  const depthOf = (id: string, seen: Set<string> = new Set()): number => {
    const cached = depthCache.get(id)
    if (cached !== undefined) return cached
    if (seen.has(id)) return 0
    seen.add(id)
    const prereqs = (byId.get(id)?.prerequisites ?? []).filter((p) => byId.has(p))
    const d = prereqs.length === 0 ? 0 : 1 + Math.max(...prereqs.map((p) => depthOf(p, seen)))
    seen.delete(id)
    depthCache.set(id, d)
    return d
  }

  const nodes: MapNode[] = []
  let col = 0
  for (const g of GROUPS) {
    const inGroup = concepts
      .filter((c) => c.group === g.id)
      .sort((a, b) => depthOf(a.id) - depthOf(b.id) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    if (inGroup.length === 0) continue
    inGroup.forEach((c, row) =>
      nodes.push({ id: c.id, title: c.title, group: c.group, x: col * COLUMN_WIDTH, y: row * ROW_HEIGHT }),
    )
    col++
  }

  const edges: MapEdge[] = []
  for (const c of concepts) {
    for (const p of c.prerequisites) {
      if (byId.has(p)) edges.push({ from: p, to: c.id })
    }
  }
  return { nodes, edges }
}
