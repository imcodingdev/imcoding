'use client'

import Link from 'next/link'
import { useProgress, useReviews, useUser } from './BackendProvider'
import { useResumePoint, type ResumeLesson } from './useResumePoint'
import { nextConcept, type ConceptRef } from '@/lib/progress/next'
import { buildToday } from '@/lib/progress/today'

export function TodayCard({ lessons, concepts, includeNew }: {
  lessons: ResumeLesson[]
  concepts: ConceptRef[]
  includeNew: boolean
}) {
  const { user, loading } = useUser()
  const ids = concepts.map(concept => concept.id)
  const { progress } = useProgress(ids)
  const { due, error } = useReviews(ids)
  const { resume, loading: resumeLoading } = useResumePoint(lessons)
  if (loading || resumeLoading || (user && (!progress || (!due && !error)))) return null

  const { items, minutes } = buildToday({
    dueCount: user && !error ? due?.length ?? 0 : 0,
    resume,
    next: includeNew ? nextConcept(concepts, progress) : null,
    includeNew,
  })
  if (!items.length) return null
  return <aside data-testid="today-card" className="w-full min-w-0 rounded-2xl border border-line bg-surface p-5">
    <h2 className="font-display text-lg font-semibold text-ink">Buổi học hôm nay · khoảng {minutes} phút</h2>
    <ul className="mt-3 space-y-2">
      {items.map((item, index) => <li key={item.kind} className="min-w-0">
        <Link href={item.href} className={`inline-flex min-h-[44px] max-w-full items-center rounded-lg px-4 py-2 font-semibold break-words focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${index === 0 ? 'bg-accent text-accent-fg hover:bg-accent-hover' : 'text-accent underline'}`}>
          <span className="min-w-0">{item.kind === 'review' ? `Ôn ${item.count} bài đến hạn`
            : item.kind === 'resume' ? `Học tiếp · ${item.title} · bước ${item.step}/${item.stepCount}`
              : `Bài mới · ${item.title}`}</span>
        </Link>
      </li>)}
    </ul>
  </aside>
}
