// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { observeSteps } from '@/lib/progress/observeSteps'

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

it('ghi bước đã nhìn thấy độc lập điểm lưu cũ, không ghi trùng hoặc bỏ bước khi debounce', () => {
  let callback: IntersectionObserverCallback
  vi.stubGlobal('IntersectionObserver', class {
    constructor(cb: IntersectionObserverCallback) { callback = cb }
    observe() {}
    disconnect() {}
  })
  const root = document.createElement('div')
  root.innerHTML = '<section id="buoc-1"></section><section id="buoc-2"></section>'
  const reached = vi.fn()
  const stop = observeSteps(root, 8, vi.fn(), reached)
  const show = (step: number) => callback([{ target: root.querySelector(`#buoc-${step}`)!, isIntersecting: true, intersectionRatio: 1 } as IntersectionObserverEntry], {} as IntersectionObserver)
  show(1); show(2); show(1)
  expect(reached.mock.calls).toEqual([[1], [2]])
  stop()
})

it('chỉ lưu bước cao hơn khi hiện ít nhất 50%, gộp 1,5 giây và hủy khi rời bài', async () => {
  vi.useFakeTimers()
  let callback: IntersectionObserverCallback
  const disconnect = vi.fn()
  vi.stubGlobal('IntersectionObserver', class {
    constructor(cb: IntersectionObserverCallback) { callback = cb }
    observe() {}
    disconnect = disconnect
  })
  const root = document.createElement('div')
  root.innerHTML = '<section id="buoc-3"></section><section id="buoc-4"></section><section id="buoc-5"></section>'
  const save = vi.fn()
  const stop = observeSteps(root, 3, save)
  const show = (step: number, ratio: number) => callback([
    { target: root.querySelector(`#buoc-${step}`)!, isIntersecting: true, intersectionRatio: ratio } as IntersectionObserverEntry,
  ], {} as IntersectionObserver)
  show(4, 0.49)
  await vi.advanceTimersByTimeAsync(1500)
  expect(save).not.toHaveBeenCalled()
  show(4, 0.5)
  show(3, 1)
  await vi.advanceTimersByTimeAsync(1499)
  expect(save).not.toHaveBeenCalled()
  await vi.advanceTimersByTimeAsync(1)
  expect(save.mock.calls).toEqual([[4]])
  show(4, 1)
  await vi.advanceTimersByTimeAsync(1500)
  expect(save).toHaveBeenCalledTimes(1)
  show(5, 1)
  stop()
  await vi.advanceTimersByTimeAsync(1500)
  expect(save).toHaveBeenCalledTimes(1)
  expect(disconnect).toHaveBeenCalledOnce()
})

it('lướt qua nhiều bước chỉ ghi bước cao nhất sau debounce mới nhất', async () => {
  vi.useFakeTimers()
  let callback: IntersectionObserverCallback
  vi.stubGlobal('IntersectionObserver', class {
    constructor(cb: IntersectionObserverCallback) { callback = cb }
    observe() {}
    disconnect() {}
  })
  const root = document.createElement('div')
  root.innerHTML = '<section id="buoc-4"></section><section id="buoc-5"></section>'
  const save = vi.fn()
  const stop = observeSteps(root, 0, save)
  const show = (step: number) => callback([{ target: root.querySelector(`#buoc-${step}`)!, isIntersecting: true, intersectionRatio: 1 } as IntersectionObserverEntry], {} as IntersectionObserver)
  show(4)
  await vi.advanceTimersByTimeAsync(1000)
  show(5)
  await vi.advanceTimersByTimeAsync(1499)
  expect(save).not.toHaveBeenCalled()
  await vi.advanceTimersByTimeAsync(1)
  expect(save.mock.calls).toEqual([[5]])
  stop()
})
