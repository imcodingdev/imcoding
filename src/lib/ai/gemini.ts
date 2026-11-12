import { AiError, classifyAskError, classifyStatus } from './errors'
import { buildSystemPrompt, summarizeSystemPrompt } from './prompt'
import { redactKey } from './redact'
import { createSseParser } from './sse'
import type { AiCallTrace, AiClient, AskRequest, KeyCheck } from './types'

// Alias "latest" được Google ghi nhận trong tài liệu models (kiểm tra 2026-11-03)
export const GEMINI_MODEL = 'gemini-flash-latest'
export const ASK_TIMEOUT_MS = 60_000
export const CHECK_TIMEOUT_MS = 10_000
export const MAX_HISTORY_ENTRIES = 20

const BASE = 'https://generativelanguage.googleapis.com/v1beta'

/** Dựng request + trace đã che key; dùng chung cho client thật và fake */
export function buildAskRequest(req: AskRequest) {
  const system = req.systemPrompt ?? buildSystemPrompt(req.lesson)
  const contents = req.history.slice(-MAX_HISTORY_ENTRIES).map((t) => ({
    role: t.role,
    parts: [{ text: t.text }],
  }))
  const url = `${BASE}/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse`
  return {
    url,
    body: { systemInstruction: { parts: [{ text: system }] }, contents },
    traceBase: {
      method: 'POST' as const,
      url,
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': redactKey(req.apiKey),
      },
      body: {
        systemInstruction: { parts: [{ text: summarizeSystemPrompt(system) }] },
        contents,
      },
    },
  }
}

/** Đọc thân lỗi JSON (nhỏ) và che mọi chỗ có key; không phải JSON thì trả null */
async function readErrorBody(res: Response, apiKey: string): Promise<unknown> {
  try {
    const text = await res.text()
    if (text.length > 20_000) return null
    const safe = apiKey ? text.split(apiKey).join(redactKey(apiKey)) : text
    return JSON.parse(safe)
  } catch {
    return null
  }
}

function extractText(chunk: unknown): string {
  const parts = (chunk as { candidates?: { content?: { parts?: { text?: unknown }[] } }[] })
    ?.candidates?.[0]?.content?.parts
  if (!Array.isArray(parts)) return ''
  return parts.map((p) => (typeof p?.text === 'string' ? p.text : '')).join('')
}

export function createGeminiClient(fetchImpl?: typeof fetch): AiClient {
  const doFetch: typeof fetch = (...args) => (fetchImpl ?? fetch)(...args)

  return {
    async ask(req, onText) {
      const { url, body, traceBase } = buildAskRequest(req)
      const started = Date.now()
      const trace: AiCallTrace = {
        ...traceBase,
        status: null,
        durationMs: 0,
        chunkCount: 0,
        lastChunk: null,
      }
      const finish = () => {
        trace.durationMs = Date.now() - started
        return trace
      }

      // Gộp signal của người dùng với timeout riêng
      const controller = new AbortController()
      const onAbort = () => controller.abort()
      if (req.signal?.aborted) controller.abort()
      else req.signal?.addEventListener('abort', onAbort)
      const timer = setTimeout(() => controller.abort(), ASK_TIMEOUT_MS)

      try {
        const res = await doFetch(url, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-goog-api-key': req.apiKey,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        })
        trace.status = res.status
        if (!res.ok) {
          const errorBody = await readErrorBody(res, req.apiKey)
          trace.lastChunk = errorBody
          throw new AiError(classifyAskError(res.status, errorBody), finish())
        }
        if (!res.body) throw new AiError('unknown', finish())

        const parser = createSseParser((data) => {
          let chunk: unknown
          try {
            chunk = JSON.parse(data)
          } catch {
            return
          }
          trace.chunkCount++
          trace.lastChunk = chunk
          const text = extractText(chunk)
          if (text) onText(text)
        })
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          parser.push(decoder.decode(value, { stream: true }))
        }
        parser.push(decoder.decode())
        parser.end()
        return finish()
      } catch (e) {
        if (e instanceof AiError) throw e
        // Huỷ (người dùng/timeout) hoặc lỗi mạng
        throw new AiError('network', finish())
      } finally {
        clearTimeout(timer)
        req.signal?.removeEventListener('abort', onAbort)
      }
    },

    async checkKey(apiKey): Promise<KeyCheck> {
      // Không để trang cài đặt treo ở "Đang kiểm tra…"
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS)
      // Hết giờ thì thôi chờ, kể cả khi fetch không tôn trọng signal
      const timedOut = new Promise<never>((_, reject) =>
        controller.signal.addEventListener('abort', () => reject(new Error('timeout'))),
      )
      try {
        const res = await Promise.race([
          doFetch(`${BASE}/models`, {
            method: 'GET',
            headers: { 'x-goog-api-key': apiKey },
            signal: controller.signal,
          }),
          timedOut,
        ])
        if (res.ok) return 'ok'
        // GET /models chỉ lỗi vì key nên 400 vẫn coi là key sai
        return classifyStatus(res.status)
      } catch {
        return 'network'
      } finally {
        clearTimeout(timer)
      }
    },
  }
}
