export const quizSection = `## Trắc nghiệm

### AI thêm biến công khai. Rủi ro nào?

\`\`\`bash
NEXT_PUBLIC_DEMO_KEY=demo-only
## Đây là code
- [x] Không phải phương án
\`\`\`

- [ ] Chỉ server đọc được
- [x] Trình duyệt đọc được
- [ ] Framework tự chặn

**Giải thích:** Tiền tố công khai đưa giá trị xuống trình duyệt.

### AI gửi khóa thử trong phản hồi. Cần làm gì?

- [x] Bỏ khóa khỏi phản hồi
- [ ] Giấu ô nhập
- [ ] Đổi màu nút

**Giải thích:** Phản hồi vẫn đọc được dù giao diện che đi.

### AI đề nghị commit khóa thử. Chọn cách nào?

- [ ] Commit mọi khóa
- [ ] Chỉ đổi tên file
- [x] Dùng cấu hình môi trường

**Giải thích:** Không lưu khóa trong lịch sử Git.
`

export const exerciseSection = `## Bài tập thực hành

Rà soát khóa giả trong nhánh thử, không đụng dữ liệu thật.

### Việc cần làm

1. Tạo nhánh thử.
2. Tìm tên biến công khai.
3. Ghi lại vị trí cần sửa.

### Kết quả đúng

Danh sách chỉ có tên biến và vị trí, không có giá trị khóa.

### Nhờ AI rà lại

\`\`\`text
Rà lại danh sách trên nhánh thử. Chỉ báo cáo, không tự sửa.
\`\`\`
`

export function addLessonSections(raw: string, quiz = quizSection, exercise = exerciseSection) {
  return raw.replace('## Kiểm tra không dùng AI', `${quiz}\n## Kiểm tra không dùng AI`) + `\n${exercise}`
}
