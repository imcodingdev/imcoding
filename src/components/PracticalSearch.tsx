'use client'

import { useState } from 'react'
import { looksLikeGoogleKey } from '@/lib/ai/redact'

export function PracticalSearch({ query = '' }: { query?: string }) {
  const [pasted, setPasted] = useState(false)
  return <form action="/hoi" method="get" className="w-full min-w-0 space-y-3" onSubmit={event => {
    const value = String(new FormData(event.currentTarget).get('q') ?? '')
    if (looksLikeGoogleKey(value)) { event.preventDefault(); setPasted(true) }
  }}>
    <label htmlFor="practical-query" className="block font-semibold text-ink">Bạn đang muốn làm gì?</label>
    <div className="flex flex-wrap gap-2">
      <input id="practical-query" name="q" type="search" defaultValue={query} maxLength={4000} autoComplete="off"
        placeholder="Ví dụ: làm tool quản lý đơn hàng thì database cần những gì"
        onChange={() => setPasted(false)}
        className="min-h-[44px] min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
      <button className="min-h-[44px] rounded-lg bg-accent px-4 font-semibold text-accent-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" type="submit">Tìm bài</button>
    </div>
    {pasted && <p role="alert" className="text-red-700 dark:text-red-300">Hình như bạn vừa dán một khoá bí mật, hãy xoá đi.</p>}
  </form>
}
