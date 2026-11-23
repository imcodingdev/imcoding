export const REVIEW_MINUTES = 5
export const LESSON_MINUTES = 30

export type TodayItem =
  | { kind: 'review'; count: number; minutes: number; href: '/on-tap' }
  | { kind: 'resume'; conceptId: string; title: string; step: number; stepCount: number; minutes: number; href: string }
  | { kind: 'new'; conceptId: string; title: string; minutes: number; href: string }

export function buildToday(input: {
  dueCount: number
  resume: { conceptId: string; title: string; step: number; stepCount: number } | null
  next: { id: string; title: string } | null
  includeNew: boolean
}): { items: TodayItem[]; minutes: number } {
  const { dueCount, resume, next, includeNew } = input
  const items: TodayItem[] = []
  if (dueCount > 0) items.push({ kind: 'review', count: dueCount, minutes: dueCount * REVIEW_MINUTES, href: '/on-tap' })
  if (resume) {
    items.push({
      kind: 'resume', ...resume,
      minutes: Math.max(REVIEW_MINUTES, Math.ceil((resume.stepCount - resume.step + 1) / resume.stepCount * LESSON_MINUTES)),
      href: `/concepts/${resume.conceptId}#buoc-${resume.step}`,
    })
  } else if (includeNew && next) {
    items.push({ kind: 'new', conceptId: next.id, title: next.title, minutes: LESSON_MINUTES, href: `/concepts/${next.id}` })
  }
  return { items, minutes: items.reduce((total, item) => total + item.minutes, 0) }
}
