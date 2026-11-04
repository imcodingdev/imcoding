import { AiError } from './errors'
import { buildAskRequest } from './gemini'
import type { AiCallTrace, AiClient, KeyCheck } from './types'

export function createFakeAiClient(): AiClient {
  return {
    async ask(req, onText) {
      const { traceBase } = buildAskRequest(req)
      const quota = req.apiKey === 'fake-quota'
      const trace: AiCallTrace = {
        ...traceBase,
        status: quota ? 429 : 200,
        durationMs: 0,
        chunkCount: 0,
        lastChunk: null,
      }
      if (quota) throw new AiError('quota', trace)

      const lastUser = [...req.history].reverse().find((t) => t.role === 'user')
      const answer = `Đây là câu trả lời mẫu cho: ${lastUser?.text ?? ''}`
      const size = Math.ceil(answer.length / 3)
      const parts = [answer.slice(0, size), answer.slice(size, size * 2), answer.slice(size * 2)]
      for (const p of parts) {
        if (req.signal?.aborted) throw new AiError('network', trace)
        onText(p)
        trace.chunkCount++
        trace.lastChunk = { candidates: [{ content: { parts: [{ text: p }] } }] }
      }
      return trace
    },
    async checkKey(apiKey): Promise<KeyCheck> {
      if (apiKey === 'fake-invalid') return 'invalid'
      if (apiKey === 'fake-quota') return 'quota'
      return 'ok'
    },
  }
}
