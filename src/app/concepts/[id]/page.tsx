import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AskAi } from '@/components/AskAi'
import { Markdown } from '@/components/Markdown'
import { LessonV2 } from '@/components/LessonV2'
import { lessonContext, lessonQuiz } from '@/lib/concepts/lesson'
import { SelfCheck } from '@/components/SelfCheck'
import { getConcept, loadConcepts } from '@/lib/concepts/load'
import { GROUP_DOT } from '@/components/statusStyles'
import { GROUPS } from '@/lib/concepts/types'

// Với partialPrefetching, 'navigation' giúp notFound() trả mã HTTP 404 thật (không phải 200).
export const ensureStatic = 'navigation'

export async function generateStaticParams() {
  return loadConcepts().map((c) => ({ id: c.id }))
}

export async function generateMetadata({ params }: PageProps<'/concepts/[id]'>): Promise<Metadata> {
  const { id } = await params
  const concept = getConcept(id)
  return { title: concept ? `${concept.title} – ImCoding` : 'Không tìm thấy khái niệm' }
}

export default async function ConceptPage({ params }: PageProps<'/concepts/[id]'>) {
  const { id } = await params
  const concept = getConcept(id)
  if (!concept) notFound()
  const group = GROUPS.find((g) => g.id === concept.group)
  const all = loadConcepts()
  const quiz = lessonQuiz(concept)
  const sections = concept.format === 1 ? [
    ['Giải thích đời thường', concept.sections.plain],
    ['Trong code trông như thế nào', concept.sections.inCode],
    ['Hay gặp lỗi gì', concept.sections.pitfalls],
  ] as const : []

  const refs = all.map(({ id, title, group, prerequisites, priority }) => ({
    id,
    title,
    group,
    prerequisites,
    priority,
  }))

  return (
    <main className="mx-auto w-full min-w-0 max-w-2xl space-y-8 px-4 py-8 md:px-6 md:py-12">
      <Link
        href="/map"
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-base font-medium text-ink-muted hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        ← Bản đồ
      </Link>
      <header className="space-y-3 border-b border-line pb-6">
        {group && (
          <span
            data-testid="group-pill"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold"
            style={{ background: `var(--group-${concept.group}-bg)`, color: `var(--group-${concept.group}-text)` }}
          >
            <span className={`h-2 w-2 rounded-full ${GROUP_DOT[concept.group]}`} aria-hidden="true" />
            {group.title}
          </span>
        )}
        <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-ink md:text-4xl">
          {concept.title}
        </h1>
        <p className="text-base text-ink-muted">Khoảng 30 phút · {concept.format === 1 ? '3 phần' : `${concept.recall.length > 0 ? 7 : 6} bước`} · {quiz.length} câu hỏi</p>
      </header>
      {concept.prerequisites.length > 0 && (
        <section className="rounded-2xl border border-line bg-surface-muted p-4 md:p-5">
          <h2 className="font-display text-base font-bold text-ink">Cần học trước</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {concept.prerequisites.map((pid) => (
              <li key={pid}>
                <Link
                  href={`/concepts/${pid}`}
                  className="inline-flex min-h-[44px] items-center rounded-xl border border-line bg-surface px-3.5 py-2 text-base font-medium text-ink hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {all.find((c) => c.id === pid)?.title ?? pid}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {concept.format === 2 && <LessonV2 concept={concept} />}
      {sections.map(([title, source], idx) => (
        <section key={title} className="space-y-3">
          <h2 className="font-display text-xl font-bold text-ink md:text-2xl">
            <span className="mr-2 font-mono text-base font-medium text-accent">0{idx + 1}.</span>
            {title}
          </h2>
          <Markdown source={source} />
        </section>
      ))}
      <section className="rounded-2xl border border-line bg-surface p-4 md:p-6">
        <h2 className="mb-3 font-display text-xl font-bold text-ink md:text-2xl">Tự kiểm tra</h2>
        <SelfCheck conceptId={concept.id} items={quiz} concepts={refs} />
      </section>
      <section className="rounded-2xl border border-line bg-surface p-4 md:p-6">
        {/* Chỉ truyền nội dung bài cần cho prompt, không truyền quiz */}
        <AskAi lesson={lessonContext(concept)} />
      </section>
    </main>
  )
}
