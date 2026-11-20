import Link from 'next/link'

export function CommonMistakes({ items }: {
  items: readonly { mistake: string; lessonId: string; title: string }[]
}) {
  return (
    <section className="mt-14 md:mt-20" aria-labelledby="common-mistakes-heading">
      <h2 id="common-mistakes-heading" className="font-display text-2xl font-bold text-ink">
        Lỗi founder hay gặp
      </h2>
      <p className="mt-4 text-base leading-relaxed text-ink-muted">
        Gặp tình huống quen thuộc? Chọn một lỗi để học cách kiểm tra và xử lý.
      </p>
      <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map(item => (
          <li key={item.lessonId} className="min-w-0">
            <Link
              href={`/concepts/${item.lessonId}`}
              className="flex min-h-[44px] h-full flex-col gap-3 break-words rounded-2xl border border-line bg-surface p-5 hover:bg-surface-muted motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              <span className="font-display text-lg font-bold text-ink">{item.mistake}</span>
              <span className="text-sm font-medium text-accent">Bài học: {item.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
