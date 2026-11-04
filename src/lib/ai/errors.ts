import type { AiCallTrace, AiErrorKind } from './types'

export class AiError extends Error {
  constructor(
    public kind: AiErrorKind,
    public trace: AiCallTrace | null,
  ) {
    super(AI_ERROR_MESSAGES[kind])
    this.name = 'AiError'
  }
}

export function classifyStatus(status: number): AiErrorKind {
  if (status === 400 || status === 401 || status === 403) return 'invalid'
  if (status === 429) return 'quota'
  return 'unknown'
}

/** Phân loại lỗi của streamGenerateContent: 400 chỉ là "key sai" khi Google báo API_KEY_INVALID */
export function classifyAskError(status: number, errorBody: unknown): AiErrorKind {
  if (status === 401 || status === 403) return 'invalid'
  if (status === 429) return 'quota'
  if (status === 400) {
    const details = (errorBody as { error?: { details?: { reason?: unknown }[] } } | null)?.error?.details
    if (Array.isArray(details) && details.some((d) => d?.reason === 'API_KEY_INVALID')) return 'invalid'
  }
  return 'unknown'
}

export const AI_ERROR_MESSAGES: Record<AiErrorKind, string> = {
  invalid: 'Key không đúng hoặc chưa được phép dùng. Vào Cài đặt AI để kiểm tra lại key.',
  quota: 'Đã hết hạn mức dùng AI lúc này. Hãy thử lại sau ít phút.',
  network: 'Không kết nối được tới Google. Kiểm tra mạng rồi thử lại.',
  unknown: 'Google báo lỗi không rõ nguyên nhân. Hãy thử lại sau.',
}

/** Giải thích mã trạng thái HTTP bằng tiếng Việt, dùng trong "Xem bên trong" */
export function explainStatus(status: number | null): string {
  if (status === null) return 'Không nhận được phản hồi: có thể do mạng bị ngắt.'
  if (status >= 200 && status < 300) return 'Yêu cầu thành công: Google đã nhận và trả lời.'
  if (status === 400) return 'Yêu cầu hoặc key không hợp lệ.'
  if (status === 401 || status === 403) return 'Không có quyền: key sai hoặc chưa được phép dùng.'
  if (status === 429) return 'Quá hạn mức: gửi quá nhiều hoặc đã dùng hết lượt, hãy thử lại sau.'
  if (status >= 500) return 'Lỗi từ phía Google, không phải do bạn.'
  return 'Google trả về một mã trạng thái không quen thuộc.'
}
