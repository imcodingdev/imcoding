// @vitest-environment jsdom
import fs from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { parseConcept } from '@/lib/concepts/parse'
import { lessonContext, lessonStepCount } from '@/lib/concepts/lesson'
import { LessonV2 } from '@/components/LessonV2'
import { addLessonSections } from '../fixtures/lesson-additions'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
const raw = fs.readFileSync('tests/fixtures/concepts-v2/v2-lesson.md', 'utf8').replace(/\r\n/g, '\n')
const base = raw.replace(/## Trắc nghiệm\n[\s\S]*?(?=## Kiểm tra không dùng AI)/, '').replace(/\n## Bài tập thực hành[\s\S]*$/, '')
const parsed = parseConcept('v2-lesson.md', addLessonSections(base))
if (parsed.format !== 2) throw new Error('Cần fixture v2')
const concept = parsed
let root: Root | undefined
let container: HTMLDivElement
function render(value = concept) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root!.render(createElement(LessonV2, { concept: value })))
}
afterEach(() => {
  act(() => root?.unmount())
  container?.remove()
  root = undefined
  vi.unstubAllGlobals()
})
const click = async (element: HTMLElement) => { await act(async () => element.click()) }
const buttons = (name: string) => [...container.querySelectorAll('button')].filter(b => b.textContent === name)

describe('giao diện bài v2.1', () => {
  it('ẩn kết quả trước khi chấm, chấm sai/đúng, tổng điểm và làm lại', async () => {
    render()
    const questions = container.querySelectorAll('fieldset')
    expect(questions).toHaveLength(3)
    expect(buttons('Kiểm tra').every(b => b.disabled)).toBe(true)
    expect(container.textContent).not.toContain(concept.quiz![0].explanation)
    expect(container.textContent).toContain('0/3 câu đúng')
    const first = questions[0].querySelectorAll<HTMLInputElement>('input[type="radio"]')
    await click(first[0])
    await click(first[1])
    expect(first[0].checked).toBe(false)
    await click(first[0])
    await click(buttons('Kiểm tra')[0])
    expect(questions[0].textContent).toContain('Chưa đúng')
    expect(questions[0].textContent).toContain(concept.quiz![0].explanation)
    expect(first[0].disabled).toBe(true)
    await click(questions[1].querySelector('input')!)
    await click(buttons('Kiểm tra')[1])
    expect(questions[1].textContent).toContain('Chính xác')
    expect(container.textContent).toContain('1/3 câu đúng')
    await click(buttons('Làm lại')[0])
    expect(container.textContent).toContain('0/3 câu đúng')
    expect(container.textContent).not.toContain(concept.quiz![0].explanation)
    expect([...container.querySelectorAll<HTMLInputElement>('input[type="radio"]')].every(r => !r.checked && !r.disabled)).toBe(true)
    await click(first[1])
    await click(buttons('Kiểm tra')[0])
    expect(questions[0].textContent).toContain('Chính xác')
    expect(container.textContent).toContain('1/3 câu đúng')
  })
  it('bài tập có tick cục bộ và sao chép đúng prompt', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    render()
    const checks = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
    expect(checks).toHaveLength(3)
    await click(checks[0])
    expect(checks[0].checked).toBe(true)
    expect(checks[1].checked).toBe(false)
    expect(container.textContent).toContain(concept.exercise!.expectedResult)
    await click(buttons('Sao chép').at(-1)!)
    expect(writeText).toHaveBeenCalledWith('Rà lại danh sách trên nhánh thử. Chỉ báo cáo, không tự sửa.')
    act(() => root!.unmount())
    container.remove()
    root = undefined
    render()
    expect(container.querySelector<HTMLInputElement>('input[type="checkbox"]')!.checked).toBe(false)
  })
  it.each([false, true])('đánh số liên tục có Nhắc lại = %s, theo đúng số mục', recall => {
    for (const quiz of [undefined, concept.quiz]) {
      for (const exercise of [undefined, concept.exercise]) {
        const value = { ...concept, recall: recall ? concept.recall : [], quiz, exercise }
        render(value)
        const headings = [...container.querySelectorAll('section[aria-labelledby] > h2')]
        expect(headings).toHaveLength(6 + Number(recall) + Number(!!quiz) + Number(!!exercise))
        expect(lessonStepCount(value)).toBe(headings.length)
        headings.forEach((h, i) => expect(h.textContent).toMatch(new RegExp(`^0${i + 1}\\.`)))
        act(() => root!.unmount())
        root = undefined
        container.remove()
      }
    }
  })
  it('Hỏi AI nhận bài tập nhưng loại toàn bộ trắc nghiệm', () => {
    const value = { ...concept, quiz: [{ question: 'QUIZ_QUESTION_PRIVATE', body: 'QUIZ_BODY_PRIVATE', options: ['QUIZ_OPTION_PRIVATE'], correctIndex: 0, explanation: 'QUIZ_EXPLANATION_PRIVATE' }] }
    const context = JSON.stringify(lessonContext(value))
    for (const marker of ['QUIZ_QUESTION_PRIVATE', 'QUIZ_BODY_PRIVATE', 'QUIZ_OPTION_PRIVATE', 'QUIZ_EXPLANATION_PRIVATE']) expect(context).not.toContain(marker)
    expect(context).toContain(concept.exercise!.goal)
    for (const step of concept.exercise!.steps) expect(context).toContain(step)
    expect(context).toContain(concept.exercise!.expectedResult)
    expect(lessonContext(value).inCode).toContain(concept.exercise!.reviewPrompt)
  })
})
