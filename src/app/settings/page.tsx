import type { Metadata } from 'next'
import { AiSettings } from '@/components/AiSettings'
import { loadConcepts } from '@/lib/concepts/load'

export const metadata: Metadata = { title: 'Cài đặt AI – ImCoding' }

export default function SettingsPage() {
  const concepts = loadConcepts().map(({ id, title, group, prerequisites, priority, stage }) => ({
    id,
    title,
    group,
    prerequisites,
    priority,
    stage,
  }))
  const titles = Object.fromEntries(concepts.map((c) => [c.id, c.title]))
  return (
    <main className="mx-auto w-full min-w-0 max-w-2xl space-y-8 px-4 py-8 md:px-6 md:py-12">
      <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-ink md:text-4xl">
        Bài thực hành: Gắn API key để hỏi AI
      </h1>
      <AiSettings concepts={concepts} titles={titles} />
    </main>
  )
}
