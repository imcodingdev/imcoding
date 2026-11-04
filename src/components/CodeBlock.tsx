'use client'

import { useEffect, useRef, useState } from 'react'

type CopyState = 'idle' | 'done' | 'failed'

export function CodeBlock({ language, code }: { language: string; code: string }) {
  const [state, setState] = useState<CopyState>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const copy = async () => {
    let next: CopyState = 'done'
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      next = 'failed'
    }
    setState(next)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), 2000)
  }

  return (
    <div className="my-4 min-w-0 overflow-hidden rounded-xl border border-line bg-code text-[#F4F4F5]">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-1">
        <span className="font-mono text-xs uppercase tracking-wider text-zinc-400">{language || 'text'}</span>
        <div className="flex items-center gap-2">
          <span
            role="status"
            aria-live="polite"
            className={`text-sm ${state === 'failed' ? 'text-red-300' : 'text-green-300'}`}
          >
            {state === 'done' ? 'Đã chép' : state === 'failed' ? 'Không sao chép được' : ''}
          </span>
          <button
            type="button"
            onClick={copy}
            className="inline-flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium text-zinc-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Sao chép
          </button>
        </div>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-sm leading-6">
        <code>{code}</code>
      </pre>
    </div>
  )
}
