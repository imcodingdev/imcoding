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
  loadResume(): Promise<ResumePoint | null>
  saveStep(conceptId: string, step: number): Promise<void>
  markUnderstood(conceptId: string): Promise<void>
}

export interface ResumePoint {
  conceptId: string
  step: number
  at: string
}

export function validateStep(step: number): void {
  if (!Number.isInteger(step) || step < 1 || step > 20) throw new Error('Bước học không hợp lệ')
}
