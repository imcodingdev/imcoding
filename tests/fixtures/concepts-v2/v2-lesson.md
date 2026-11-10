---
id: v2-lesson
title: Kiểm tra khóa bí mật (bài mẫu v2)
group: auth
prerequisites: [environment-variables]
priority: 2
stage: 1
format: 2
signals: [NEXT_PUBLIC_, secret]
---

## Nhắc lại

### Biến môi trường được dùng ở đâu?

Server đọc cấu hình từ môi trường chạy.

## Đoán trước

Một khóa được đặt tên NEXT_PUBLIC_DEMO_KEY. Trình duyệt có thể đọc khóa này không?

### Đáp án

Có, tiền tố NEXT_PUBLIC_ đưa giá trị vào mã gửi tới trình duyệt.

## Ví dụ mẫu

Khóa bí mật giống chìa khóa kho, chỉ người phục vụ ở server cần giữ nó.

```ts
const key = process.env.DEMO_KEY // Chỉ đọc trên server; không đưa key vào phản hồi.
```

## Tìm trong project của bạn

1. Tìm NEXT_PUBLIC_ trong file cấu hình và ghi tên biến: ___
2. Tìm nơi đọc biến trong app/api và ghi tên file: ___

## Tự giải thích

### Vì sao không đưa khóa vào phản hồi?

Trình duyệt nhận phản hồi nên người dùng có thể đọc khóa.

### Bỏ tiền tố công khai thì sao?

Biến chỉ có trên server; component chạy trên trình duyệt đọc được undefined.

## Trắc nghiệm

### AI thêm biến công khai. Rủi ro nào?

```bash
NEXT_PUBLIC_DEMO_KEY=demo-only
## Đây là code
- [x] Không phải phương án
```

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

## Kiểm tra không dùng AI

### Đồng đội đã commit khóa giả sk-proj-XXXX vào Git. Bạn xử lý rủi ro thế nào và vì sao?

#### Đáp án

Thu hồi khóa đã lộ, tạo khóa thay thế và kiểm tra lịch sử Git; chỉ xóa dòng hiện tại không xóa lịch sử.

## Lỗi suy luận hay gặp

### Giấu ô nhập là đủ bảo vệ khóa

Người dùng vẫn đọc được request; giữ khóa ở server.

### Repo riêng thì có thể commit khóa

Quyền truy cập có thể thay đổi; dùng biến môi trường và không commit khóa.

## Bài tập thực hành

Rà soát khóa giả trong nhánh thử, không đụng dữ liệu thật.

### Việc cần làm

1. Tạo nhánh thử.
2. Tìm tên biến công khai.
3. Ghi lại vị trí cần sửa.

### Kết quả đúng

Danh sách chỉ có tên biến và vị trí, không có giá trị khóa.

### Nhờ AI rà lại

```text
Rà lại danh sách trên nhánh thử. Chỉ báo cáo, không tự sửa.
```
