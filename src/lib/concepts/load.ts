import fs from 'node:fs'
import path from 'node:path'
import { GROUPS } from './types'
import type { Concept } from './types'
import { parseConcept } from './parse'
import { validateGraph } from './graph'

const cache = new Map<string, Concept[]>()

export function loadConcepts(dir?: string): Concept[] {
  const resolved = path.resolve(/*turbopackIgnore: true*/ dir ?? path.join(process.cwd(), 'content/concepts'))
  const hit = cache.get(resolved)
  if (hit) return hit

  const files = fs
    .readdirSync(resolved)
    .filter((f) => f.endsWith('.md'))
    .sort()
  const concepts = files.map((f) => parseConcept(f, fs.readFileSync(path.join(resolved, f), 'utf8')))
  validateGraph(concepts)

  const order = (g: string) => GROUPS.findIndex((x) => x.id === g)
  concepts.sort((a, b) => order(a.group) - order(b.group) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))

  cache.set(resolved, concepts)
  return concepts
}

export function getConcept(id: string, dir?: string): Concept | undefined {
  return loadConcepts(dir).find((c) => c.id === id)
}
