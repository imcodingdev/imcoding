export const PRACTICE_STEPS: readonly {
  title: string
  how: string
  why: string
  conceptId: string
}[] = [
  {
    title: 'Vào Google AI Studio',
    how: 'Vào aistudio.google.com, đăng nhập bằng tài khoản Google của bạn.',
    why: 'Mỗi dịch vụ API cần biết ai đang dùng để tính tiền.',
    conceptId: 'api-endpoint',
  },
  {
    title: 'Tạo API key',
    how: 'Bấm Get API key để tạo key.',
    why: 'Key giống chìa khoá nhà: ai cầm là dùng được và bạn trả tiền, nên không dán lên mạng hay gửi cho người khác.',
    conceptId: 'secrets',
  },
  {
    title: 'Dán key vào ô nhập',
    how: 'Dán key vào ô bên dưới.',
    why: 'Key chỉ được lưu trên trình duyệt này. Ở app thật thường đặt key trong biến môi trường trên máy chủ.',
    conceptId: 'environment-variables',
  },
  {
    title: 'Lưu và kiểm tra',
    how: 'Bấm "Lưu và kiểm tra".',
    why: 'App gửi một HTTP request nhỏ tới Google; Google trả lời "OK" nghĩa là key đúng.',
    conceptId: 'http-request-response',
  },
]
