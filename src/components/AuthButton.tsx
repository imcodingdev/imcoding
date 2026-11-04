'use client'

import { useState } from 'react'
import { useBackend, useUser } from '@/components/BackendProvider'

export function AuthButton() {
  const { user, loading } = useUser()
  const backend = useBackend()
  const [error, setError] = useState<string | null>(null)
  const btn =
    'inline-flex min-h-[44px] items-center whitespace-nowrap rounded-lg border border-line bg-surface px-2 text-sm sm:px-3 font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent'

  if (loading) return <span className="block h-11 w-32" aria-hidden />

  const signIn = () => {
    setError(null)
    backend.signInWithGitHub(location.pathname).catch(() => setError('Không đăng nhập được, thử lại sau.'))
  }
  const signOut = () => {
    setError(null)
    backend.signOut().catch(() => setError('Không đăng xuất được, thử lại sau.'))
  }

  return (
    <span className="flex items-center gap-2 text-sm">
      {user ? (
        <>
          <span className="hidden truncate sm:inline sm:max-w-40">{user.name ?? user.email}</span>
          <button type="button" className={btn} onClick={signOut}>
            Đăng xuất
          </button>
        </>
      ) : (
        <button type="button" className={btn} onClick={signIn}>
          Đăng nhập bằng GitHub
        </button>
      )}
      {error && (
        <span role="alert" className="text-red-700 dark:text-red-300">
          {error}
        </span>
      )}
    </span>
  )
}
