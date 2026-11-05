---
id: secrets
title: Khóa bí mật (Secrets)
group: auth
prerequisites: [environment-variables]
priority: 1
stage: 1
signals:
  - "sk-"
  - "API_KEY"
  - "SECRET"
  - ".env"
  - "NEXT_PUBLIC_"
---

## Giải thích đời thường

Cửa hàng của bạn có những thứ mà ai cầm được là làm được việc nhân danh bạn: **chìa khóa két**, **mã PIN thẻ ngân hàng**, **con dấu công ty**. Bạn không dán mã PIN lên quầy, không gửi ảnh chìa khóa vào nhóm chat, và nếu nghi bị lộ thì đổi khóa ngay chứ không chỉ "giấu kỹ hơn".

Trong phần mềm, **secret (khóa bí mật)** là những chuỗi ký tự có quyền như vậy: API key của OpenAI hay Anthropic (ai có là dùng AI tính tiền vào tài khoản bạn), khóa bí mật của cổng thanh toán, mật khẩu database, chuỗi bí mật dùng để ký phiên đăng nhập.

Ba nguyên tắc: secret **không nằm trong code** (để trong biến môi trường), **không lên Git** (file `.env*` phải bị bỏ qua), và **không xuống trình duyệt** (chỉ dùng trong code máy chủ, không gắn `NEXT_PUBLIC_`). Khi một secret đã lộ, việc đúng là vào trang quản lý của nhà cung cấp, **thu hồi khóa cũ và tạo khóa mới**. Xóa dòng code chứa khóa là chưa đủ, vì lịch sử Git và các bản sao vẫn còn giữ nó.

## Trong code trông như thế nào

Sai: khóa viết thẳng vào code, AI đôi khi làm vậy khi bạn dán khóa vào khung chat.

```ts
const openai = new OpenAI({ apiKey: 'sk-proj-AbC123...' }) // ĐỪNG làm thế này
```

Đúng **cách giữ khóa**: code chỉ đọc tên biến, và chỉ dùng trong code máy chủ (ví dụ `app/api/chat/route.ts`).

```ts
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  // CÒN THIẾU: kiểm tra đăng nhập và giới hạn số lần gọi mỗi người
  const { question } = await req.json()
  const answer = await openai.responses.create({ model: 'gpt-5-mini', input: question })
  return Response.json({ text: answer.output_text })
}
```

Khóa đã an toàn, nhưng endpoint thì chưa: ai biết địa chỉ `/api/chat` cũng gọi được và tiêu tiền AI của bạn, dù không thấy khóa. Phải thêm kiểm tra đăng nhập (bài "Xác thực đăng nhập") và giới hạn số lần gọi trước khi đưa lên mạng.

## Hay gặp lỗi gì

- **Khóa nằm trong code.** Cách nhận ra: tìm trong dự án các chuỗi như `sk-`, `sk_live_`, `apiKey: '`, `password: '` mà theo sau là một dãy ký tự dài.
- **Đã đẩy `.env` lên GitHub rồi xóa đi.** Lịch sử Git vẫn giữ file đó; robot dò khóa trên GitHub tìm ra rất nhanh. Cách nhận ra: `git log --all -- .env.local` có kết quả. Cách xử lý: tạo khóa mới, thu hồi khóa cũ.
- **Gắn `NEXT_PUBLIC_` cho secret.** Khóa bị chép vào code gửi xuống mọi trình duyệt. Cách nhận ra: tên biến vừa có `NEXT_PUBLIC_` vừa có `KEY`, `SECRET` hay `TOKEN`.
- **Khóa lọt vào log hoặc ảnh chụp màn hình.** `console.log(process.env)` in toàn bộ khóa ra log của Vercel. Cách nhận ra: có dòng log in cả `process.env` hoặc in cấu hình đầy đủ.

## Tự kiểm tra

### Tìm trong dự án của bạn chuỗi `sk-` và `apiKey`. Có khóa nào viết thẳng trong code không?

Mọi kết quả nằm ngoài file `.env*` mà chứa một dãy ký tự dài là khóa thật bị lộ trong code. Chuyển nó sang biến môi trường rồi tạo khóa mới.

### Bạn lỡ dán API key vào một tin nhắn công khai. Việc đầu tiên cần làm là gì?

Vào trang quản lý của nhà cung cấp đó, thu hồi (revoke) khóa cũ và tạo khóa mới, rồi cập nhật khóa mới vào `.env.local` và trên Vercel. Xóa tin nhắn là chưa đủ.
