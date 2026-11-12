import { createBrowserClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'
import type { AppUser, Backend } from './types'
import { validateStep } from './types'
import type { ProgressMap, ProgressStatus } from '@/lib/progress/status'

const MISSING =
  'Chưa cấu hình Supabase (thiếu NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)'

function mapUser(u: User | null | undefined): AppUser | null {
  if (!u) return null
  const m = (u.user_metadata ?? {}) as Record<string, string | undefined>
  return {
    id: u.id,
    email: u.email ?? null,
    name: m.full_name ?? m.user_name ?? null,
    avatarUrl: m.avatar_url ?? null,
  }
}

export function createUnconfiguredBackend(): Backend {
  const fail = () => Promise.reject(new Error(MISSING))
  return {
    getUser: async () => null,
    onAuthChange: () => () => {},
    signInWithGitHub: fail,
    signOut: async () => {},
    loadProgress: fail,
    loadResume: fail,
    saveStep: fail,
    markUnderstood: fail,
  }
}

export function createSupabaseBackend(): Backend {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) return createUnconfiguredBackend()
  const client = createBrowserClient(url, key)

  return {
    async getUser() {
      const { data } = await client.auth.getSession()
      return mapUser(data.session?.user)
    },
    onAuthChange(cb) {
      const { data } = client.auth.onAuthStateChange((_e, session) => cb(mapUser(session?.user)))
      return () => data.subscription.unsubscribe()
    },
    async signInWithGitHub(next) {
      const { error } = await client.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      })
      if (error) throw error
    },
    async signOut() {
      const { error } = await client.auth.signOut({ scope: 'local' })
      if (error) throw error
    },
    async loadProgress() {
      const { data, error } = await client.from('progress').select('concept_id, status')
      if (error) throw error
      const map: ProgressMap = {}
      for (const row of data ?? []) map[row.concept_id as string] = row.status as ProgressStatus
      return map
    },
    async markUnderstood(conceptId) {
      const { data } = await client.auth.getSession()
      const userId = data.session?.user.id
      if (!userId) throw new Error('Chưa đăng nhập')
      const now = new Date().toISOString()
      const { error } = await client.from('progress').upsert(
        {
          user_id: userId,
          concept_id: conceptId,
          status: 'understood',
          understood_at: now,
          updated_at: now,
        },
        { onConflict: 'user_id,concept_id' },
      )
      if (error) throw error
    },
    async loadResume() {
      const { data, error } = await client.from('progress')
        .select('concept_id, last_step, last_step_at')
        .neq('status', 'understood').not('last_step', 'is', null).not('last_step_at', 'is', null)
        .order('last_step_at', { ascending: false }).limit(1).maybeSingle()
      if (error) throw error
      return data ? { conceptId: data.concept_id, step: data.last_step, at: data.last_step_at } : null
    },
    async saveStep(conceptId, step) {
      validateStep(step)
      const { data } = await client.auth.getSession()
      const userId = data.session?.user.id
      if (!userId) throw new Error('Chưa đăng nhập')
      const { error: insertError } = await client.from('progress').upsert(
        { user_id: userId, concept_id: conceptId, status: 'seen' },
        { onConflict: 'user_id,concept_id', ignoreDuplicates: true },
      )
      if (insertError) throw insertError
      // Không đưa status vào update: kể cả khi người học vừa đánh dấu đã hiểu ở tab khác.
      const { error } = await client.from('progress')
        .update({ last_step: step, last_step_at: new Date().toISOString() })
        .eq('user_id', userId).eq('concept_id', conceptId)
      if (error) throw error
    },
  }
}
