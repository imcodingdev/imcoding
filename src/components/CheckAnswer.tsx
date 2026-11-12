'use client'

import type { ReactNode } from 'react'
import { track } from '@/lib/metrics'

export function CheckAnswer({ conceptId, children }: { conceptId: string; children: ReactNode }) {
  return <details className="rounded-xl border border-line bg-surface-muted px-3" onToggle={event => {
    if (event.currentTarget.open) track({ event: 'check_opened', concept_id: conceptId })
  }}>
    <summary className="flex min-h-[44px] cursor-pointer items-center rounded-lg font-medium text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">Đáp án</summary>
    <div className="pb-3">{children}</div>
  </details>
}
