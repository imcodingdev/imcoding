import { describe, it, expect } from 'vitest'
import { buildMapLayout } from '@/lib/concepts/layout'
import type { Concept, ConceptGroup } from '@/lib/concepts/types'
import { loadConcepts } from '@/lib/concepts/load'
import { LESSON_IDS } from '../fixtures/curriculum'

function c(id: string, group: ConceptGroup, prerequisites: string[] = []): Concept {
  return {
    id,
    title: id,
    group,
    prerequisites,
    priority: 1,
    signals: ['x'],
    sections: { plain: '', inCode: '', pitfalls: '' },
    format: 1,
    stage: 1,
    quiz: [],
  }
}

describe('buildMapLayout', () => {
  it('bản đồ 50 bài đủ id, cạnh prerequisite và không đè vị trí', () => {
    const lessons = loadConcepts('content/concepts')
    const { nodes, edges } = buildMapLayout(lessons)
    expect(nodes).toHaveLength(50)
    expect(nodes.map(node => node.id).sort()).toEqual([...LESSON_IDS].sort())
    expect(new Set(nodes.map(node => `${node.x},${node.y}`)).size).toBe(50)
    const ids = new Set(nodes.map(node => node.id))
    for (const edge of edges) {
      expect(ids.has(edge.from)).toBe(true)
      expect(ids.has(edge.to)).toBe(true)
    }
    for (const lesson of lessons) {
      expect(edges.filter(edge => edge.to === lesson.id).map(edge => edge.from).sort())
        .toEqual([...lesson.prerequisites].sort())
    }
    for (const left of nodes) {
      for (const right of nodes) {
        if (left.id !== right.id) expect(Math.abs(left.x - right.x) >= 190 || Math.abs(left.y - right.y) >= 70).toBe(true)
      }
    }
  })
  const concepts = [
    c('component', 'frontend', ['html-css-js']),
    c('html-css-js', 'web', ['client-server']),
    c('client-server', 'web'),
  ]

  it('đặt node theo nhóm (cột) và độ sâu (hàng)', () => {
    const { nodes } = buildMapLayout(concepts)
    const pos = (id: string) => {
      const n = nodes.find((x) => x.id === id)!
      return { x: n.x, y: n.y }
    }
    expect(pos('client-server')).toEqual({ x: 0, y: 0 })
    expect(pos('html-css-js')).toEqual({ x: 0, y: 90 })
    expect(pos('component')).toEqual({ x: 240, y: 0 })
  })

  it('tạo cạnh từ khái niệm học trước đến khái niệm phụ thuộc', () => {
    const { edges } = buildMapLayout([...concepts].reverse())
    expect(edges).toEqual([
      { from: 'client-server', to: 'html-css-js' },
      { from: 'html-css-js', to: 'component' },
    ])
  })

  it('không có hai node trùng toạ độ và bỏ qua nhóm rỗng', () => {
    const { nodes } = buildMapLayout([c('a', 'web'), c('b', 'web'), c('d', 'api')])
    const keys = nodes.map((n) => `${n.x},${n.y}`)
    expect(new Set(keys).size).toBe(keys.length)
    expect(nodes.find((n) => n.id === 'd')!.x).toBe(240)
  })
})
