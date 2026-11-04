import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto w-full min-w-0 max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-bold tracking-tight">Không tìm thấy khái niệm</h1>
      <p className="mt-2 text-ink-muted">Có thể đường dẫn bị sai. Bạn quay lại bản đồ để chọn khái niệm khác nhé.</p>
      <Link
        href="/map"
        className="mt-6 inline-flex min-h-[44px] items-center rounded-lg border border-line bg-surface px-4 font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        ← Bản đồ
      </Link>
    </main>
  )
}
