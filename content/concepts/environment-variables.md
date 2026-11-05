---
id: environment-variables
title: Biến môi trường (Environment Variables)
group: backend
prerequisites: [server-code]
priority: 1
stage: 1
signals:
  - "process.env."
  - ".env.local"
  - ".env.example"
  - "NEXT_PUBLIC_"
---

## Giải thích đời thường

Bạn có hai chi nhánh dùng chung một **sổ quy trình vận hành**. Nhưng mỗi chi nhánh có số tài khoản ngân hàng, mật khẩu wifi, số điện thoại quản lý riêng. Bạn không in những thứ đó vào sổ quy trình; bạn ghi lên một tờ giấy riêng dán trong phòng quản lý của từng chi nhánh. Sổ quy trình chỉ ghi: "gọi số điện thoại quản lý".

**Biến môi trường** chính là tờ giấy riêng đó. Code (sổ quy trình) chỉ nói `process.env.DATABASE_URL`, còn giá trị thật nằm ngoài code. Trên máy của bạn, giá trị nằm trong file `.env.local`. Trên Vercel, bạn nhập trong phần Settings → Environment Variables của dự án. Nhờ vậy một bộ code chạy được ở nhiều nơi, mỗi nơi một cấu hình: máy bạn dùng database thử, bản thật dùng database thật.

Có một loại đặc biệt: biến có tên bắt đầu bằng `NEXT_PUBLIC_`. Next.js chép thẳng giá trị của nó vào code gửi xuống trình duyệt, tức là ai cũng đọc được. Chỉ dùng cho thông tin công khai.

## Trong code trông như thế nào

File `.env.local` ở thư mục gốc dự án (không được đưa lên Git):

```bash
DATABASE_URL="postgresql://user:matkhau@localhost:5432/shop"
OPENAI_API_KEY="sk-..."
NEXT_PUBLIC_SITE_NAME="Tiệm Cà Phê"
```

Code chỉ đọc tên biến, không chứa giá trị:

```ts
// chạy trên máy chủ: đọc được mọi biến
const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) throw new Error('Thiếu OPENAI_API_KEY')

// chạy ở đâu cũng được, vì có tiền tố NEXT_PUBLIC_
const siteName = process.env.NEXT_PUBLIC_SITE_NAME
```

## Hay gặp lỗi gì

- **Máy mình chạy, lên Vercel thì hỏng.** Bạn thêm biến vào `.env.local` nhưng quên nhập trên Vercel. Cách nhận ra: lỗi chỉ có ở bản đã deploy, log báo giá trị `undefined` hoặc "Thiếu ...".
- **Gắn `NEXT_PUBLIC_` cho khóa bí mật.** AI làm vậy khi gặp lỗi "biến ra `undefined` trong component `'use client'`". Lỗi biến mất nhưng khóa bị lộ cho mọi người. Cách nhận ra: có biến kiểu `NEXT_PUBLIC_..._KEY` hoặc `NEXT_PUBLIC_..._SECRET`.
- **Đổi biến `NEXT_PUBLIC_` trên Vercel mà web không đổi.** Loại biến này được chép vào code lúc build, nên phải deploy lại mới có giá trị mới. Cách nhận ra: đã sửa trong Settings nhưng trang vẫn hiện giá trị cũ.
- **Đưa file `.env` lên Git.** Cách nhận ra: `git status` hiện `.env.local`, hoặc file `.gitignore` không có dòng `.env*` (muốn giữ `.env.example` thì thêm dòng `!.env.example`).

## Tự kiểm tra

### Trong dự án của bạn, hãy tìm mọi chỗ có `process.env.` và liệt kê tên các biến đang được dùng.

Tìm chuỗi `process.env.` trong toàn dự án. Danh sách tên biến đó cũng chính là danh sách bạn phải nhập đủ trên Vercel; nên ghi vào file `.env.example` (chỉ tên, không có giá trị thật). Dòng `.env*` trong `.gitignore` chặn cả file này, nên thêm dòng `!.env.example` ngay bên dưới để vẫn đưa nó lên Git.

### Biến `NEXT_PUBLIC_STRIPE_SECRET_KEY` có vấn đề gì?

Tiền tố `NEXT_PUBLIC_` khiến khóa bí mật bị gửi xuống trình duyệt. Phải bỏ tiền tố, chỉ dùng khóa trong code máy chủ, và tạo khóa mới vì khóa cũ có thể đã lộ.
