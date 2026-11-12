'use client'

import { useSyncExternalStore } from 'react'
import { metricsEnabled, privacySignalEnabled, setMetricsEnabled } from '@/lib/metrics'

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener('imcoding-metrics-change', callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener('imcoding-metrics-change', callback)
  }
}

export function MetricsSettings() {
  const enabled = useSyncExternalStore(subscribe, metricsEnabled, () => false)
  const privacy = useSyncExternalStore(subscribe, privacySignalEnabled, () => false)
  return <section className="space-y-3 rounded-xl border border-line bg-surface p-4" aria-labelledby="metrics-heading">
    <h2 id="metrics-heading" className="font-display text-xl font-bold">Quyền riêng tư khi học</h2>
    <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
      <input type="checkbox" role="switch" checked={enabled} disabled={privacy}
        onChange={event => setMetricsEnabled(event.target.checked)}
        className="h-5 w-5 shrink-0 accent-accent focus-visible:ring-2 focus-visible:ring-accent" />
      <span>Gửi số liệu học ẩn danh</span>
    </label>
    <p className="text-ink-muted">Giúp biết bài và bước nào hay bị bỏ dở để sửa bài. Lựa chọn lưu trên trình duyệt này.</p>
    {privacy && <p role="status" className="text-ink-muted">Đang tắt theo Do Not Track hoặc Global Privacy Control của trình duyệt.</p>}
  </section>
}
