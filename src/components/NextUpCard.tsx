'use client'

import Link from 'next/link'
import type { ConceptRef } from '@/lib/progress/next'

export function NextUpCard({
  concept,
  reason,
  total,
}: {
  concept: ConceptRef | null
  reason?: string
  total: number
}) {
  if (!concept) {
    return (
      <div
        data-testid="next-up"
        className="rounded-2xl border border-status-mastered-border bg-status-mastered-bg p-4 text-status-mastered-text md:p-5"
      >
        <p className="font-display text-lg font-bold">Chúc mừng! Bạn đã hiểu cả {total} khái niệm.</p>
        <p className="mt-1 text-base">Bạn có thể ôn lại bất kỳ bài nào bên dưới.</p>
      </div>
    )
  }
  return (
    <div
      data-testid="next-up"
      className="flex flex-col justify-between gap-4 rounded-2xl border border-line bg-accent-soft p-4 sm:flex-row sm:items-center md:p-5"
    >
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-semibold uppercase tracking-wider text-accent">Bài nên học tiếp · ~30 phút</p>
        <p className="font-display text-lg font-bold text-ink">{concept.title}</p>
        {reason && <p className="text-base text-ink-muted">{reason}</p>}
      </div>
      <Link
        href={`/concepts/${concept.id}`}
        className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-base font-semibold text-accent-fg hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
      >
        <span>Học bài này</span>
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  )
}
