export const COMMON_MISTAKES: readonly { mistake: string; lessonId: string }[] = [
  { mistake: 'Agent thêm cột vào bảng đang chạy "cho nhanh"', lessonId: 'business-rules' },
  { mistake: 'Khách bấm hai lần, bị trừ tiền hai lần', lessonId: 'idempotency-retries' },
  { mistake: 'Coupon còn một lượt mà hai người cùng dùng được', lessonId: 'concurrent-writes' },
  { mistake: 'Đã deploy mà vẫn thấy bản cũ', lessonId: 'debugging' },
  { mistake: 'Khách A nhìn thấy dữ liệu của khách B', lessonId: 'authorization' },
  { mistake: 'API key bị dán thẳng vào code', lessonId: 'secrets' },
  { mistake: 'AI báo "xong" nhưng chưa ai chạy thử', lessonId: 'done-evidence' },
  { mistake: 'Chạy script AI viết ngay trên dữ liệu thật', lessonId: 'python-scripts' },
]
