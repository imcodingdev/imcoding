import fs from 'node:fs'
import matter from 'gray-matter'
import { describe, expect, it } from 'vitest'
import { loadConcepts } from '@/lib/concepts/load'

const notYetIds = [
  'system-tradeoffs', 'non-functional-requirements', 'concurrent-writes',
  'idempotency-retries', 'automated-tests', 'ci-cd', 'logging-monitoring',
  'backup-restore', 'schema-migrations', 'deployment-environments',
  'preview-deploy', 'agent-loops',
]
const concepts = loadConcepts('content/concepts')
const reviewIds = [
  'agent-handoff', 'agent-instructions', 'agent-loops', 'agent-scope', 'ci-cd',
  'concurrent-writes', 'done-evidence', 'git-branch-merge', 'github-access',
  'github-remote', 'idempotency-retries', 'non-functional-requirements',
  'preview-deploy', 'pull-request', 'python-scripts', 'system-tradeoffs',
]

describe('nội dung ROUND-TEACH-2', () => {
  it('đủ 58 bài có prompt rà lại trong bài tập thực hành', () => {
    expect(concepts).toHaveLength(58)
    const reviewed = concepts.filter(c => c.format === 2 && c.exercise?.reviewPrompt?.trim())
    expect(reviewed).toHaveLength(58)
  })

  it.each(reviewIds)('%s có prompt mới chỉ báo cáo, 3–5 điểm rà kèm cách kiểm', id => {
    const concept = concepts.find(c => c.id === id)
    if (!concept || concept.format !== 2) throw new Error(`Thiếu bài v2: ${id}`)
    const prompt = concept.exercise?.reviewPrompt
    expect(prompt).toBeTruthy()
    expect(prompt).toMatch(/chỉ báo cáo/i)
    expect(prompt).toContain('không tự sửa')
    expect(prompt).toContain('không chạy lệnh ghi/xóa/push')
    expect(prompt).toContain('không đọc hay in khóa bí mật')
    const points = prompt!.split('\n').filter(line => /^\d+\. /.test(line))
    expect(points.length).toBeGreaterThanOrEqual(3)
    expect(points.length).toBeLessThanOrEqual(5)
    for (const point of points) expect(point).toMatch(/cách kiểm:/i)
    expect(prompt).toContain('đạt / chưa đạt / chưa xác minh')
    expect(prompt).toContain('bằng chứng')
    const raw = fs.readFileSync(`content/concepts/${id}.md`, 'utf8').replace(/\r\n/g, '\n')
    const review = raw.split('### Nhờ AI rà lại\n')
    expect(review).toHaveLength(2)
    expect(review[0]).toContain('### Kết quả đúng')
    expect(review[1].trim()).toMatch(/^```text\n(?:(?!```)[\s\S])+\n```$/)
  })

  it('đúng 12 bài đã chọn có mục Khi nào chưa cần', () => {
    const ids = concepts.filter(c => c.format === 2 && c.notYet).map(c => c.id)
    expect(ids.sort()).toEqual([...notYetIds].sort())
  })

  it.each(notYetIds)('%s có 2–4 đề xuất với điều kiện chưa cần và cần', id => {
    const concept = concepts.find(c => c.id === id)
    if (!concept || concept.format !== 2) throw new Error(`Thiếu bài v2: ${id}`)
    expect(concept.notYet).toBeTruthy()
    const lines = concept.notYet!.split('\n').filter(line => line.startsWith('- '))
    expect(lines.length).toBeGreaterThanOrEqual(2)
    expect(lines.length).toBeLessThanOrEqual(4)
    for (const line of lines) {
      expect(line).toMatch(/^- \*\*.+\*\* — chưa cần khi .+; cần khi .+/)
    }
  })

  it.each(concepts)('$id có thân bài không quá 2.800 âm tiết, tính cả code', ({ id }) => {
    const raw = fs.readFileSync(`content/concepts/${id}.md`, 'utf8')
    expect(matter(raw).content.trim().split(/\s+/).length).toBeLessThanOrEqual(2800)
  })
})
