---
id: server-code
title: Code chạy trên máy chủ (Server Code)
group: backend
prerequisites: [client-server]
priority: 1
stage: 1
format: 2
signals:
  - "'use server'"
  - "import 'server-only'"
  - "app/api/**/route.ts"
  - "export default async function"
  - "lib/db.ts"
---

## Nhắc lại

### Dấu hiệu nào ở đầu file Next.js cho biết file đó chạy ở trình duyệt (máy khách), và người dùng có thể làm gì với dữ liệu ở đó?

File có dòng `'use client'` ở đầu sẽ chạy trên trình duyệt. Mọi đoạn code, phép tính và dữ liệu gửi đi từ trình duyệt đều có thể bị người dùng xem và tự ý chỉnh sửa.

### Nếu đặt `console.log` trong file `app/api/orders/route.ts`, thông báo xuất hiện ở đâu?

Nó xuất hiện ở cửa sổ terminal chạy máy chủ (`npm run dev`) hoặc mục Logs trên Vercel, không hiện ở tab Console trên trình duyệt của khách.

## Đoán trước

Trang quản lý đơn hàng `app/orders/page.tsx` đang kết nối trực tiếp vào cơ sở dữ liệu để lấy danh sách đơn hàng hiển thị lên màn hình. Hôm nay, bạn nhờ AI thêm nút bấm bật cửa sổ nhỏ ngay trong file đó. Để dùng tính năng bấm nút của React, AI thêm dòng `'use client'` vào đầu file `app/orders/page.tsx`. Lập tức ứng dụng sập với lỗi không tìm thấy thư viện hệ thống (`Can't resolve 'fs'` / `'net'`) hoặc không kết nối được cơ sở dữ liệu. Vì sao chỉ thêm một dòng `'use client'` mà code đang chạy tốt lại hỏng?

### Đáp án

Ban đầu `app/orders/page.tsx` không có `'use client'`, nên Next.js mặc định chạy nó trên máy chủ (Server Component) — nơi được phép kết nối cơ sở dữ liệu và đọc khóa bí mật. Khi thêm `'use client'`, toàn bộ file bị đẩy sang chạy ở trình duyệt. Trình duyệt không có quyền truy cập hệ thống máy chủ hay biến môi trường bí mật của cơ sở dữ liệu, dẫn đến sập ứng dụng.

## Ví dụ mẫu

Cửa hàng có hai khu: **khu trưng bày** cho khách đi lại tự do, và **khu hậu cần** gồm kho hàng, két sắt, sổ kế toán. Khách chỉ nhận kết quả mang ra, không được bước vào kho.

**Code chạy trên máy chủ (Server Code)** là khu hậu cần. Trong Next.js App Router, bạn nhận diện qua 3 quy tắc:
1. **Server Component:** File `page.tsx`, `layout.tsx` **không** có `'use client'` ở đầu thì mặc định chạy trên máy chủ. Trình duyệt chỉ nhận kết quả hiển thị.
2. **File riêng cho máy chủ (`server-only`):** File kết nối cơ sở dữ liệu (như `lib/db.ts`) nên có `import 'server-only'` ở đầu; nếu AI vô tình kéo sang khu trình duyệt, máy sẽ báo lỗi ngay.
3. **Server Action (`'use server'`):** Hàm có `'use server'` là "cửa giao dịch" đặt ở máy chủ nhưng cho phép trình duyệt gọi thẳng vào (như đường dẫn API mở ra ngoài).

```ts
// File: lib/db.ts — Khu hậu cần kết nối cơ sở dữ liệu
import 'server-only' // Chặn mọi file 'use client' import file này

export async function getOrdersFromDb() {
  const secretKey = process.env.DATABASE_SECRET_KEY // giả lập: sk-proj-XXXX...
  return [{ id: '101', customerName: 'An', total: 250000, internalNote: 'Khách VIP' }]
}
```

```tsx
// File: app/orders/page.tsx — Không có 'use client' => Chạy trên máy chủ
import { getOrdersFromDb } from '@/lib/db'

export default async function OrdersPage() {
  const orders = await getOrdersFromDb()
  // Chỉ gửi thông tin khách được phép thấy; không truyền nguyên cục chứa internalNote sang Client Component vì ___
  return (
    <ul>
      {orders.map((o) => <li key={o.id}>{o.customerName}: {o.total} đ</li>)}
    </ul>
  )
}
```


## Tìm trong project của bạn

Mở dự án và rà soát khu hậu cần theo 4 bước:

1. Tìm trong `app/` các file `page.tsx` **không** có `'use client'` ở đầu, xem file nào có `async function` hoặc gọi cơ sở dữ liệu (`db.`, `prisma.`, `supabase.`).
2. Tìm toàn dự án từ khóa `'use server'` để liệt kê các hàm máy chủ đang mở cửa cho trình duyệt gọi.
3. Tìm file khởi tạo cơ sở dữ liệu (`lib/db.ts`, `lib/supabase.ts`) xem có `import 'server-only'` chưa.
4. Ghi lại kết quả:
   - **Một file `page.tsx` chạy trên máy chủ (Server Component):** `____________________`
   - **Một hàm hoặc file có `'use server'`:** `____________________`
   - **Hàm `'use server'` đó có kiểm tra người gọi đã đăng nhập chưa:** `Có / Không`
   - **File kết nối database trong `lib/` đã có `import 'server-only'` chưa:** `Có / Không`

## Tự giải thích

### Vì sao dòng `'use server'` KHÔNG có nghĩa là "đánh dấu để code chạy kín đáo, người ngoài không đụng vào được"?

`'use server'` biến hàm đó thành điểm tiếp nhận yêu cầu công khai mà bất kỳ trình duyệt nào cũng gửi lệnh gọi tới được. Để giữ một file chỉ chạy nội bộ trên máy chủ và cấm trình duyệt đụng vào, công cụ đúng là `import 'server-only'`.

### Khi thấy hàm `deleteUser(userId)` có dòng `'use server'`, câu hỏi đầu tiên cần kiểm tra bên trong hàm là gì?

Phải kiểm tra ngay: *"Đầu hàm có xác minh người gửi lệnh là ai và có quyền xóa tài khoản đó không?"*. Vì hàm `'use server'` có thể bị gọi từ bất kỳ trình duyệt nào với `userId` bất kỳ, thiếu kiểm tra quyền sẽ khiến người lạ xóa được tài khoản người khác.

### Điều gì xảy ra nếu Server Component lấy toàn bộ thông tin người dùng (`SELECT *`) rồi truyền nguyên đối tượng `user` xuống Component có `'use client'` chỉ để hiện tên?

Dù màn hình chỉ hiện tên, máy chủ vẫn đóng gói **toàn bộ** trường trong `user` (số điện thoại, địa chỉ, ghi chú ẩn, mật khẩu mã hóa) gửi về trình duyệt. Người dùng mở công cụ kiểm tra mạng là thấy hết.

## Kiểm tra không dùng AI

### Tình huống: File `app/actions/refund.ts` có `'use server'` ở đầu. Bên trong, hàm `export async function refundOrder(orderId: string)` hoàn tiền ngay cho đơn `orderId` mà không kiểm tra đăng nhập, vì AI giải thích: *"Nút Hoàn tiền chỉ đặt trong trang `/admin`, khách thường không nhìn thấy nút"*. Hãy giải thích vì sao AI sai và nêu cách sửa kèm lý do.

#### Đáp án

- **Vì sao AI sai:** Khi có `'use server'`, Next.js tạo đường dẫn tiếp nhận lệnh trên máy chủ cho hàm `refundOrder`. Dù nút bấm nằm ở `/admin`, hàm này vẫn mở cửa cho mọi yêu cầu từ Internet. Kẻ tấn công không cần vào `/admin` bấm nút, chỉ cần tự gửi yêu cầu mạng kèm `orderId` bất kỳ thẳng tới hàm là lệnh hoàn tiền sẽ chạy.
- **Cách sửa và lý do:** Phải kiểm tra phiên đăng nhập và quyền quản trị (admin) ngay đầu hàm `refundOrder` trên máy chủ. Nếu không phải admin hợp lệ thì từ chối ngay trước khi chạm vào database hay dịch vụ thanh toán, vì máy chủ không được tin rằng yêu cầu chỉ xuất phát từ nút bấm trên giao diện.

## Lỗi suy luận hay gặp

### "Thấy chữ `'use server'` ở đầu file là yên tâm file đó được bảo mật tuyệt đối"

- **Vì sao sai:** `'use server'` không phải lệnh khóa cửa mà là lệnh **mở cửa** cho máy khách gọi hàm máy chủ từ xa. Hàm `'use server'` thiếu kiểm tra quyền và dữ liệu đầu vào cũng nguy hiểm như quầy thu ngân không người canh.
- **Cách sửa:** Coi mọi hàm `'use server'` như đường dẫn API công khai (`route.ts`): luôn kiểm tra người gọi là ai và kiểm tra dữ liệu truyền vào.

### "AI bảo thêm thư viện bảo mật mới tên rất kêu vào máy chủ là xong, cứ chạy `npm install` theo lời nó"

- **Vì sao sai:** AI có thể bịa ra tên thư viện không tồn tại. Tỷ lệ LLM bịa tên package đạt trung bình ít nhất 5,2% với model thương mại và 21,7% với model mã nguồn mở (Spracklen et al., USENIX Security 2025). Kẻ xấu thường đăng ký trước các tên package bịa đặt phổ biến kèm mã độc; cài vào máy chủ sẽ làm lộ toàn bộ khu hậu cần và khóa bí mật.
- **Cách sửa:** Trước khi cài thư viện lạ do AI đề xuất, hãy kiểm tra xem thư viện có thật, đúng tên chính chủ và có nhiều người dùng uy tín không.

### "File không có `'use client'` thì chắc chắn không bao giờ chạy ở trình duyệt"

- **Vì sao sai:** Một file tiện ích không ghi `'use client'`, nhưng nếu bị một file `'use client'` khác gọi vào (`import`), Next.js vẫn kéo file đó sang chạy ở trình duyệt.
- **Cách sửa:** Với các file hậu cần nhạy cảm (chứa logic database, đọc khóa bí mật), hãy thêm `import 'server-only'` ở đầu file để khóa cứng ở máy chủ.
