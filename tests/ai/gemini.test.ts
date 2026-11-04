import { describe, expect, it, vi } from 'vitest'
import { AiError } from '@/lib/ai/errors'
import { buildSystemPrompt, summarizeSystemPrompt } from '@/lib/ai/prompt'
import { redactKey } from '@/lib/ai/redact'
import { CHECK_TIMEOUT_MS, createGeminiClient, GEMINI_MODEL } from '@/lib/ai/gemini'
import type { ChatTurn, LessonContext } from '@/lib/ai/types'

const KEY = 'AIzaSyA1234567890abcdefghijklmnopqrstuv'
const lesson: LessonContext = { title: 'Bài A', plain: 'p', inCode: 'c', pitfalls: 'x' }
const enc = new TextEncoder()

function sseResponse(chunks: string[], status = 200) {
  return new Response(
    new ReadableStream({
      start(c) {
        for (const s of chunks) c.enqueue(enc.encode(s))
        c.close()
      },
    }),
    { status },
  )
}
const ev = (o: unknown) => `data: ${JSON.stringify(o)}\r\n\r\n`
const okChunks = () => [
  ev({ candidates: [{ content: { parts: [{ text: 'Xin ' }] } }] }),
  ev({ candidates: [{ content: { parts: [{ text: 'chào' }] } }], usageMetadata: { totalTokenCount: 42 } }),
]
const hist: ChatTurn[] = [{ role: 'user', text: 'hi' }]
const client = (f: unknown) => createGeminiClient(f as typeof fetch)

describe('gemini ask', () => {
  it('stream thành công và ghi trace', async () => {
    const f = vi.fn(async () => sseResponse(okChunks()))
    const got: string[] = []
    const trace = await client(f).ask({ apiKey: KEY, lesson, history: hist }, (d) => got.push(d))
    expect(got).toEqual(['Xin ', 'chào'])
    expect(trace.status).toBe(200)
    expect(trace.chunkCount).toBe(2)
    expect(
      (trace.lastChunk as { usageMetadata: { totalTokenCount: number } }).usageMetadata.totalTokenCount,
    ).toBe(42)
    expect(trace.method).toBe('POST')
    expect(trace.url.endsWith(`/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse`)).toBe(true)
    expect(trace.url).not.toContain(KEY)
  })

  it('gửi request đúng định dạng, giữ 20 phần tử cuối', async () => {
    const f = vi.fn(async () => sseResponse(okChunks()))
    const history: ChatTurn[] = Array.from({ length: 25 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'model',
      text: `t${i}`,
    }))
    await client(f).ask({ apiKey: KEY, lesson, history }, () => {})
    const [, init] = f.mock.calls[0] as unknown as [string, RequestInit]
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe(KEY)
    const body = JSON.parse(init.body as string)
    expect(body.systemInstruction.parts[0].text).toBe(buildSystemPrompt(lesson))
    expect(body.contents).toHaveLength(20)
    expect(body.contents[0]).toEqual({ role: 'model', parts: [{ text: 't5' }] })
    expect(body.contents[19]).toEqual({ role: 'user', parts: [{ text: 't24' }] })
  })

  it('trace đã làm sạch', async () => {
    const f = vi.fn(async () => sseResponse(okChunks()))
    const trace = await client(f).ask({ apiKey: KEY, lesson, history: hist }, () => {})
    expect(trace.headers['x-goog-api-key']).toBe(redactKey(KEY))
    const b = trace.body as { systemInstruction: { parts: { text: string }[] } }
    expect(b.systemInstruction.parts[0].text).toBe(summarizeSystemPrompt(buildSystemPrompt(lesson)))
    expect(JSON.stringify(trace)).not.toContain(KEY)
  })

  it('429 → quota', async () => {
    const f = vi.fn(async () => sseResponse([], 429))
    const err = await client(f)
      .ask({ apiKey: KEY, lesson, history: hist }, () => {})
      .catch((e) => e)
    expect(err).toBeInstanceOf(AiError)
    expect(err.kind).toBe('quota')
    expect(err.trace.status).toBe(429)
    expect(JSON.stringify(err.trace)).not.toContain(KEY)
  })

  const askErr = (f: unknown) =>
    client(f)
      .ask({ apiKey: KEY, lesson, history: hist }, () => {})
      .catch((e) => e)
  const jsonRes = (o: unknown, status: number) => new Response(JSON.stringify(o), { status })

  it('400 không phải lỗi key → unknown, trace có lời báo của Google', async () => {
    const body = {
      error: {
        code: 400,
        message: 'Please ensure that multiturn requests alternate between user and model.',
        status: 'INVALID_ARGUMENT',
      },
    }
    const err = await askErr(async () => jsonRes(body, 400))
    expect(err).toBeInstanceOf(AiError)
    expect(err.kind).toBe('unknown')
    expect(err.trace.status).toBe(400)
    expect(err.trace.lastChunk).toEqual(body)
  })

  it('400 kèm API_KEY_INVALID → invalid, trace không chứa key', async () => {
    const body = {
      error: {
        code: 400,
        message: `API key not valid: ${KEY}`,
        status: 'INVALID_ARGUMENT',
        details: [{ '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason: 'API_KEY_INVALID' }],
      },
    }
    const err = await askErr(async () => jsonRes(body, 400))
    expect(err.kind).toBe('invalid')
    expect(JSON.stringify(err.trace)).not.toContain(KEY)
    expect(JSON.stringify(err.trace.lastChunk)).toContain(redactKey(KEY))
  })

  it('401/403 → invalid; 500 → unknown; thân lỗi không phải JSON không làm hỏng', async () => {
    expect((await askErr(async () => sseResponse([], 403))).kind).toBe('invalid')
    expect((await askErr(async () => sseResponse([], 401))).kind).toBe('invalid')
    const err = await askErr(async () => new Response('<html>lỗi</html>', { status: 500 }))
    expect(err.kind).toBe('unknown')
    expect(err.trace.lastChunk).toBeNull()
    expect((await askErr(async () => sseResponse([], 400))).kind).toBe('unknown')
  })

  it('fetch reject → network, status null', async () => {
    const f = vi.fn(async () => {
      throw new TypeError('fail')
    })
    const err = await client(f)
      .ask({ apiKey: KEY, lesson, history: hist }, () => {})
      .catch((e) => e)
    expect(err.kind).toBe('network')
    expect(err.trace.status).toBeNull()
  })

  it('abort giữa chừng → network, giữ text đã nhận', async () => {
    const ac = new AbortController()
    const f = vi.fn(async (_u: string, init: RequestInit) => {
      const stream = new ReadableStream({
        start(c) {
          c.enqueue(enc.encode(okChunks()[0]))
          init.signal!.addEventListener('abort', () => c.error(new DOMException('aborted', 'AbortError')))
        },
      })
      return new Response(stream, { status: 200 })
    })
    const got: string[] = []
    const err = await client(f)
      .ask({ apiKey: KEY, lesson, history: hist, signal: ac.signal }, (d) => {
        got.push(d)
        ac.abort()
      })
      .catch((e) => e)
    expect(err).toBeInstanceOf(AiError)
    expect(err.kind).toBe('network')
    expect(err.trace.status).toBe(200)
    expect(got).toEqual(['Xin '])
  })
})

describe('gemini checkKey', () => {
  const run = (f: unknown) => client(f).checkKey(KEY)
  it('map trạng thái', async () => {
    const f = vi.fn(async () => new Response('', { status: 200 }))
    expect(await run(f)).toBe('ok')
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/models')
    expect(init.method).toBe('GET')
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe(KEY)
    expect(await run(async () => new Response('', { status: 400 }))).toBe('invalid')
    expect(await run(async () => new Response('', { status: 429 }))).toBe('quota')
    expect(
      await run(async () => {
        throw new TypeError('x')
      }),
    ).toBe('network')
  })

  it('400 kèm API_KEY_INVALID vẫn là invalid', async () => {
    const body = { error: { code: 400, details: [{ reason: 'API_KEY_INVALID' }] } }
    expect(await run(async () => new Response(JSON.stringify(body), { status: 400 }))).toBe('invalid')
  })

  it('quá 10 giây không phản hồi → network', async () => {
    vi.useFakeTimers()
    try {
      let signal: AbortSignal | undefined
      const f = vi.fn(
        (_u: string, init: RequestInit) =>
          new Promise<Response>((_, reject) => {
            signal = init.signal ?? undefined
            init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
          }),
      )
      const p = run(f)
      await vi.advanceTimersByTimeAsync(CHECK_TIMEOUT_MS - 1)
      expect(signal?.aborted).toBe(false)
      await vi.advanceTimersByTimeAsync(1)
      expect(await p).toBe('network')
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('fetch không bao giờ trả về (bỏ qua signal) vẫn không treo quá 10 giây', async () => {
    vi.useFakeTimers()
    try {
      const p = run(() => new Promise<Response>(() => {}))
      let settled = false
      p.then(() => (settled = true))
      await vi.advanceTimersByTimeAsync(CHECK_TIMEOUT_MS)
      expect(settled).toBe(true)
      expect(await p).toBe('network')
    } finally {
      vi.useRealTimers()
    }
  })
})
