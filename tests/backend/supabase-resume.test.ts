import { afterEach, expect, it, vi } from 'vitest'
import { createSupabaseBackend } from '@/lib/backend/supabase'

const mock = vi.hoisted(() => ({ create: vi.fn() }))
vi.mock('@supabase/ssr', () => ({ createBrowserClient: mock.create }))
afterEach(() => vi.unstubAllEnvs())

it('Supabase tạo seen có ignoreDuplicates và chỉ cập nhật bước của đúng user/bài', async () => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.invalid')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'fake')
  const upsert = vi.fn(async () => ({ error: null }))
  const eq = vi.fn().mockReturnThis()
  const update = vi.fn(() => ({ eq, error: null }))
  eq.mockReturnValue({ eq, error: null })
  mock.create.mockReturnValue({
    auth: { getSession: async () => ({ data: { session: { user: { id: 'u' } } } }) },
    from: () => ({ upsert, update }),
  })
  await createSupabaseBackend().saveStep('database', 4)
  expect(upsert).toHaveBeenCalledWith(
    { user_id: 'u', concept_id: 'database', status: 'seen' },
    { onConflict: 'user_id,concept_id', ignoreDuplicates: true },
  )
  expect(update).toHaveBeenCalledWith({ last_step: 4, last_step_at: expect.any(String) })
  expect(eq.mock.calls).toEqual([['user_id', 'u'], ['concept_id', 'database']])
})
