---
id: server-code
title: Code chạy trên máy chủ (Server Code)
group: backend
prerequisites: [client-server]
priority: 1
stage: 1
signals:
  - "'use server'"
  - "import 'server-only'"
  - "app/api/**/route.ts"
  - "export default async function"
  - "lib/db.ts"
---

## Giải thích đời thường

Một cửa hàng có hai khu: **khu bán hàng** khách đi lại tự do, và **khu hậu cần** phía sau gồm kho, két tiền, sổ sách, điện thoại gọi nhà cung cấp. Khách chỉ thấy kết quả ("còn hàng", "đã thanh toán"), không bao giờ thấy sổ kho hay mật mã két.

**Code chạy trên máy chủ** là khu hậu cần của ứng dụng. Nó được phép làm những việc nhạy cảm: đọc và ghi database, dùng khóa bí mật để gọi dịch vụ thanh toán hay AI, kiểm tra quyền. Người dùng không tải được đoạn code này về máy; họ chỉ nhận về kết quả.

Trong Next.js, ranh giới khá dễ lẫn vì code hai khu nằm chung một dự án, thậm chí chung thư mục `app/`. Quy tắc chung: file **không** có `'use client'` ở đầu mặc định chạy trên máy chủ, trừ khi nó được import từ một file `'use client'`; file `route.ts` luôn chạy trên máy chủ; hàm có `'use server'` là hàm máy chủ mà trình duyệt được phép gọi tới. Việc của bạn khi đọc code là biết mỗi file đang ở khu nào.

## Trong code trông như thế nào

Một trang không có `'use client'` là Server Component: nó đọc database ngay trên máy chủ rồi gửi HTML về trình duyệt.

```tsx
import { db } from '@/lib/db'

export default async function OrdersPage() {
  const orders = await db.order.findMany({ take: 20, include: { customer: true } })
  return (
    <ul>
      {orders.map((o) => <li key={o.id}>{o.customer.name}: {o.total} đ</li>)}
    </ul>
  )
}
```

Đánh dấu file chỉ được dùng ở máy chủ, để lỡ bị import vào phía trình duyệt thì báo lỗi ngay khi build:

```ts
// lib/db.ts
import 'server-only'
import { PrismaClient } from '@prisma/client'

export const db = new PrismaClient()
```

## Hay gặp lỗi gì

- **Thêm `'use client'` vào file đang đọc database.** AI làm vậy để sửa một lỗi giao diện, kéo theo cả code hậu cần sang phía trình duyệt. Cách nhận ra: lỗi kiểu "Module not found: Can't resolve 'fs'", hoặc biến môi trường bí mật bỗng ra `undefined`.
- **Hiểu sai `'use server'`.** Dòng này không có nghĩa "file này an toàn, chạy kín". Nó biến hàm thành một cửa mà trình duyệt gọi tới được, tức là ai cũng gọi được. Cách nhận ra: hàm `'use server'` xóa hay sửa dữ liệu mà không kiểm tra người gọi đã đăng nhập chưa.
- **Gửi thừa dữ liệu sang trình duyệt.** Máy chủ truyền nguyên bản ghi khách hàng (kể cả số điện thoại, ghi chú nội bộ) vào một component `'use client'`. Cách nhận ra: mở tab Network hoặc View Source thấy những trường không hiển thị trên màn hình.

## Tự kiểm tra

### Trong thư mục `app/` của bạn, file `page.tsx` nào đang đọc database trực tiếp?

Tìm các file `page.tsx` không có `'use client'` mà có `await db.` hoặc `prisma.` hoặc `supabase.from(`. Đó là Server Component chạy trên máy chủ.

### Bạn thấy một hàm `deleteOrder` có `'use server'`. Câu hỏi đầu tiên cần đặt ra là gì?

"Hàm này có kiểm tra người gọi là ai và có quyền xóa đơn này không?" Vì trình duyệt nào cũng gọi được hàm đó.
