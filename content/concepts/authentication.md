---
id: authentication
title: Xác thực đăng nhập (Authentication)
group: auth
prerequisites: [api-endpoint, database-table]
priority: 1
signals:
  - "auth()"
  - "next-auth"
  - "supabase.auth"
  - "proxy.ts"
  - "middleware.ts"
  - "bcrypt"
---

## Giải thích đời thường

Một kho hàng chỉ cho nhân viên vào. Ngày đầu, bạn trình căn cước cho bảo vệ, bảo vệ đối chiếu danh sách rồi phát cho bạn một **thẻ nhân viên** có hạn dùng. Những ngày sau bạn chỉ cần quẹt thẻ, không phải trình căn cước nữa. Mất thẻ thì báo khóa thẻ.

**Xác thực (authentication)** là việc trả lời câu hỏi "**bạn là ai?**". Khi đăng nhập, người dùng đưa email và mật khẩu (hoặc bấm "Đăng nhập bằng Google"). Máy chủ đối chiếu với bảng người dùng trong database, đúng thì cấp một "thẻ" gọi là **phiên đăng nhập (session)**, thường lưu trong cookie. Mỗi yêu cầu sau đó trình duyệt tự gửi kèm thẻ, máy chủ nhìn thẻ để biết ai đang gọi.

Lưu ý hai điều. Thứ nhất, xác thực khác với phân quyền: biết bạn là nhân viên chưa có nghĩa bạn được vào phòng kế toán. Thứ hai, việc kiểm tra thẻ phải làm ở **máy chủ**, ở từng endpoint và từng hàm `'use server'`. Chỉ ẩn nút trên giao diện thì giống dán biển "cấm vào" mà không có bảo vệ.

## Trong code trông như thế nào

AI hay dùng thư viện Auth.js (tên cũ NextAuth), Clerk hoặc Supabase Auth. Với Auth.js, endpoint kiểm tra thẻ như sau:

```ts
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth() // session.user.id chỉ có khi đã cấu hình callback session trong Auth.js
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
  }
  // chỉ lấy đơn của chính người đang đăng nhập
  const orders = await db.order.findMany({ where: { userId: session.user.id } })
  return NextResponse.json(orders)
}
```

Để ý: `userId` lấy từ phiên đăng nhập, không lấy từ dữ liệu trình duyệt gửi lên.

## Hay gặp lỗi gì

- **Chỉ chặn ở giao diện.** Trang có `if (!user) router.push('/login')` nhưng endpoint phía sau không kiểm tra. Cách nhận ra: gọi thẳng địa chỉ `/api/...` trong cửa sổ ẩn danh vẫn ra dữ liệu.
- **Tin `userId` do trình duyệt gửi.** Endpoint đọc `userId` từ `req.json()` hoặc từ URL rồi lấy dữ liệu theo đó; ai sửa con số là xem được dữ liệu người khác. Cách nhận ra: không có dòng nào lấy người dùng từ `auth()` hay phiên đăng nhập.
- **Lưu mật khẩu nguyên văn.** Bảng người dùng có cột `password` chứa đúng chữ người dùng gõ. Cách nhận ra: mở database đọc được mật khẩu. Phải băm (ví dụ `bcrypt`) hoặc để dịch vụ đăng nhập lo.
- **Chỉ kiểm tra ở `proxy.ts` (tên cũ `middleware.ts`).** File này tiện để chuyển hướng người chưa đăng nhập, nhưng không nên là lớp bảo vệ duy nhất. Cách nhận ra: endpoint và hàm `'use server'` không tự gọi `auth()`.

## Tự kiểm tra

### Dự án của bạn đăng nhập bằng gì?

Xem `package.json`: có `next-auth`, `@clerk/nextjs`, `@supabase/ssr` hay thư viện nào khác. Rồi tìm file cấu hình tương ứng, ví dụ `auth.ts` ở thư mục gốc.

### Chọn một endpoint trả dữ liệu riêng của người dùng. Nó lấy "người đang gọi là ai" từ đâu?

Đúng là từ phiên đăng nhập trên máy chủ (ví dụ `await auth()`). Nếu lấy từ `req.json()`, tham số URL hay `localStorage` thì đó là lỗ hổng cần sửa.
