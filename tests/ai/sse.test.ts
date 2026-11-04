import { describe, it, expect } from 'vitest'
import { createSseParser } from '@/lib/ai/sse'

function setup() {
  const got: string[] = []
  return { got, p: createSseParser((d) => got.push(d)) }
}

describe('createSseParser', () => {
  it('đọc một sự kiện', () => {
    const { got, p } = setup()
    p.push('data: {"a":1}\n\n')
    expect(got).toEqual(['{"a":1}'])
  })
  it('sự kiện bị cắt làm 3 lần push', () => {
    const { got, p } = setup()
    p.push('da')
    p.push('ta: {"a"')
    p.push(':1}\n\n')
    expect(got).toEqual(['{"a":1}'])
  })
  it('dùng \\r\\n\\r\\n', () => {
    const { got, p } = setup()
    p.push('data: {"a":1}\r\n\r\ndata: {"a":2}\r\n\r\n')
    expect(got).toEqual(['{"a":1}', '{"a":2}'])
  })
  it('\\r\\n bị cắt giữa \\r và \\n', () => {
    const { got, p } = setup()
    p.push('data: x\r')
    p.push('\n\r')
    p.push('\n')
    expect(got).toEqual(['x'])
  })
  it('bỏ qua dòng không phải data:', () => {
    const { got, p } = setup()
    p.push(': ping\nevent: msg\ndata: hi\n\n')
    expect(got).toEqual(['hi'])
  })
  it('end() xử lý phần dư không có dòng trống cuối', () => {
    const { got, p } = setup()
    p.push('data: {"a":3}')
    expect(got).toEqual([])
    p.end()
    expect(got).toEqual(['{"a":3}'])
  })
})
