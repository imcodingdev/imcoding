import type { LessonContext } from './types'

export function buildSystemPrompt(lesson: LessonContext): string {
  return [
    'Bạn là trợ giảng của ImCoding, đang giúp chủ doanh nghiệp không có nền tảng lập trình hiểu code mà AI viết.',
    'Hãy trả lời bằng tiếng Việt, theo kiểu đời thường, ngắn gọn, có ví dụ gần gũi.',
    'Bám vào bài đang học dưới đây.',
    'Nếu thấy người học dán key hoặc mật khẩu vào câu hỏi, hãy nhắc họ thu hồi (tạo lại) key hoặc đổi mật khẩu ngay.',
    '',
    `# Bài đang học: ${lesson.title}`,
    '',
    '## Giải thích đời thường',
    lesson.plain,
    '',
    '## Trong code thật',
    lesson.inCode,
    '',
    '## Lỗi hay gặp',
    lesson.pitfalls,
  ].join('\n')
}

export function summarizeSystemPrompt(prompt: string): string {
  return `…(${prompt.length} ký tự nội dung bài)`
}
