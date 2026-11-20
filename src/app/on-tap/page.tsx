import type { Metadata } from 'next'
import { ReviewSession, type ReviewLesson } from '@/components/ReviewSession'
import { loadConcepts } from '@/lib/concepts/load'

export const metadata: Metadata = { title: 'Ôn tập – ImCoding' }

export default function ReviewPage() {
  const lessons: ReviewLesson[] = loadConcepts().map(concept => ({
    id: concept.id,
    title: concept.title,
    quiz: concept.format === 2 ? concept.quiz : undefined,
    checks: concept.format === 2 ? [concept.check] : concept.quiz,
  }))
  return <main className="mx-auto w-full min-w-0 max-w-3xl space-y-6 px-4 py-8 md:px-6 md:py-12">
    <h1 className="font-display text-3xl font-extrabold text-ink">Ôn tập</h1>
    <ReviewSession lessons={lessons} />
  </main>
}
