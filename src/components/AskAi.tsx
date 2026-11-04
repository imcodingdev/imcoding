'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useUser } from '@/components/BackendProvider'
import { Markdown } from '@/components/Markdown'
import { RequestInspector } from '@/components/RequestInspector'
import { useGeminiKey } from '@/components/useGeminiKey'
import { AI_ERROR_MESSAGES } from '@/lib/ai/errors'
import { AiError, createAiClient, type AiCallTrace, type AiClient, type AiErrorKind, type ChatTurn, type LessonContext } from '@/lib/ai'
import { looksLikeGoogleKey } from '@/lib/ai/redact'

const ring = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent'
const btn = `inline-flex min-h-[44px] items-center justify-center rounded-lg border border-line bg-surface px-4 text-base font-medium text-ink hover:bg-surface-muted disabled:opacity-50 ${ring}`
const btnPrimary = `inline-flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-lg bg-accent px-4 text-base font-semibold text-accent-fg hover:bg-accent-hover disabled:opacity-50 ${ring}`
const linkCls = `rounded-sm text-accent underline underline-offset-2 hover:text-accent-hover ${ring}`

export const SUGGESTIONS = [
  'Giải thích lại đơn giản hơn',
  'Cho ví dụ đời thường khác',
  'Cái này nằm ở đâu trong code Next.js của tôi?',
] as const

const PASTED_KEY = 'Hình như bạn vừa dán một khoá bí mật, hãy xoá đi.'
const EMPTY_ANSWER = 'AI không trả lời câu này. Bạn thử hỏi cách khác nhé.'
const NOTICE =
  'Đừng dán mật khẩu, khoá bí mật hay dữ liệu khách hàng. Câu hỏi được gửi thẳng tới Google bằng key của bạn.'

interface Message {
  id: number
  role: 'user' | 'model'
  text: string
  done: boolean
  stopped?: boolean
  error?: AiErrorKind
  trace?: AiCallTrace | null
}

/** Ô "Hỏi AI về bài này": nối hook đăng nhập + key rồi giao cho AskAiChat */
export function AskAi({ lesson }: { lesson: LessonContext }) {
  const { user, loading } = useUser()
  const { key } = useGeminiKey()
  const client = useMemo(() => createAiClient(), [])

  let body
  if (loading) body = <p className="text-base text-ink-muted">Đang tải…</p>
  else if (!user) body = <p className="text-base text-ink-muted">Đăng nhập để hỏi AI.</p>
  else if (!key)
    body = (
      <p className="text-base">
        <Link href="/settings" className={linkCls}>
          Cài key để hỏi AI
        </Link>
      </p>
    )
  else body = <AskAiChat key={user.id} client={client} apiKey={key} lesson={lesson} />

  return (
    <>
      <h2 className="mb-3 font-display text-xl font-bold text-ink md:text-2xl">Hỏi AI về bài này</h2>
      {body}
    </>
  )
}

/** Phần chat thuần props (client, key, bài học) để test được không cần BackendProvider */
export function AskAiChat({ client, apiKey, lesson }: { client: AiClient; apiKey: string; lesson: LessonContext }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [pasted, setPasted] = useState(false)
  const controller = useRef<AbortController | null>(null)
  const nextId = useRef(0)

  // Rời trang khi đang trả lời thì huỷ request
  useEffect(() => () => controller.current?.abort(), [])

  const patch = (id: number, f: (m: Message) => Message) =>
    setMessages((ms) => ms.map((m) => (m.id === id ? f(m) : m)))

  const send = async (raw: string) => {
    const text = raw.trim()
    if (!text || busy) return
    if (looksLikeGoogleKey(text)) {
      setPasted(true)
      return
    }
    setPasted(false)
    // Chỉ giữ cặp hỏi–đáp có chữ: câu hỏi bị lỗi/rỗng thì bỏ cả cặp, tránh hai lượt user liền nhau
    const history: ChatTurn[] = [
      ...messages.flatMap((m, i): ChatTurn[] => {
        const q = messages[i - 1]
        return m.role === 'model' && m.text && q?.role === 'user'
          ? [
              { role: 'user', text: q.text },
              { role: 'model', text: m.text },
            ]
          : []
      }),
      { role: 'user', text },
    ]
    const userId = nextId.current++
    const aiId = nextId.current++
    setMessages((ms) => [
      ...ms,
      { id: userId, role: 'user', text, done: true },
      { id: aiId, role: 'model', text: '', done: false },
    ])
    setInput('')
    setBusy(true)
    const ctrl = new AbortController()
    controller.current = ctrl
    try {
      const trace = await client.ask({ apiKey, lesson, history, signal: ctrl.signal }, (delta) =>
        patch(aiId, (m) => ({ ...m, text: m.text + delta })),
      )
      patch(aiId, (m) => ({ ...m, done: true, trace }))
    } catch (e) {
      const trace = e instanceof AiError ? e.trace : null
      if (ctrl.signal.aborted) patch(aiId, (m) => ({ ...m, done: true, stopped: true, trace }))
      else {
        const kind: AiErrorKind = e instanceof AiError ? e.kind : 'unknown'
        patch(aiId, (m) => ({ ...m, done: true, error: kind, trace }))
      }
    } finally {
      if (controller.current === ctrl) controller.current = null
      setBusy(false)
    }
  }

  return (
    <div className="min-w-0 space-y-4">
      <div aria-live="polite" className="min-w-0 space-y-4">
        {messages.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} className="ml-auto max-w-[85%] rounded-2xl bg-surface-muted px-4 py-3">
              <p className="whitespace-pre-wrap break-words text-base text-ink">{m.text}</p>
            </div>
          ) : (
            <div key={m.id} className="min-w-0 space-y-3 rounded-2xl border border-line bg-surface p-4">
              {m.text ? <Markdown source={m.text} /> : !m.done && <p className="text-base text-ink-muted">Đang trả lời…</p>}
              {m.done && !m.text && !m.error && !m.stopped && <p className="text-base text-ink-muted">{EMPTY_ANSWER}</p>}
              {m.stopped && <p className="text-base text-ink-muted">Đã dừng.</p>}
              {m.error && (
                <p className="text-base text-red-700 dark:text-red-300">
                  {AI_ERROR_MESSAGES[m.error]}
                  {m.error === 'invalid' && (
                    <>
                      {' '}
                      <Link href="/settings" className={linkCls}>
                        Mở Cài đặt AI
                      </Link>
                    </>
                  )}
                </p>
              )}
              {m.done && m.trace && <RequestInspector trace={m.trace} />}
            </div>
          ),
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" className={btn} disabled={busy} onClick={() => send(s)}>
            {s}
          </button>
        ))}
      </div>

      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
      >
        <label htmlFor="ask-ai-input" className="block text-base font-medium text-ink">
          Câu hỏi của bạn
        </label>
        <textarea
          id="ask-ai-input"
          rows={3}
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setPasted(false)
          }}
          className={`block w-full min-w-0 rounded-lg border border-line bg-surface px-3 py-2 text-base text-ink ${ring}`}
        />
        {pasted && (
          <p role="alert" className="text-base text-red-700 dark:text-red-300">
            {PASTED_KEY}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="submit" className={btnPrimary} disabled={busy || !input.trim()}>
            Gửi
          </button>
          {busy && (
            <button type="button" className={btn} onClick={() => controller.current?.abort()}>
              Dừng
            </button>
          )}
        </div>
        <p className="text-base text-ink-muted">{NOTICE}</p>
      </form>
    </div>
  )
}
