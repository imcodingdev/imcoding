import type { LessonSource } from '@/lib/concepts/types'

export function LessonSources({ sources }: { sources?: LessonSource[] }) {
  if (!sources?.length) return null
  return (
    <p className="text-sm text-ink-muted">
      Tham khảo:{' '}
      {sources.map((source, index) => (
        <span key={`${source.url}-${index}`}>
          {index > 0 && ' · '}
          <a href={source.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">
            {source.title}
          </a>
        </span>
      ))}
    </p>
  )
}
