'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useBackend, useProgress, useUser } from '@/components/BackendProvider'
import { useGeminiKey } from '@/components/useGeminiKey'
import { AI_ERROR_MESSAGES } from '@/lib/ai/errors'
import { createAiClient, type KeyCheck } from '@/lib/ai'
import { PRACTICE_STEPS } from '@/lib/ai/practice'
import { redactKey } from '@/lib/ai/redact'
import { nextConcept, type ConceptRef } from '@/lib/progress/next'

const ring = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent'
const btn = `inline-flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-lg border border-line bg-surface px-4 text-base font-medium text-ink hover:bg-surface-muted disabled:opacity-50 ${ring}`
const btnPrimary = `inline-flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-lg bg-accent px-4 text-base font-semibold text-accent-fg hover:bg-accent-hover disabled:opacity-50 ${ring}`
const linkCls = `rounded-sm text-accent underline underline-offset-2 hover:text-accent-hover ${ring}`

export function AiSettings({
  concepts,
  titles,
}: {
  concepts: ConceptRef[]
  titles: Record<string, string>
}) {
  const { user, loading } = useUser()
  const backend = useBackend()
  const { userId, key, save, clear } = useGeminiKey()
  const { progress } = useProgress(concepts.map((c) => c.id))
  const client = useMemo(() => createAiClient(), [])
  const [value, setValue] = useState('')
  const [show, setShow] = useState(false)
  const [signInError, setSignInError] = useState<string | null>(null)
  const [result, setResult] = useState<{ id: string; kind: KeyCheck } | null>(null)
  const checked = useRef<string | null>(null)
  const seq = useRef(0)

  const run = (k: string, id: string) => {
    checked.current = id
    const mine = ++seq.current
    client
      .checkKey(k)
      .catch((): KeyCheck => 'unknown')
      .then((kind) => {
        if (seq.current === mine) setResult({ id, kind })
      })
  }

  // Tự kiểm tra một lần cho mỗi key đã lưu
  useEffect(() => {
    if (!key || !userId) return
    const id = `${userId}:${key}`
    if (checked.current === id) return
    run(key, id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, userId])

  if (loading) return <p className="text-base text-ink-muted">Đang tải…</p>

  if (!user) {
    return (
      <div className="space-y-4 rounded-2xl border border-line bg-surface-muted p-4 md:p-5">
        <p className="text-base">Đăng nhập bằng GitHub để làm bài thực hành này.</p>
        <button
          type="button"
          className={btn}
          onClick={() => {
            setSignInError(null)
            backend.signInWithGitHub('/settings').catch(() => setSignInError('Không đăng nhập được, thử lại sau.'))
          }}
        >
          Đăng nhập bằng GitHub
        </button>
        {signInError && (
          <p role="alert" className="text-base text-red-700 dark:text-red-300">
            {signInError}
          </p>
        )}
      </div>
    )
  }

  const id = key && userId ? `${userId}:${key}` : null
  const kind = id && result?.id === id ? result.kind : null
  let status = 'Chưa có key'
  if (key) status = kind === null ? 'Đang kiểm tra…' : kind === 'ok' ? 'Key dùng được' : AI_ERROR_MESSAGES[kind]
  const next = nextConcept(concepts, progress)?.id ?? 'client-server'

  const onSave = () => {
    const k = value.trim()
    if (!k || !userId) return
    save(k)
    setValue('')
    setResult(null)
    run(k, `${userId}:${k}`)
  }
  const onClear = () => {
    seq.current++
    checked.current = null
    clear()
    setResult(null)
    setValue('')
  }

  return (
    <div className="space-y-8">
      <ol className="space-y-4">
        {PRACTICE_STEPS.map((s, i) => (
          <li key={s.conceptId} className="rounded-2xl border border-line bg-surface p-4 md:p-5">
            <h2 className="font-display text-lg font-bold text-ink">
              <span className="mr-2 font-mono text-base font-medium text-accent">{i + 1}.</span>
              {s.title}
            </h2>
            <p className="mt-2 text-base">
              {s.how}
              {i === 0 && (
                <>
                  {' '}
                  <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className={linkCls}>
                    Mở Google AI Studio
                  </a>
                </>
              )}
            </p>
            <p className="mt-2 text-base text-ink-muted">
              <strong className="font-semibold text-ink">Vì sao?</strong> {s.why}{' '}
              <Link href={`/concepts/${s.conceptId}`} className={linkCls}>
                {titles[s.conceptId] ?? s.conceptId}
              </Link>
            </p>
          </li>
        ))}
      </ol>

      <p className="rounded-2xl border border-line bg-surface-muted p-4 text-base text-ink-muted md:p-5">
        Nếu bạn có gói Google AI Pro/Ultra, hãy xem thêm Google Developer Program: gói này có thể kèm hạn mức dùng
        API. Dù dùng gói nào, bạn nên đặt cảnh báo ngân sách (budget alert) trong Google Cloud để không bị tính tiền
        ngoài ý muốn.
      </p>

      <section className="space-y-3">
        {key && <p className="text-base">Đã có key: {redactKey(key)}</p>}
        <label htmlFor="gemini-key" className="block text-base font-medium text-ink">
          Gemini API key
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="gemini-key"
            type={show ? 'text' : 'password'}
            autoComplete="off"
            spellCheck={false}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={`min-h-[44px] min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 text-base text-ink ${ring}`}
          />
          <button type="button" className={btn} onClick={() => setShow((v) => !v)}>
            {show ? 'Ẩn' : 'Hiện'}
          </button>
        </div>
        <p className="text-base text-ink-muted">
          Key chỉ lưu trên trình duyệt này. ImCoding không nhận và không lưu key của bạn.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btnPrimary} onClick={onSave} disabled={!value.trim()}>
            Lưu và kiểm tra
          </button>
          <button type="button" className={btn} onClick={onClear} disabled={!key}>
            Xoá key
          </button>
        </div>
        <p role="status" className="text-base text-ink">
          {status}
        </p>
      </section>

      {kind === 'ok' && (
        <div className="space-y-3 rounded-2xl border border-status-mastered-border bg-status-mastered-bg p-4 text-status-mastered-text md:p-5">
          <p className="font-display text-lg font-bold">Hoàn thành bài thực hành 🎉</p>
          <Link href={`/concepts/${next}`} className={`${btnPrimary} no-underline`}>
            Hỏi AI ngay
          </Link>
        </div>
      )}
    </div>
  )
}
