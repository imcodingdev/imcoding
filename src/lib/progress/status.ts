export type ProgressStatus = 'seen' | 'understood'
export type ProgressMap = Record<string, ProgressStatus>
export type NodeStatus = 'neutral' | 'seen' | 'understood'

export function nodeStatus(progress: ProgressMap | null, conceptId: string): NodeStatus {
  if (!progress) return 'neutral'
  return progress[conceptId] ?? 'neutral'
}

export function filterKnown(progress: ProgressMap, knownIds: string[]): ProgressMap {
  const known = new Set(knownIds)
  const out: ProgressMap = {}
  for (const [id, status] of Object.entries(progress)) {
    if (known.has(id)) out[id] = status
  }
  return out
}
