import type { ConceptGroup } from '@/lib/concepts/types'
import type { NodeStatus } from '@/lib/progress/status'

/** Màu trạng thái: nền, viền, chữ của thẻ/node. */
export const STATUS_CLASS: Record<NodeStatus, string> = {
  neutral: 'border-status-unseen-border bg-status-unseen-bg text-status-unseen-text hover:border-ink',
  seen: 'border-status-seen-border bg-status-seen-bg text-status-seen-text hover:border-ink',
  understood: 'border-status-mastered-border bg-status-mastered-bg text-status-mastered-text hover:border-ink',
}

/** Dải màu 4px bên trái theo nhóm (chỉ dùng làm điểm nhấn, không tô nền). */
export const GROUP_ACCENT: Record<ConceptGroup, string> = {
  web: 'border-l-4 border-l-[var(--group-web-dot)]',
  frontend: 'border-l-4 border-l-[var(--group-frontend-dot)]',
  backend: 'border-l-4 border-l-[var(--group-backend-dot)]',
  database: 'border-l-4 border-l-[var(--group-database-dot)]',
  api: 'border-l-4 border-l-[var(--group-api-dot)]',
  auth: 'border-l-4 border-l-[var(--group-auth-dot)]',
  deploy: 'border-l-4 border-l-[var(--group-deploy-dot)]',
  'ai-git': 'border-l-4 border-l-[var(--group-ai-git-dot)]',
  systems: 'border-l-4 border-l-[var(--group-systems-dot)]',
}

/** Chấm tròn màu nhóm cạnh tiêu đề nhóm. */
export const GROUP_DOT: Record<ConceptGroup, string> = {
  web: 'bg-[var(--group-web-dot)]',
  frontend: 'bg-[var(--group-frontend-dot)]',
  backend: 'bg-[var(--group-backend-dot)]',
  database: 'bg-[var(--group-database-dot)]',
  api: 'bg-[var(--group-api-dot)]',
  auth: 'bg-[var(--group-auth-dot)]',
  deploy: 'bg-[var(--group-deploy-dot)]',
  'ai-git': 'bg-[var(--group-ai-git-dot)]',
  systems: 'bg-[var(--group-systems-dot)]',
}
