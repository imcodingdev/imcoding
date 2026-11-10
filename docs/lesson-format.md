# Định dạng bài học v2 (hợp đồng chung cho code và nội dung)

Căn cứ: research 06 đã duyệt. Bài 30 phút gồm 8 bước. Bước 7 (phản hồi) và bước 8 (ghi lỗi, đặt lịch ôn) là hành vi giao diện, nội dung chỉ cần cung cấp phần "Lỗi suy luận hay gặp".

## Frontmatter

```yaml
---
id: secrets                # = tên file, giữ nguyên như v1
title: Khóa bí mật (Secrets)
group: auth                # giữ các nhóm hiện có
prerequisites: [environment-variables]   # đúng tên trường này, KHÔNG dùng "prereqs"
priority: 1                # giữ để tương thích
stage: 1                   # MỚI, bắt buộc với v2: 1|2|3|4 (chặng rủi ro)
format: 2                  # MỚI: có trường này = bài v2; không có = bài v1 (4 mục cũ)
signals: ["sk-", ".env"]   # giữ như v1, ít nhất 1
---
```

## Các mục H2 của bài v2 (đúng tên, đúng thứ tự)

| # | Tiêu đề H2 | Bắt buộc | Nội dung | Phút |
|---|---|---|---|---|
| 1 | `## Nhắc lại` | Bắt buộc nếu `prerequisites` không rỗng; KHÔNG được có nếu rỗng | 1–2 câu hỏi `###`, mỗi câu kèm đáp án ngắn bên dưới. Hỏi lại bài học trước, không nhìn tài liệu. | 3 |
| 2 | `## Đoán trước` | Bắt buộc | Một tình huống sự cố ngắn (đoạn văn), kết thúc bằng câu hỏi. Sau đó đúng một `### Đáp án`. | 2 |
| 3 | `## Ví dụ mẫu` | Bắt buộc | Giải thích đời thường ngắn + 1–2 đoạn code mẫu (thường là cặp SAI rồi ĐÚNG), chú thích đặt ngay cạnh dòng quan trọng. Có thể có 1 chỗ trống `___` để người học tự điền lý do. | 5 |
| 4 | `## Tìm trong project của bạn` | Bắt buộc | Danh sách có thứ tự các bước tìm (từ khóa cần tìm, file thường gặp) và các ô cần ghi lại. | 7 |
| 5 | `## Tự giải thích` | Bắt buộc | 2–3 câu hỏi `###` dạng "vì sao / bỏ đi thì sao", mỗi câu kèm đáp án mẫu. | 4 |
| 6 | `## Kiểm tra không dùng AI` | Bắt buộc | Đúng 1 `### ` tình huống MỚI (khác ví dụ mẫu), yêu cầu nêu rủi ro/cách xử lý kèm lý do. Giữa `###` và `#### Đáp án` được có đoạn mô tả hoặc code của tình huống; đáp án nằm trong `#### Đáp án`. | 5 |
| 7 | `## Lỗi suy luận hay gặp` | Bắt buộc | 2–4 mục `###` = một suy nghĩ sai thường gặp; nội dung = vì sao sai và cách sửa. | 3 |

Không mục H2 nào khác. Không mục nào rỗng. Code block được phép trong mọi mục; `##`/`###` bên trong code block không tính.

## Quy tắc nội dung
- Độ dài cả bài 900–2.800 âm tiết (đếm theo khoảng trắng, cả code). Không viết sẵn gợi ý/đáp án cho chỗ trống `___` ngay trong bài.
- Tiếng Việt dễ hiểu cho founder không làm dev. Tên kỹ thuật giữ tiếng Anh, giải thích lần đầu.
- Không dạy cú pháp; dạy đọc hiểu và kiểm tra code AI viết.
- Chính xác kỹ thuật, ví dụ dùng Next.js App Router / Supabase / Vercel là chính. Lưu ý đã biết: biến môi trường KHÔNG có tiền tố `NEXT_PUBLIC_` đọc trong component chạy trên trình duyệt sẽ là `undefined` (không lộ); lộ khóa xảy ra khi khóa được gắn `NEXT_PUBLIC_`, viết cứng vào code, hoặc commit lên Git.
- Ví dụ khóa phải là chuỗi giả rõ ràng (`sk-proj-XXXX...`), không trông như khóa thật.
- Số liệu thật chỉ dùng khi có nguồn (xem phần B research 06): GitGuardian 2025 ghi nhận 23.770.171 secret mới lộ trên GitHub công khai năm 2024.

## Bổ sung v2.1: Trắc nghiệm và Bài tập thực hành

Thứ tự đầy đủ các mục H2: Nhắc lại → Đoán trước → Ví dụ mẫu → Tìm trong project của bạn → Tự giải thích → **Trắc nghiệm** → Kiểm tra không dùng AI → Lỗi suy luận hay gặp → **Bài tập thực hành**.
Parser coi hai mục mới là tùy chọn (bài chưa có vẫn hợp lệ); nếu có thì phải đúng quy tắc dưới đây.

### `## Trắc nghiệm` (3 phút, chấm tự động trên trình duyệt)

- 3–5 câu, mỗi câu là một `###`.
- Dưới `###` được có đoạn mô tả hoặc code block của tình huống, rồi tới danh sách 3–4 phương án, mỗi phương án một dòng bắt đầu bằng `- [ ]` (sai) hoặc `- [x]` (đúng). Đúng MỘT phương án `[x]`.
- Sau danh sách là đoạn bắt đầu bằng `**Giải thích:**` (không rỗng): vì sao phương án đúng là đúng và vì sao phương án hay bị chọn nhầm là sai.
- Trong một bài có từ 3 câu trở lên, vị trí phương án đúng không được giống nhau ở mọi câu.

```markdown
## Trắc nghiệm

### AI vừa thêm dòng này vào `.env.local`. Điều gì xảy ra khi deploy?

```bash
NEXT_PUBLIC_STRIPE_SECRET_KEY="sk_live_XXXX"
```

- [ ] Không sao, vì file `.env.local` không lên Git
- [x] Khóa bị đóng gói vào JavaScript gửi xuống trình duyệt, ai cũng đọc được
- [ ] Next.js tự chặn vì tên biến có chữ SECRET

**Giải thích:** Tiền tố `NEXT_PUBLIC_` bảo Next.js chép giá trị vào code phía trình duyệt lúc build. Việc file không lên Git không liên quan; Next.js không đọc ý nghĩa của tên biến.
```

Quy tắc nội dung: ít nhất 2 câu mỗi bài phải dựa trên một đoạn code, log, cấu hình hoặc tình huống thật khi làm việc với công cụ AI (Cursor, Claude Code, Lovable...), không hỏi định nghĩa thuộc lòng. Phương án sai phải là hiểu lầm có thật, không phải phương án vô lý.

### `## Bài tập thực hành` (tùy chọn, làm thêm 10–15 phút, luôn là mục cuối)

Chỉ thêm khi khái niệm có một việc cụ thể, an toàn, kiểm chứng được trên project của người học.

- Mở đầu bằng 1–2 câu nêu mục tiêu.
- `### Việc cần làm`: danh sách có thứ tự 3–6 bước.
- `### Kết quả đúng`: làm sao biết mình đã làm đúng (không rỗng).
- Tùy chọn `### Nhờ AI rà lại`: đúng một code block chứa câu lệnh mẫu để người học dán cho công cụ AI của mình, yêu cầu AI **chỉ báo cáo, không tự sửa**.

An toàn: bài tập không được yêu cầu thao tác phá hủy hoặc trên dữ liệu thật (không xóa database, không `reset --hard`, không dán khóa thật vào chat). Dùng khóa thử, nhánh thử, bản preview.
