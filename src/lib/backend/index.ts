import type { Backend } from './types'
import { createFakeBackend } from './fake'
import { createSupabaseBackend } from './supabase'

export type { AppUser, Backend } from './types'

export function createBackend(
  env: { fake?: string; vercel?: string } = {
    fake: process.env.NEXT_PUBLIC_FAKE_BACKEND,
    vercel: process.env.VERCEL,
  },
): Backend {
  if (env.fake === '1') {
    if (env.vercel === '1') {
      throw new Error('NEXT_PUBLIC_FAKE_BACKEND không được bật trên Vercel')
    }
    return createFakeBackend()
  }
  return createSupabaseBackend()
}
