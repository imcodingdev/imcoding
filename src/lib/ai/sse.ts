/** Ghép các chunk mạng thành sự kiện SSE; gọi onData với phần sau "data:" */
export function createSseParser(onData: (data: string) => void) {
  let buffer = ''

  function handleEvent(raw: string) {
    const data: string[] = []
    for (const line of raw.split('\n')) {
      if (!line.startsWith('data:')) continue
      const v = line.slice(5)
      data.push(v.startsWith(' ') ? v.slice(1) : v)
    }
    if (data.length > 0) onData(data.join('\n'))
  }

  return {
    push(chunk: string) {
      // \r\n bị cắt đôi giữa hai chunk vẫn ghép đúng vì buffer giữ nguyên phần dư
      buffer = (buffer + chunk).replace(/\r\n/g, '\n')
      let idx: number
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const raw = buffer.slice(0, idx)
        buffer = buffer.slice(idx + 2)
        handleEvent(raw)
      }
    },
    end() {
      const rest = buffer.replace(/\r\n/g, '\n').trim()
      buffer = ''
      if (rest) handleEvent(rest)
    },
  }
}
