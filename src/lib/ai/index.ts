import type { AiClient } from './types'
import { createFakeAiClient } from './fake'
import { createGeminiClient } from './gemini'

export * from './types'
export { AiError } from './errors'

export function createAiClient(
  env: { fake?: string; vercel?: string } = {
    fake: process.env.NEXT_PUBLIC_FAKE_BACKEND,
    vercel: process.env.VERCEL,
  },
): AiClient {
  if (env.fake === '1') {
    if (env.vercel === '1') {
      throw new Error('NEXT_PUBLIC_FAKE_BACKEND không được bật trên Vercel')
    }
    return createFakeAiClient()
  }
  return createGeminiClient()
}
