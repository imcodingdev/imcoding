'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { CodeBlock } from '@/components/CodeBlock'
import { explainStatus } from '@/lib/ai/errors'
import type { AiCallTrace } from '@/lib/ai/types'

const ring = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent'
const linkCls = `rounded-sm text-accent underline underline-offset-2 hover:text-accent-hover ${ring}`

function Block({ label, conceptId, children }: { label: string; conceptId?: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-base font-medium text-ink">
        {conceptId ? (
          <Link href={`/concepts/${conceptId}`} className={linkCls}>
            {label}
          </Link>
        ) : (
          label
        )}
      </p>
      {children}
    </div>
  )
}

function usageOf(chunk: unknown): unknown {
  if (chunk && typeof chunk === 'object' && 'usageMetadata' in chunk) {
    return (chunk as { usageMetadata?: unknown }).usageMetadata ?? null
  }
  return null
}

/** "Xem bên trong": lần gọi API vừa rồi. Trace đã được che key ở tầng AI. */
export function RequestInspector({ trace }: { trace: AiCallTrace }) {
  const headers = Object.entries(trace.headers)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')
  const usage = usageOf(trace.lastChunk)

  return (
    <details className="min-w-0 rounded-xl border border-line bg-surface-muted px-3">
      <summary className={`flex min-h-[44px] cursor-pointer items-center rounded-lg text-base font-medium text-ink ${ring}`}>
        Xem bên trong
      </summary>
      <div className="min-w-0 space-y-4 pb-3">
        <p className="font-display text-base font-bold text-ink">Request (gửi đi)</p>
        <Block label="API endpoint: địa chỉ để gọi dịch vụ" conceptId="api-endpoint">
          <CodeBlock language="http" code={`${trace.method} ${trace.url}`} />
        </Block>
        <Block label="Key nằm ở header, không nằm trong URL" conceptId="secrets">
          <CodeBlock language="http" code={headers} />
        </Block>
        <Block label="JSON: dữ liệu gửi đi" conceptId="json">
          <CodeBlock language="json" code={JSON.stringify(trace.body, null, 2)} />
        </Block>

        <p className="font-display text-base font-bold text-ink">Response (nhận về)</p>
        <Block label="Mã trạng thái HTTP" conceptId="http-request-response">
          <p className="mt-1 text-base text-ink">
            <span className="mr-2 font-mono font-semibold">{trace.status ?? 'không có'}</span>
            <span className="text-ink-muted">{explainStatus(trace.status)}</span>
          </p>
        </Block>
        <p className="text-base text-ink">
          Thời gian phản hồi: <span className="font-mono">{trace.durationMs} ms</span>
        </p>
        <p className="text-base text-ink">
          Số đoạn đã nhận: <span className="font-mono">{trace.chunkCount}</span>
        </p>
        {trace.lastChunk !== null && (
          <Block label="Đoạn cuối nhận được (JSON)">
            <CodeBlock language="json" code={JSON.stringify(trace.lastChunk, null, 2)} />
          </Block>
        )}
        {usage !== null && (
          <Block label="Số token đã dùng: đây là thứ tính tiền">
            <CodeBlock language="json" code={JSON.stringify(usage, null, 2)} />
          </Block>
        )}
      </div>
    </details>
  )
}
