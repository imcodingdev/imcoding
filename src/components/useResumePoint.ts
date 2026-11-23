'use client'

import { useEffect, useState } from 'react'
import { useBackend, useProgress, useUser } from './BackendProvider'
import type { ResumePoint } from '@/lib/backend/types'
import { readResume } from '@/lib/progress/resumeStore'

export interface ResumeLesson { id: string; title: string; stepCount: number }

export function useResumePoint(lessons: ResumeLesson[]) {
  const backend = useBackend()
  const { user, loading } = useUser()
  const { progress } = useProgress(lessons.map(c => c.id))
  const owner = user?.id ?? null
  const [state, setState] = useState<{
    owner: string | null; point: ResumePoint | null; backend: typeof backend; progress: typeof progress
  } | null>(null)
  useEffect(() => {
    if (loading) return
    let alive = true
    let request = 0
    const load = async () => {
      const current = ++request
      const point = owner ? await backend.loadResume().catch(() => null) : readResume()
      if (alive && current === request) setState({ owner, point, backend, progress })
    }
    void load()
    window.addEventListener('storage', load)
    return () => { alive = false; window.removeEventListener('storage', load) }
  }, [backend, loading, owner, progress])

  const pending = loading || !state || state.owner !== owner || state.backend !== backend || state.progress !== progress
  const point = !pending ? state.point : null
  const lesson = lessons.find(c => c.id === point?.conceptId)
  const resume = point && lesson && point.step >= 1 && point.step <= lesson.stepCount &&
    (!owner || progress) && progress?.[point.conceptId] !== 'understood'
    ? { conceptId: lesson.id, title: lesson.title, step: point.step, stepCount: lesson.stepCount }
    : null
  return { resume, loading: pending }
}
