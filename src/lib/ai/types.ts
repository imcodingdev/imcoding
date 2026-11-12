export type AiErrorKind = 'invalid' | 'quota' | 'network' | 'unknown'
export type KeyCheck = 'ok' | AiErrorKind
export interface ChatTurn {
  role: 'user' | 'model'
  text: string
}
export interface LessonContext {
  title: string
  plain: string
  inCode: string
  pitfalls: string
}
export interface AskRequest {
  apiKey: string
  lesson: LessonContext
  systemPrompt?: string
  history: ChatTurn[]
  signal?: AbortSignal
}
export interface AiCallTrace {
  method: 'POST'
  url: string
  headers: Record<string, string> // key đã che
  body: unknown // JSON đã gửi, systemInstruction rút gọn
  status: number | null // null khi lỗi mạng
  durationMs: number
  chunkCount: number
  lastChunk: unknown | null
}
export interface AiClient {
  /** Gọi onText với từng đoạn chữ; resolve trace khi xong; lỗi → throw AiError */
  ask(req: AskRequest, onText: (delta: string) => void): Promise<AiCallTrace>
  checkKey(apiKey: string): Promise<KeyCheck>
}
