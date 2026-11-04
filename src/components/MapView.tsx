'use client'

import { useMemo, useState } from 'react'
import { useProgress, useUser } from '@/components/BackendProvider'
import { ConceptList } from '@/components/ConceptList'
import { ConceptMap } from '@/components/ConceptMap'
import { NextUpCard } from '@/components/NextUpCard'
import type { MapEdge, MapNode } from '@/lib/concepts/layout'
import { nextConcept, type ConceptRef } from '@/lib/progress/next'
import { nodeStatus, type NodeStatus } from '@/lib/progress/status'

type Tab = 'list' | 'map'

const TABS: { id: Tab; label: string }[] = [
  { id: 'list', label: 'Lộ trình' },
  { id: 'map', label: 'Sơ đồ' },
]

export function MapView({ nodes, edges, concepts }: { nodes: MapNode[]; edges: MapEdge[]; concepts: ConceptRef[] }) {
  const ids = useMemo(() => concepts.map((c) => c.id), [concepts])
  const { user, loading } = useUser()
  const { progress, error } = useProgress(ids)
  const [tab, setTab] = useState<Tab>('list')
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
      <div className={tab === 'list' ? 'block' : 'hidden md:block'}>
        <ConceptList concepts={concepts} statuses={statuses} />
      </div>
    </div>
  )
}
