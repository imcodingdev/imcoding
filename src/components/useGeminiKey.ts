'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { useUser } from '@/components/BackendProvider'
import { clearKey, getKey, setKey, subscribeKeys } from '@/lib/ai/keyStore'

export function useGeminiKey(): {
  userId: string | null
  key: string | null
  save(key: string): void
  clear(): void
} {
  const { user } = useUser()
  const userId = user?.id ?? null
  const key = useSyncExternalStore(
    subscribeKeys,
    () => (userId ? getKey(userId) : null),
    () => null,
  )
  const save = useCallback((k: string) => {
    if (userId) setKey(userId, k)
  }, [userId])
  const clear = useCallback(() => {
    if (userId) clearKey(userId)
  }, [userId])
  return { userId, key, save, clear }
}
