'use client'

import Link from 'next/link'
import { useReviews, useUser } from './BackendProvider'

export function ReviewDueCard({ knownIds }: { knownIds: string[] }) {
  const { user, loading } = useUser()
  const { due, error } = useReviews(knownIds)
  if (loading || !user || error || !due?.length) return null
  return <aside data-testid="review-due-card" className="w-full min-w-0 rounded-2xl border border-line bg-surface p-5">
    <p className="font-semibold text-ink">Hôm nay có {due.length} bài cần ôn</p>
    <Link href="/on-tap" className="mt-3 inline-flex min-h-[44px] items-center rounded-lg bg-accent px-4 font-semibold text-accent-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">Ôn tập</Link>
  </aside>
}
