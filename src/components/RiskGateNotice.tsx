'use client'

import Link from 'next/link'
import { useProgress, useUser } from './BackendProvider'
import { STAGES, type Stage } from '@/lib/concepts/stages'
import { missingEarlierConcepts } from '@/lib/progress/riskGate'
import type { ConceptRef } from '@/lib/progress/next'

export function RiskGateNotice({ concepts, stage }: { concepts: ConceptRef[]; stage: Stage }) {
  const { user } = useUser()
  const { progress } = useProgress(concepts.map(c => c.id))
  const missing = missingEarlierConcepts(concepts, stage, user ? progress : null)
  if (missing.length === 0) return null
  const previous = STAGES.find(s => s.id === stage - 1)!

  return (
    <aside role="note" aria-label="Khuyến nghị trước khi học" className="space-y-3 rounded-2xl border border-status-seen-border bg-status-seen-bg p-4 text-status-seen-text md:p-5">
      <p>Bạn còn {missing.length} bài ở chặng trước chưa nắm:</p>
      <ul className="flex flex-wrap gap-2">
        {missing.map(concept => (
          <li key={concept.id}>
            <Link href={`/concepts/${concept.id}`} className="inline-flex min-h-[44px] items-center rounded-xl border border-current px-3 py-2 font-medium underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              {concept.title}
            </Link>
          </li>
        ))}
      </ul>
      <p>Nên học các bài này trước khi {previous.action}.</p>
    </aside>
  )
}
