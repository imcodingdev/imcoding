import type { Metadata } from 'next'
import { MapView } from '@/components/MapView'
import { buildMapLayout } from '@/lib/concepts/layout'
import { loadConcepts } from '@/lib/concepts/load'
import type { ConceptRef } from '@/lib/progress/next'

export const ensureStatic = 'navigation'

export const metadata: Metadata = { title: 'Bản đồ kiến thức – ImCoding' }

export default function MapPage() {
  const concepts = loadConcepts()
  const { nodes, edges } = buildMapLayout(concepts)
  // chỉ truyền các trường nhẹ xuống client (không kèm sections/quiz)
  const refs: ConceptRef[] = concepts.map((c) => ({
    id: c.id,
    title: c.title,
    group: c.group,
    prerequisites: c.prerequisites,
    priority: c.priority,
  }))
  return (
    <main className="mx-auto w-full min-w-0 max-w-5xl space-y-6 px-4 py-6 md:px-6 md:py-10">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink md:text-3xl">Bản đồ kiến thức</h1>
        <p className="text-base text-ink-muted">Chưa học · Đã gặp trong code · Đã hiểu</p>
      </div>
      <MapView nodes={nodes} edges={edges} concepts={refs} />
    </main>
  )
}
