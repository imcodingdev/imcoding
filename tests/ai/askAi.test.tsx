// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { AskAiChat } from '@/components/AskAi'
import { AiError } from '@/lib/ai/errors'
import type { AiCallTrace, AiClient, AskRequest } from '@/lib/ai/types'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const lesson = { title: 'Client–Server', plain: 'p', inCode: 'c', pitfalls: 'x' }
const trace: AiCallTrace = {
  method: 'POST',
  url: 'https://example.test/models/m:streamGenerateContent?alt=sse',
  headers: { 'x-goog-api-key': '••••' },
  body: {},
  status: 200,
  durationMs: 1,
  chunkCount: 1,
  lastChunk: null,
}

let root: Root | null = null
let container: HTMLDivElement

function render(client: AiClient) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root!.render(createElement(AskAiChat, { client, apiKey: 'secret-key-123', lesson })))
}

afterEach(() => {
  act(() => root?.unmount())
  container.remove()
  root = null
})

const button = (name: string) =>
  [...container.querySelectorAll('button')].find((b) => b.textContent === name) as HTMLButtonElement | undefined

function type(text: string) {
  const ta = container.querySelector('textarea')!
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!
  act(() => {
    setter.call(ta, text)
    ta.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

async function click(el: HTMLElement) {
  await act(async () => {
    el.click()
  })
}

/** Client giả: trả một đoạn chữ rồi treo cho tới khi bị huỷ */
function hangingClient(calls: AskRequest[]): AiClient {
  return {
    ask(req, onText) {
      calls.push(req)
      onText('Phần đầu câu trả lời')
      return new Promise((_, reject) => {
        req.signal?.addEventListener('abort', () => reject(new AiError('network', trace)))
      })
    },
    checkKey: async () => 'ok',
  }
}

describe('AskAiChat', () => {
  it('bấm Dừng: huỷ request, giữ chữ đã nhận, Gửi dùng lại được', async () => {
    const calls: AskRequest[] = []
    render(hangingClient(calls))
    expect(button('Gửi')!.disabled).toBe(true)
    type('Server là gì?')
    expect(button('Gửi')!.disabled).toBe(false)
    await click(button('Gửi')!)

    expect(calls).toHaveLength(1)
    expect(calls[0].history).toEqual([{ role: 'user', text: 'Server là gì?' }])
    expect(calls[0].signal?.aborted).toBe(false)
    expect(container.textContent).toContain('Phần đầu câu trả lời')
    expect(button('Dừng')).toBeDefined()

    await click(button('Dừng')!)
    expect(calls[0].signal?.aborted).toBe(true)
    expect(button('Dừng')).toBeUndefined()
    expect(container.textContent).toContain('Phần đầu câu trả lời')
    expect(container.textContent).toContain('Đã dừng.')
    expect(container.textContent).not.toContain('Không kết nối được')

    type('Câu tiếp theo')
    expect(button('Gửi')!.disabled).toBe(false)
    await click(button('Gửi')!)
    expect(calls).toHaveLength(2)
    expect(calls[1].history).toEqual([
      { role: 'user', text: 'Server là gì?' },
      { role: 'model', text: 'Phần đầu câu trả lời' },
      { role: 'user', text: 'Câu tiếp theo' },
    ])
  })

  it('chặn khoá dán nhầm, không gọi AI', async () => {
    const calls: AskRequest[] = []
    render(hangingClient(calls))
    type('key của tôi: AIza' + 'x'.repeat(35))
    await click(button('Gửi')!)
    expect(calls).toHaveLength(0)
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      'Hình như bạn vừa dán một khoá bí mật, hãy xoá đi.',
    )
  })

  it('lỗi: giữ chữ đã nhận, hiện thông báo, invalid có link Cài đặt', async () => {
    const client: AiClient = {
      async ask(_req, onText) {
        onText('Một phần')
        throw new AiError('invalid', { ...trace, status: 400 })
      },
      checkKey: async () => 'ok',
    }
    render(client)
    type('Hỏi')
    await click(button('Gửi')!)
    expect(container.textContent).toContain('Một phần')
    expect(container.textContent).toContain('Key không đúng')
    expect(container.querySelector('a[href="/settings"]')).not.toBeNull()
    expect(container.textContent).toContain('Xem bên trong')
    expect(container.innerHTML).not.toContain('secret-key-123')
    expect(button('Gửi')).toBeDefined()
  })

  it('lỗi trước chữ đầu tiên rồi hỏi lại: lịch sử không có hai lượt user liền nhau', async () => {
    const calls: AskRequest[] = []
    let n = 0
    const client: AiClient = {
      async ask(req, onText) {
        calls.push(req)
        n++
        if (n === 1) throw new AiError('unknown', { ...trace, status: 400 })
        onText(`Trả lời ${n}`)
        return trace
      },
      checkKey: async () => 'ok',
    }
    render(client)
    type('Câu 1')
    await click(button('Gửi')!)
    expect(container.textContent).toContain('Google báo lỗi')
    type('Câu 2')
    await click(button('Gửi')!)
    type('Câu 3')
    await click(button('Gửi')!)
    expect(calls[1].history).toEqual([{ role: 'user', text: 'Câu 2' }])
    expect(calls[2].history).toEqual([
      { role: 'user', text: 'Câu 2' },
      { role: 'model', text: 'Trả lời 2' },
      { role: 'user', text: 'Câu 3' },
    ])
    for (const c of calls) {
      for (let i = 1; i < c.history.length; i++) {
        expect(c.history[i].role === 'user' && c.history[i - 1].role === 'user').toBe(false)
      }
    }
  })

  it('trả lời thành công nhưng rỗng: hiện lời nhắn thay vì thẻ trống', async () => {
    const client: AiClient = {
      ask: async () => trace,
      checkKey: async () => 'ok',
    }
    render(client)
    type('Hỏi')
    await click(button('Gửi')!)
    expect(container.textContent).toContain('AI không trả lời câu này. Bạn thử hỏi cách khác nhé.')
    expect(container.textContent).not.toContain('Đang trả lời…')
  })

  it('đã dừng hoặc lỗi thì không hiện lời nhắn trả lời rỗng', async () => {
    const client: AiClient = {
      async ask() {
        throw new AiError('quota', trace)
      },
      checkKey: async () => 'ok',
    }
    render(client)
    type('Hỏi')
    await click(button('Gửi')!)
    expect(container.textContent).toContain('hết hạn mức')
    expect(container.textContent).not.toContain('AI không trả lời câu này')
  })
})
