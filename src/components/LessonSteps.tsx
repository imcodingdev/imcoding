'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useBackend, useUser } from './BackendProvider'
import { observeSteps } from '@/lib/progress/observeSteps'
import { readResume, writeResume } from '@/lib/progress/resumeStore'

export function LessonSteps({ conceptId, children }: { conceptId: string; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  const backend = useBackend()
  const { user, loading } = useUser()
  const userId = user?.id
  const [error, setError] = useState(false)

  useEffect(() => {
    // Chạy sau hydrate, kể cả khi nội dung tới sau lần cuộn hash mặc định.
    const target = /^#buoc-\d+$/.test(location.hash) ? root.current?.querySelector(location.hash) : null
    target?.scrollIntoView({ block: 'start' })
  }, [conceptId])

  useEffect(() => {
    if (loading) return
    let alive = true
    let stop = () => {}
    let queue = Promise.resolve()
    const start = async () => {
      const point = userId ? await backend.loadResume().catch(() => null) : readResume()
      if (!alive || !root.current) return
      stop = observeSteps(root.current, point?.conceptId === conceptId ? point.step : 0, step => {
        queue = queue.then(async () => {
          if (!alive) return
          try {
            if (userId) await backend.saveStep(conceptId, step)
            else writeResume({ conceptId, step, at: new Date().toISOString() })
            if (alive) setError(false)
          } catch {
            if (alive) setError(true)
          }
        })
      })
    }
    void start()
    return () => { alive = false; stop() }
  }, [backend, conceptId, loading, userId])

  return <div ref={root} className="space-y-8">
    {error && <p role="status" className="text-ink-muted">Chưa lưu được bước học, thử tải lại trang nhé.</p>}
    {children}
  </div>
}
