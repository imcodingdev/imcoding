// @vitest-environment jsdom
import fs from 'node:fs'
import { act, createElement, StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { LessonV2 } from '@/components/LessonV2'
import { SelfCheck } from '@/components/SelfCheck'
import { PracticalSearch } from '@/components/PracticalSearch'
import { PracticalAnswer } from '@/components/PracticalAsk'
import { parseConcept } from '@/lib/concepts/parse'
import { createFakeAiClient } from '@/lib/ai/fake'

const state = vi.hoisted(() => ({
  track: vi.fn(), user: null as { id: string } | null,
  backend: { loadResume: vi.fn().mockResolvedValue(null), saveStep: vi.fn().mockResolvedValue(undefined) },
  mark: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/metrics', () => ({ track: state.track }))
vi.mock('@/components/BackendProvider', () => ({
  useUser: () => ({ user: state.user, loading: false }),
  useBackend: () => state.backend,
  useProgress: () => ({ progress: {}, error: null, markUnderstood: state.mark }),
}))
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
const concept = parseConcept('v2-lesson.md', fs.readFileSync('tests/fixtures/concepts-v2/v2-lesson.md', 'utf8'))
if (concept.format !== 2) throw new Error('Cần bài v2')
let root: Root
let container: HTMLDivElement
beforeEach(() => {
  state.user = null
  vi.clearAllMocks()
  localStorage.clear()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals() })

it('mở bài và bước chỉ ghi một lần dù StrictMode, đổi tài khoản hoặc cuộn lại', async () => {
  let notify: IntersectionObserverCallback
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: IntersectionObserverCallback) { notify = callback }
    observe() {}
    disconnect() {}
  })
  const render = async () => { await act(async () => root.render(createElement(StrictMode, null, createElement(LessonV2, { concept })))) }
  const show = async () => { await act(async () => notify([{ target: container.querySelector('#buoc-2')!, isIntersecting: true, intersectionRatio: 1 } as IntersectionObserverEntry], {} as IntersectionObserver)) }
  await render()
  await show()
  state.user = { id: 'signed-in' }
  await render()
  await show()
  expect(state.track.mock.calls.map(([event]) => event)).toEqual([
    { event: 'lesson_open', concept_id: concept.id },
    { event: 'step_reached', concept_id: concept.id, step: 2 },
  ])
})

it('bấm kiểm tra gửi điểm câu vừa chấm; chỉ mở đáp án kiểm tra mới ghi check_opened', async () => {
  await act(async () => root.render(createElement(LessonV2, { concept })))
  state.track.mockClear()
  const question = container.querySelector('fieldset')!
  await act(async () => question.querySelectorAll<HTMLInputElement>('input')[concept.quiz![0].correctIndex].click())
  await act(async () => [...question.querySelectorAll('button')].find(button => button.textContent === 'Kiểm tra')!.click())
  expect(state.track).toHaveBeenCalledWith({ event: 'quiz_done', concept_id: concept.id, score: 1, total: 1 })
  const sections = [...container.querySelectorAll('section')]
  const check = sections.find(section => section.querySelector('h2')?.textContent?.includes('Kiểm tra không dùng AI'))!
  const other = sections.find(section => section.querySelector('h2')?.textContent?.includes('Đoán trước'))!
  for (const section of [other, check]) {
    const details = section.querySelector('details')!
    await act(async () => { details.open = true; await new Promise(resolve => setTimeout(resolve, 0)) })
  }
  expect(state.track.mock.calls.filter(([event]) => event.event === 'check_opened')).toEqual([[{ event: 'check_opened', concept_id: concept.id }]])
})

it('chỉ ghi understood sau khi lưu thành công', async () => {
  state.user = { id: 'signed-in' }
  await act(async () => root.render(createElement(SelfCheck, { conceptId: concept.id, items: [], concepts: [] })))
  state.mark.mockRejectedValueOnce(new Error('offline'))
  await act(async () => container.querySelector('button')!.click())
  expect(state.track).not.toHaveBeenCalled()
  await act(async () => container.querySelector('button')!.click())
  expect(state.track).toHaveBeenCalledWith({ event: 'understood', concept_id: concept.id })
})

it('tìm bài và hỏi AI chỉ ghi loại sự kiện, không ghi câu hỏi', async () => {
  await act(async () => root.render(createElement(PracticalSearch, { query: 'PRIVATE_QUESTION' })))
  const form = container.querySelector('form')!
  form.addEventListener('submit', event => event.preventDefault())
  await act(async () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
  expect(state.track).toHaveBeenCalledWith({ event: 'practical_search' })
  await act(async () => root.render(createElement(PracticalAnswer, { query: 'PRIVATE_QUESTION', lessons: [], apiKey: 'fake-ok', client: createFakeAiClient() })))
  await act(async () => container.querySelector('button')!.click())
  expect(state.track.mock.calls).toEqual([[{ event: 'practical_search' }], [{ event: 'practical_ai' }]])
})
