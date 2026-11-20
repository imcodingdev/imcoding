'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { ReviewRow } from '@/lib/backend/types'
import type { MultipleChoiceQuestion, QuizItem } from '@/lib/concepts/types'
import { reviewState } from '@/lib/progress/review'
import { useReviews, useUser } from './BackendProvider'
import { AuthButton } from './AuthButton'
import { LessonQuiz } from './LessonQuiz'
import { Markdown } from './Markdown'

export interface ReviewLesson {
  id: string
  title: string
  quiz?: MultipleChoiceQuestion[]
  checks: QuizItem[]
}

const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent'

function ReviewItem({ lesson, row, markReviewed }: {
  lesson: ReviewLesson
  row: ReviewRow
  markReviewed(id: string): Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { done } = reviewState(row.understoodAt, row.lastReviewedAt, new Date())
  const mark = async () => {
    setSaving(true)
    setError(null)
    try {
      await markReviewed(lesson.id)
    } catch {
      setError('Chưa lưu được, thử lại nhé')
    } finally {
      setSaving(false)
    }
  }
  return <article className="min-w-0 space-y-5 rounded-2xl border border-line bg-surface p-4 [overflow-wrap:anywhere] sm:p-5">
    <div>
      <h2 className="font-display text-xl font-bold text-ink">
        <Link href={`/concepts/${lesson.id}`} className={`inline-flex min-h-[44px] items-center text-accent underline ${focus}`}>{lesson.title}</Link>
      </h2>
      <p className="text-sm text-ink-muted">Lần ôn {done + 1}/3</p>
    </div>
    {!!lesson.quiz?.length && <LessonQuiz conceptId={lesson.id} items={lesson.quiz} trackMetrics={false} />}
    {lesson.checks.length > 0 && <section className="space-y-3" aria-label="Kiểm tra không dùng AI">
      <h3 className="font-display text-lg font-bold text-ink">Kiểm tra không dùng AI</h3>
      {lesson.checks.map((item, index) => <div key={index} className="space-y-2">
        <h4 className="font-semibold text-ink">{item.question}</h4>
        {item.body && <Markdown source={item.body} />}
        <details className="rounded-xl border border-line bg-surface-muted px-3">
          <summary className={`flex min-h-[44px] cursor-pointer items-center rounded-lg font-medium text-ink ${focus}`}>Đáp án</summary>
          <div className="pb-3"><Markdown source={item.answer} /></div>
        </details>
      </div>)}
    </section>}
    <button type="button" disabled={saving} onClick={mark}
      className={`min-h-[44px] rounded-xl bg-accent px-5 py-2 font-semibold text-accent-fg hover:bg-accent-hover disabled:opacity-50 ${focus}`}>
      {saving ? 'Đang lưu…' : 'Đã ôn xong'}
    </button>
    {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
  </article>
}

export function ReviewSession({ lessons }: { lessons: ReviewLesson[] }) {
  const { user, loading } = useUser()
  const { due, error, markReviewed } = useReviews(lessons.map(lesson => lesson.id))
  if (loading) return <p role="status" className="text-ink-muted">Đang tải lịch ôn…</p>
  if (!user) return <div className="space-y-3 text-ink">
    <p>Đăng nhập để xem lịch ôn tập và lưu những bài bạn đã ôn.</p>
    <AuthButton />
  </div>
  if (error) return <p role="alert" className="text-ink-muted">{error}</p>
  if (due === null) return <p role="status" className="text-ink-muted">Đang tải lịch ôn…</p>
  if (!due.length) return <div className="space-y-3">
    <p role="status" className="text-ink">Chưa có bài cần ôn hôm nay</p>
    <Link href="/map" className={`inline-flex min-h-[44px] items-center text-accent underline ${focus}`}>Xem bản đồ kiến thức</Link>
  </div>
  return <div className="space-y-6">
    {due.map(row => {
      const lesson = lessons.find(lesson => lesson.id === row.conceptId)
      return lesson ? <ReviewItem key={`${user.id}:${lesson.id}:${row.understoodAt}`} lesson={lesson} row={row} markReviewed={markReviewed} /> : null
    })}
  </div>
}
