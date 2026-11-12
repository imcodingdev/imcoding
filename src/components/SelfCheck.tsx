'use client'

import { useState } from 'react'
import { useBackend, useProgress, useUser } from '@/components/BackendProvider'
import type { QuizItem } from '@/lib/concepts/types'
import { nextConcept, type ConceptRef } from '@/lib/progress/next'
import { Markdown } from './Markdown'
import { NextUpCard } from './NextUpCard'

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent'

export function SelfCheck({
  conceptId,
  items,
  concepts,
}: {
  conceptId: string
  items: QuizItem[]
  concepts: ConceptRef[]
}) {
  const { user, loading } = useUser()
  const backend = useBackend()
  const { progress, error: progressError, markUnderstood } = useProgress(concepts.map((c) => c.id))
  const [opened, setOpened] = useState<Set<number>>(() => new Set())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signInError, setSignInError] = useState<string | null>(null)

  const allOpened = opened.size >= items.length
  const understood = saved || progress?.[conceptId] === 'understood'
  const withThis = { ...(progress ?? {}), [conceptId]: 'understood' as const }
  const understoodCount = concepts.filter((c) => withThis[c.id as keyof typeof withThis] === 'understood').length

  const showNext = saved && !progressError && progress !== null

  const onToggle = (i: number, open: boolean) => {
    if (!open) return
    setOpened((prev) => (prev.has(i) ? prev : new Set(prev).add(i)))
  }

  const mark = async () => {
    setSaving(true)
    setError(null)
    try {
      await markUnderstood(conceptId)
      setSaved(true)
    } catch {
      setError('Chưa lưu được, thử lại nhé')
    } finally {
      setSaving(false)
    }
  }

  const signIn = () => {
    setSignInError(null)
    backend.signInWithGitHub(location.pathname + location.search).catch(() => setSignInError('Không đăng nhập được, thử lại sau.'))
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="space-y-2">
            {item.body && (
              <>
                <h3 className="font-semibold text-ink">{item.question}</h3>
                <Markdown source={item.body} />
              </>
            )}
            <details className="rounded-xl border border-line bg-surface-muted px-3" onToggle={(e) => onToggle(i, e.currentTarget.open)}>
              <summary className={`flex min-h-[44px] cursor-pointer items-center rounded-lg font-medium ${FOCUS}`}>
                {item.body ? 'Đáp án' : item.question}
              </summary>
              <div className="pb-3">
                <Markdown source={item.answer} />
              </div>
            </details>
          </div>
        ))}
      </div>
      {!loading && !user && (
        <p className="flex flex-wrap items-center gap-2 text-base">
          <span>Đăng nhập để lưu tiến độ học</span>
          <button
            type="button"
            className={`inline-flex min-h-[44px] items-center rounded-xl border border-line bg-surface px-4 font-medium ${FOCUS}`}
            onClick={signIn}
          >
            Đăng nhập bằng GitHub
          </button>
          {signInError && (
            <span role="alert" className="text-red-700 dark:text-red-300">
              {signInError}
            </span>
          )}
        </p>
      )}
      {user &&
        (understood ? (
          <div className="space-y-3">
            <p className="font-semibold text-status-mastered-text">✓ Đã hiểu</p>
            {showNext && (
              <p className="font-display text-lg font-bold text-ink">
                Tuyệt! Bạn đã hiểu {understoodCount}/{concepts.length} bài.
              </p>
            )}
            {showNext && <NextUpCard concept={nextConcept(concepts, withThis)} total={concepts.length} />}
          </div>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              className={`min-h-[44px] rounded-xl bg-accent px-5 font-semibold text-accent-fg hover:bg-accent-hover focus-visible:ring-offset-2 disabled:opacity-50 ${FOCUS}`}
              disabled={!allOpened || saving}
              onClick={mark}
            >
              Mình đã hiểu bài này
            </button>
            {!allOpened && <p className="text-sm text-ink-muted">Mở hết đáp án để tự kiểm tra trước nhé</p>}
            {error && (
              <p role="alert" className="text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            )}
          </div>
        ))}
    </div>
  )
}
