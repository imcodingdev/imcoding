'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useUser } from './BackendProvider'
import { useGeminiKey } from './useGeminiKey'
import { Markdown } from './Markdown'
import { RequestInspector } from './RequestInspector'
import { AiError, createAiClient, type AiClient, type AiCallTrace, type AiErrorKind } from '@/lib/ai'
import { AI_ERROR_MESSAGES } from '@/lib/ai/errors'
import { looksLikeGoogleKey } from '@/lib/ai/redact'
import { buildPracticalPrompt, linkLessons, type PracticalLesson } from '@/lib/ai/practical-prompt'

export function PracticalAsk({ query, lessons }: { query: string; lessons: PracticalLesson[] }) {
  const { user, loading } = useUser()
  const { key } = useGeminiKey()
  const client = useMemo(() => createAiClient(), [])
  if (loading) return <p>Đang tải…</p>
  if (!user) return <p>Đăng nhập để hỏi AI.</p>
  if (!key) return <Link href="/settings" className="inline-flex min-h-[44px] items-center text-accent underline">Cài key để hỏi AI</Link>
  return <PracticalAnswer key={`${user.id}:${query}:${key}`} query={query} lessons={lessons} apiKey={key} client={client} />
}

export function PracticalAnswer({ query, lessons, apiKey, client }: {
  query: string; lessons: PracticalLesson[]; apiKey: string; client: AiClient
}) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<AiErrorKind | null>(null)
  const [trace, setTrace] = useState<AiCallTrace | null>(null)
  const controller = useRef<AbortController | null>(null)
  useEffect(() => () => { controller.current?.abort(); controller.current = null }, [apiKey])
  const pasted = looksLikeGoogleKey(query)
  const send = async () => {
    if (!query.trim() || pasted || controller.current) return
    const ctrl = new AbortController()
    controller.current = ctrl
    setBusy(true); setDone(false); setError(null); setTrace(null); setText('')
    try {
      const result = await client.ask({ apiKey, systemPrompt: buildPracticalPrompt(lessons),
        lesson: { title: 'Hỏi thực chiến', plain: '', inCode: '', pitfalls: '' },
        history: [{ role: 'user', text: query.trim() }], signal: ctrl.signal,
      }, delta => { if (controller.current === ctrl) setText(prev => prev + delta) })
      if (controller.current === ctrl) setTrace(result)
    } catch (e) {
      if (controller.current === ctrl) {
        setError(e instanceof AiError ? e.kind : 'unknown')
        setTrace(e instanceof AiError ? e.trace : null)
      }
    } finally {
      if (controller.current === ctrl) { controller.current = null; setBusy(false); setDone(true) }
    }
  }
  return <section className="min-w-0 space-y-4" aria-label="Trả lời thực chiến">
    <button type="button" disabled={busy || !query.trim() || pasted} onClick={send}
      className="min-h-[44px] rounded-lg bg-accent px-4 font-semibold text-accent-fg disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">Hỏi AI</button>
    <p className="text-ink-muted">Đừng dán mật khẩu, khoá bí mật hay dữ liệu khách hàng. Câu hỏi được gửi thẳng tới Google bằng key của bạn.</p>
    {pasted && <p role="alert">Hình như bạn vừa dán một khoá bí mật, hãy xoá đi.</p>}
    <div aria-live="polite" className="min-w-0 space-y-3">
      {busy && <p>Đang trả lời…</p>}
      {text && <div data-testid="practical-answer" className="[&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold"><Markdown source={linkLessons(text, lessons)} /></div>}
      {done && !text && !error && <p>AI không trả lời câu này. Bạn thử hỏi cách khác nhé.</p>}
      {error && <p role="alert">{AI_ERROR_MESSAGES[error]}{error === 'invalid' && <> <Link href="/settings" className="text-accent underline">Mở Cài đặt AI</Link></>}</p>}
      {done && trace && <RequestInspector trace={trace} />}
    </div>
  </section>
}
