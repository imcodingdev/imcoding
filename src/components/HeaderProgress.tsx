'use client'

import { useProgress, useUser } from '@/components/BackendProvider'

export function HeaderProgress({ total, ids }: { total: number; ids: string[] }) {
  const { user } = useUser()
  const { progress } = useProgress(ids)
  if (!user) return null
  const done = progress ? ids.filter((id) => progress[id] === 'understood').length : 0
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div className="flex flex-col gap-1 whitespace-nowrap text-xs text-ink-muted sm:text-sm" aria-live="polite">
      <span>
        {done}/{total} đã hiểu
      </span>
      <span className="block h-1 w-16 sm:w-24 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <span className="block h-full rounded-full bg-accent motion-safe:transition-[width]" style={{ width: `${pct}%` }} />
      </span>
    </div>
  )
}
