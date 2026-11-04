import type { ProgressMap } from '@/lib/progress/status'

export interface AppUser {
  id: string
  email: string | null
  name: string | null
  avatarUrl: string | null
}

export interface Backend {
  getUser(): Promise<AppUser | null>
  onAuthChange(cb: (user: AppUser | null) => void): () => void
  signInWithGitHub(next: string): Promise<void>
  signOut(): Promise<void>
  loadProgress(): Promise<ProgressMap>
  markUnderstood(conceptId: string): Promise<void>
}
