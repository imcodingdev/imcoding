import { Suspense } from 'react'
import Link from 'next/link'
import { loadConcepts } from '@/lib/concepts/load'
import { searchLessons } from '@/lib/concepts/search'
import { looksLikeGoogleKey } from '@/lib/ai/redact'
import { PracticalSearch } from '@/components/PracticalSearch'
import { PracticalAsk } from '@/components/PracticalAsk'

export const metadata = { title: 'Hỏi thực chiến – ImCoding' }

async function Results({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const raw = (Array.isArray(params.q) ? params.q[0] : params.q) ?? ''
  const blocked = looksLikeGoogleKey(raw)
  const query = blocked ? '' : raw.trim().slice(0, 4000)
  const concepts = loadConcepts()
  const matches = searchLessons(query, concepts)
  return <>
    <PracticalSearch key={query} query={query} />
    {blocked && <p role="alert">Hình như bạn vừa dán một khoá bí mật, hãy xoá đi.</p>}
    <section className="space-y-3" aria-labelledby="related-lessons">
      <h2 id="related-lessons" className="font-display text-xl font-bold">Bài liên quan</h2>
      {matches.length ? <ul className="space-y-2">{matches.map(c => <li key={c.id}>
        <Link href={`/concepts/${c.id}`} className="inline-flex min-h-[44px] items-center text-accent underline">{c.title}</Link>
      </li>)}</ul> : <p className="text-ink-muted">{query ? 'Chưa tìm thấy bài phù hợp. Thử từ khóa khác nhé.' : 'Nhập việc bạn muốn làm để tìm bài liên quan.'}</p>}
    </section>
    <PracticalAsk query={query} lessons={concepts.map(c => ({ id: c.id, title: c.title }))} />
  </>
}

export default function PracticalPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <main className="mx-auto w-full min-w-0 max-w-3xl space-y-6 px-4 py-8 md:px-6">
    <h1 className="font-display text-3xl font-bold">Hỏi thực chiến</h1>
    <Suspense fallback={<p>Đang tải…</p>}><Results searchParams={props.searchParams} /></Suspense>
  </main>
}
