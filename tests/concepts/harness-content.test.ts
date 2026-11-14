import fs from 'node:fs'
import matter from 'gray-matter'
import { describe, expect, it } from 'vitest'
import { parseConcept } from '@/lib/concepts/parse'

const lectures = {
  '01': 'why-capable-agents-still-fail',
  '02': 'what-a-harness-actually-is',
  '03': 'why-the-repository-must-become-the-system-of-record',
  '04': 'why-one-giant-instruction-file-fails',
  '05': 'why-long-running-tasks-lose-continuity',
  '06': 'why-initialization-needs-its-own-phase',
  '07': 'why-agents-overreach-and-under-finish',
  '08': 'why-feature-lists-are-harness-primitives',
  '09': 'why-agents-declare-victory-too-early',
  '10': 'why-end-to-end-testing-changes-results',
  '11': 'why-observability-belongs-inside-the-harness',
  '12': 'why-every-session-must-leave-a-clean-state',
  '13': 'loop-engineering',
} as const
const lessons = [
  { id: 'agent-instructions', title: 'File hướng dẫn cho agent (AGENTS.md, CLAUDE.md)', stage: 2, priority: 1, prerequisites: ['ai-task-context', 'git-commit'], lectures: ['01', '02', '03', '04'] },
  { id: 'agent-scope', title: 'Giao một việc một lúc cho agent', stage: 2, priority: 1, prerequisites: ['agent-instructions', 'acceptance-criteria'], lectures: ['07', '08'] },
  { id: 'done-evidence', title: 'Bằng chứng "đã xong" của agent', stage: 2, priority: 1, prerequisites: ['agent-scope', 'automated-tests'], lectures: ['09', '10'] },
  { id: 'agent-handoff', title: 'Bàn giao giữa các phiên làm việc của agent', stage: 2, priority: 2, prerequisites: ['agent-instructions', 'git-commit'], lectures: ['05', '06', '12'] },
  { id: 'agent-loops', title: 'Cho agent tự chạy vòng lặp an toàn', stage: 4, priority: 2, prerequisites: ['agent-handoff', 'done-evidence', 'logging-monitoring', 'ai-cost-limits'], lectures: ['11', '13'] },
] as const

describe('năm bài theo ROUND-HARNESS-1', () => {
  it.each(lessons)('$id đúng metadata, nguồn và hợp đồng nội dung', ({ lectures: numbers, ...metadata }) => {
    const raw = fs.readFileSync(`content/concepts/${metadata.id}.md`, 'utf8').replace(/\r\n/g, '\n')
    const concept = parseConcept(`${metadata.id}.md`, raw)
    expect(concept).toMatchObject({ ...metadata, group: 'ai-git', format: 2 })
    if (concept.format !== 2) throw new Error('Cần bài v2')
    expect(concept.sources).toEqual(numbers.map(number => ({
      title: `Learn Harness Engineering — Lecture ${number}`,
      url: `https://github.com/walkinglabs/learn-harness-engineering/blob/main/docs/en/lectures/lecture-${number}-${lectures[number]}/index.md`,
    })))
    const body = matter(raw).content
    expect(body.trim().split(/\s+/).length).toBeGreaterThanOrEqual(1500)
    expect(body.trim().split(/\s+/).length).toBeLessThanOrEqual(2600)
    expect(concept.quiz).toHaveLength(4)
    expect(new Set(concept.quiz!.map(q => q.correctIndex)).size).toBeGreaterThan(1)
    expect(concept.exercise?.steps.length).toBeGreaterThanOrEqual(3)
    expect(concept.exercise?.steps.length).toBeLessThanOrEqual(6)
    expect(concept.exercise?.expectedResult).toBeTruthy()
    expect((concept.example.match(/___/g) ?? []).length).toBeLessThanOrEqual(1)
    const exampleBlocks = [...concept.example.matchAll(/^```(\S*)\n([\s\S]*?)^```/gm)]
    expect(exampleBlocks.length).toBeGreaterThanOrEqual(1)
    expect(exampleBlocks.length).toBeLessThanOrEqual(2)
    for (const [, lang, code] of body.matchAll(/^```(\S*)\n([\s\S]*?)^```/gm)) {
      expect(lang).not.toBe('')
      expect(code.trimEnd().split('\n').length).toBeLessThanOrEqual(15)
    }
  })
})
