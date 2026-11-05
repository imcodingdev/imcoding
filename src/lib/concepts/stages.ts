export const STAGES = [
  { id: 1, title: 'Trước khi giao AI sửa code', description: 'Giữ khóa bí mật, có mốc lưu để quay lại, biết code nào chạy ở đâu.', action: 'giao AI sửa code' },
  { id: 2, title: 'Trước khi nhận tính năng AI viết', description: 'Đọc hiểu luồng dữ liệu và tự kiểm tra kết quả AI làm.', action: 'nhận tính năng AI viết' },
  { id: 3, title: 'Trước khi mở app cho người dùng thật', description: 'Đăng nhập, phân quyền, môi trường thật và sao lưu.', action: 'mở app cho người dùng thật' },
  { id: 4, title: 'Khi vận hành', description: 'Theo dõi, sửa lỗi và cân nhắc khi app đã có người dùng.', action: 'vận hành app' },
] as const

export type Stage = (typeof STAGES)[number]['id']
