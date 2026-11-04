import matter from 'gray-matter'
import { ConceptError, GROUPS } from './types'
import type { Concept, ConceptGroup, QuizItem } from './types'

export { ConceptError }

const HEADINGS = [
  'Giải thích đời thường',
  'Trong code trông như thế nào',
  'Hay gặp lỗi gì',
  'Tự kiểm tra',
] as const

function splitSections(body: string): { title: string; content: string }[] {
  const out: { title: string; content: string[] }[] = []
  let inFence = false
  for (const line of body.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence
    if (!inFence && line.startsWith('## ')) {
      out.push({ title: line.slice(3).trim(), content: [] })
    } else if (out.length > 0) {
      out[out.length - 1].content.push(line)
    }
  }
  return out.map((s) => ({ title: s.title, content: s.content.join('\n').trim() }))
}

function parseQuiz(fileName: string, content: string): QuizItem[] {
  const items: { question: string; lines: string[] }[] = []
  let inFence = false
  for (const line of content.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence
    if (!inFence && line.startsWith('### ')) {
      items.push({ question: line.slice(4).trim(), lines: [] })
    } else if (items.length > 0) {
      items[items.length - 1].lines.push(line)
    }
  }
  const quiz = items.map((i) => ({ question: i.question, answer: i.lines.join('\n').trim() }))
  if (quiz.length < 2 || quiz.length > 3) {
    throw new ConceptError(`${fileName}: mục "Tự kiểm tra" cần 2-3 câu hỏi (###), hiện có ${quiz.length}`)
  }
  if (quiz.some((q) => !q.question || !q.answer)) {
    throw new ConceptError(`${fileName}: mục "Tự kiểm tra" có câu hỏi hoặc đáp án rỗng`)
  }
  return quiz
}

function stringArray(fileName: string, field: string, v: unknown, minLength: number): string[] {
  if (
    !Array.isArray(v) ||
    v.some((x) => typeof x !== 'string' || x.trim() === '') ||
    v.length < minLength
  ) {
    throw new ConceptError(
      `${fileName}: trường "${field}" phải là mảng chuỗi${minLength > 0 ? ` (ít nhất ${minLength})` : ''}`,
    )
  }
  return [...v]
}

export function parseConcept(fileName: string, raw: string): Concept {
  const text = raw.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')
  // truyền options để gray-matter không dùng cache theo chuỗi đầu vào
  let parsed: matter.GrayMatterFile<string>
  try {
    parsed = matter(text, {})
  } catch (e) {
    throw new ConceptError(`${fileName}: frontmatter không hợp lệ (${(e as Error).message})`)
  }
  const data = parsed.data as Record<string, unknown>

  const id = data.id
  if (typeof id !== 'string' || id === '') {
    throw new ConceptError(`${fileName}: thiếu trường "id"`)
  }
  const expectedId = fileName.replace(/\.md$/, '')
  if (id !== expectedId) {
    throw new ConceptError(`${fileName}: "id" là "${id}" nhưng tên file yêu cầu "${expectedId}"`)
  }
  const title = data.title
  if (typeof title !== 'string' || title.trim() === '') {
    throw new ConceptError(`${fileName}: thiếu trường "title"`)
  }
  const group = data.group
  if (typeof group !== 'string' || !GROUPS.some((g) => g.id === group)) {
    throw new ConceptError(`${fileName}: trường "group" không hợp lệ: ${String(group)}`)
  }
  const prerequisites = stringArray(fileName, 'prerequisites', data.prerequisites, 0)
  const priority = data.priority
  if (priority !== 1 && priority !== 2) {
    throw new ConceptError(`${fileName}: trường "priority" phải là 1 hoặc 2, hiện là ${String(priority)}`)
  }
  const signals = stringArray(fileName, 'signals', data.signals, 1)

  const sections = splitSections(parsed.content)
  for (let i = 0; i < HEADINGS.length; i++) {
    if (sections[i]?.title !== HEADINGS[i]) {
      const exists = sections.some((s) => s.title === HEADINGS[i])
      throw new ConceptError(
        exists
          ? `${fileName}: mục "${HEADINGS[i]}" sai thứ tự (4 mục H2 phải theo đúng thứ tự)`
          : `${fileName}: thiếu mục "${HEADINGS[i]}"`,
      )
    }
  }
  if (sections.length > HEADINGS.length) {
    throw new ConceptError(`${fileName}: chỉ được có đúng 4 mục H2, thừa mục "${sections[4].title}"`)
  }
  for (let i = 0; i < 3; i++) {
    if (sections[i].content === '') {
      throw new ConceptError(`${fileName}: mục "${HEADINGS[i]}" đang rỗng`)
    }
  }

  return {
    id,
    title,
    group: group as ConceptGroup,
    prerequisites,
    priority,
    signals,
    sections: {
      plain: sections[0].content,
      inCode: sections[1].content,
      pitfalls: sections[2].content,
    },
    quiz: parseQuiz(fileName, sections[3].content),
  }
}
