'use client'

import Link from 'next/link'
import { useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { useProgress, useUser } from '@/components/BackendProvider'
import { ConceptList } from '@/components/ConceptList'
import { ConceptMap } from '@/components/ConceptMap'
import { NextUpCard } from '@/components/NextUpCard'
import type { MapEdge, MapNode } from '@/lib/concepts/layout'
import { filterLessons } from '@/lib/concepts/search'
import { nextConcept, type ConceptRef } from '@/lib/progress/next'
import { nodeStatus, type NodeStatus } from '@/lib/progress/status'

type Tab = 'list' | 'map'

const TABS: { id: Tab; label: string }[] = [
  { id: 'list', label: 'Lộ trình' },
  { id: 'map', label: 'Sơ đồ' },
]

export function MapView({ nodes, edges, concepts, todayCard }: { nodes: MapNode[]; edges: MapEdge[]; concepts: ConceptRef[]; todayCard?: ReactNode }) {
  const ids = useMemo(() => concepts.map((c) => c.id), [concepts])
  const { user, loading } = useUser()
  const { progress, error } = useProgress(ids)
  const [tab, setTab] = useState<Tab>('list')
  const [query, setQuery] = useState('')
  const searchId = useId()
  const searchInput = useRef<HTMLInputElement>(null)
  const filtered = useMemo(() => filterLessons(query, concepts), [query, concepts])
  const statuses = useMemo(() => {
    const out: Record<string, NodeStatus> = {}
    for (const id of ids) out[id] = nodeStatus(progress, id)
    return out
  }, [ids, progress])
  const next = useMemo(() => nextConcept(concepts, progress), [concepts, progress])
  const counts = useMemo(() => {
    const understood = ids.filter((id) => statuses[id] === 'understood').length
    const seen = ids.filter((id) => statuses[id] === 'seen').length
    return { understood, seen, unseen: ids.length - understood - seen }
  }, [ids, statuses])

  return (
    <div className="space-y-6">
      {!loading && !user && (
        <p className="rounded-xl border border-line bg-surface-muted px-4 py-3 text-base text-ink-muted">
          Đăng nhập để thấy tiến độ của bạn
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-status-seen-border bg-status-seen-bg px-4 py-3 text-base text-status-seen-text"
        >
          {error}
        </p>
      )}
      {progress && (
        <p data-testid="progress-summary" className="text-base font-medium text-ink">
          Đã hiểu {counts.understood} · Đã gặp {counts.seen} · Chưa học {counts.unseen}
        </p>
      )}
      {todayCard}
      {!loading && (!user || progress) && <NextUpCard concept={next} total={concepts.length} />}

      <div
        role="tablist"
        aria-label="Chế độ xem bản đồ"
        className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-surface-muted p-1 md:hidden"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`min-h-[44px] rounded-lg px-3 py-2 text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              tab === t.id ? 'bg-surface text-ink shadow-xs' : 'text-ink-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={tab === 'map' ? 'block' : 'hidden md:block'}>
        <ConceptMap key={tab} nodes={nodes} edges={edges} statuses={statuses} />
      </div>
      <div className={`min-w-0 space-y-4 ${tab === 'list' ? 'block' : 'hidden md:block'}`}>
        <div>
          <label htmlFor={searchId} className="mb-2 block font-semibold text-ink">Tìm bài</label>
          <div className="relative">
            <input ref={searchInput} id={searchId} type="search" value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Ví dụ: database, đăng nhập, bảo mật"
              className="min-h-[44px] w-full min-w-0 rounded-xl border border-line bg-surface py-2 pl-3 pr-14 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-search-cancel-button]:appearance-none"
            />
            {query && <button type="button" aria-label="Xoá tìm kiếm"
              onClick={() => { setQuery(''); searchInput.current?.focus() }}
              className="absolute inset-y-0 right-0 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-xl text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >×</button>}
          </div>
        </div>
        <p aria-live="polite" className="text-sm text-ink-muted">Tìm thấy {filtered.length} bài</p>
        {filtered.length === 0 && <div className="rounded-xl border border-line bg-surface p-4">
          <p className="text-ink">Chưa có bài khớp.</p>
          <Link href={`/hoi?q=${encodeURIComponent(query)}`} className="mt-2 inline-flex min-h-[44px] items-center rounded-lg text-accent underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">Hỏi thực chiến</Link>
        </div>}
        <ConceptList concepts={filtered} allConcepts={concepts} statuses={statuses} showProgress={!!user && progress !== null} />
      </div>
    </div>
  )
}
