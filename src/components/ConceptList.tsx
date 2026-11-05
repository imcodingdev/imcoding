import Link from 'next/link'
import { STAGES } from '@/lib/concepts/stages'
import { learningOrder } from '@/lib/concepts/learningOrder'
import type { ConceptRef } from '@/lib/progress/next'
import type { NodeStatus } from '@/lib/progress/status'
import { GROUP_ACCENT, STATUS_CLASS } from './statusStyles'

const STATUS_LABEL: Record<NodeStatus, string> = {
  neutral: 'Chưa học',
  seen: 'Đã gặp trong code',
  understood: 'Đã hiểu',
}

export function ConceptList({
  concepts,
  statuses,
  showProgress,
}: {
  concepts: ConceptRef[]
  statuses: Record<string, NodeStatus>
  showProgress: boolean
}) {
  const titleOf = new Map(concepts.map((c) => [c.id, c.title]))
  const ordered = learningOrder(concepts)
  return (
    <div data-testid="concept-list" className="w-full min-w-0 space-y-8">
      {STAGES.map((stage) => {
        const items = ordered.filter((c) => c.stage === stage.id)
        return (
          <section key={stage.id} className="space-y-3">
            <div className="flex items-center gap-2.5">
              <h2 className="font-display text-lg font-bold text-ink md:text-xl">
                Chặng {stage.id} · {stage.title}
              </h2>
            </div>
            <p className="text-base text-ink-muted">{stage.description}</p>
            {showProgress && (
              <p className="text-sm font-medium text-ink">
                {items.filter(c => statuses[c.id] === 'understood').length}/{items.length} bài đã hiểu
              </p>
            )}
            {items.length === 0 ? (
              <p className="pl-5 text-base text-ink-muted">Sắp có</p>
            ) : (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {items.map((c) => {
                  const status = statuses[c.id] ?? 'neutral'
                  return (
                    <li key={c.id} className="min-w-0">
                      <div className={`flex h-full flex-col gap-2 rounded-xl border p-4 ${STATUS_CLASS[status]} ${GROUP_ACCENT[c.group]}`}>
                        <Link
                          href={`/concepts/${c.id}`}
                          data-status={status}
                          className="flex min-h-[44px] items-center justify-between gap-3 rounded-lg text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          <span className="min-w-0">
                            {status === 'understood' && '✓ '}
                            {c.title}
                            <span className="block text-sm font-normal opacity-80">{STATUS_LABEL[status]}</span>
                          </span>
                          <span aria-hidden="true" className="text-sm opacity-60">
                            →
                          </span>
                        </Link>
                        {c.prerequisites.length > 0 && (
                          <p className="flex flex-wrap items-center gap-1.5 text-sm">
                            <span>Cần học trước:</span>
                            {c.prerequisites.map((p) => (
                              <Link
                                key={p}
                                href={`/concepts/${p}`}
                                className="inline-flex min-h-[44px] items-center rounded-full border border-line bg-surface px-3 text-ink hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                              >
                                {statuses[p] === 'understood' && '✓ '}
                                {titleOf.get(p) ?? p}
                              </Link>
                            ))}
                          </p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
