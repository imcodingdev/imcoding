'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useBackend, useProgress, useUser } from './BackendProvider'
import type { ResumePoint } from '@/lib/backend/types'
import { readResume } from '@/lib/progress/resumeStore'

export interface ResumeLesson { id: string; title: string; stepCount: number }

export function ResumeCard({ lessons }: { lessons: ResumeLesson[] }) {
  const backend = useBackend()
  const { user, loading } = useUser()
  const { progress } = useProgress(lessons.map(c => c.id))
  const owner = user?.id ?? null
  const [state, setState] = useState<{ owner: string | null; point: ResumePoint | null } | null>(null)
  useEffect(() => {
    if (loading) return
    let alive = true
    const load = async () => {
      const point = owner ? await backend.loadResume().catch(() => null) : readResume()
      if (alive) setState({ owner, point })
    }
    void load()
    window.addEventListener('storage', load)
    return () => { alive = false; window.removeEventListener('storage', load) }
  }, [backend, loading, owner, progress])
  const point = !loading && state?.owner === owner ? state.point : null
  const lesson = lessons.find(c => c.id === point?.conceptId)
  if (!point || !lesson || point.step > lesson.stepCount || point.step < 1 ||
    (owner && !progress) || progress?.[point.conceptId] === 'understood') return null
  return <aside data-testid="resume-card" className="w-full rounded-2xl border border-line bg-surface p-5">
    <p className="font-semibold text-ink">Học tiếp · {lesson.title} · bước {point.step}/{lesson.stepCount}</p>
    <Link href={`/concepts/${lesson.id}#buoc-${point.step}`} className="mt-3 inline-flex min-h-[44px] items-center rounded-lg bg-accent px-4 font-semibold text-accent-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">Học tiếp</Link>
  </aside>
}
