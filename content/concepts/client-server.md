---
id: client-server
title: Máy khách – máy chủ (Client–Server)
group: web
prerequisites: []
priority: 1
stage: 1
signals:
  - "'use client'"
  - "app/api/**/route.ts"
  - "fetch("
  - "localhost:3000"
---

## Giải thích đời thường

Hãy hình dung một quán cà phê. Khách ngồi ở bàn, xem thực đơn, gọi món. Quầy pha chế ở phía sau làm món, giữ công thức, két tiền và sổ sách. Khách không bước vào quầy; khách chỉ gửi yêu cầu và nhận lại món.

Ứng dụng web cũng chia làm hai phía như vậy. **Máy khách (client)** là trình duyệt trên điện thoại hay máy tính của người dùng: nó hiển thị giao diện và gửi yêu cầu. **Máy chủ (server)** là một máy tính khác, thường nằm ở Vercel hay một trung tâm dữ liệu: nó giữ dữ liệu, khóa bí mật và xử lý yêu cầu.

Điều quan trọng nhất: mọi thứ chạy ở máy khách thì người dùng **xem được và sửa được**, giống khách nhìn thấy tờ thực đơn trên bàn. Thứ gì cần giữ kín hoặc cần tin tưởng (giá tiền, quyền truy cập, dữ liệu khách hàng) phải nằm ở máy chủ. Khi bạn chạy `npm run dev`, máy của bạn đóng cả hai vai cùng lúc, nên ranh giới này dễ bị lẫn.

## Trong code trông như thế nào

Trong Next.js, file có dòng `'use client'` ở đầu sẽ chạy trên trình duyệt (phía khách):

```tsx
'use client'

export default function OrderButton() {
  async function order() {
    const res = await fetch('/api/orders', { method: 'POST' })
    alert(res.ok ? 'Đã đặt hàng' : 'Có lỗi')
  }
  return <button onClick={order}>Đặt hàng</button>
}
```

Còn file `app/api/orders/route.ts` chạy trên máy chủ (phía quầy):

```ts
export async function POST() {
  // chỉ ở đây mới được đọc database và khóa bí mật
  return Response.json({ ok: true })
}
```

Dòng `fetch('/api/orders')` chính là lúc khách gọi món gửi vào quầy.

## Hay gặp lỗi gì

- **Tính giá tiền ở phía khách.** AI viết `total = price * quantity` trong component có `'use client'` rồi gửi `total` lên. Người dùng rành một chút là sửa được giá trước khi gửi. Cách nhận ra: con số quan trọng được tính trong file có `'use client'` rồi gửi thẳng lên server.
- **Tìm `console.log` sai chỗ.** Log trong `route.ts` hiện ở cửa sổ terminal chạy `npm run dev` (hoặc trang Logs của Vercel), không hiện trong Console của trình duyệt. Cách nhận ra: bạn thêm log mà "không thấy gì".
- **Tưởng máy mình là máy chủ thật.** Dữ liệu ghi vào file trên ổ cứng của bạn chạy được ở `localhost`, nhưng lên Vercel thì không giữ lại được. Cách nhận ra: chạy tốt ở máy mình, deploy xong thì dữ liệu biến mất.

## Tự kiểm tra

### Trong dự án của bạn, hãy chỉ ra một file chạy ở máy khách và một file chạy ở máy chủ.

File có `'use client'` ở dòng đầu (thường trong `components/`) chạy ở máy khách. File `app/api/.../route.ts`, hoặc file `page.tsx` không có `'use client'`, chạy ở máy chủ.

### Bạn thêm `console.log('đã nhận đơn')` vào `app/api/orders/route.ts`. Bạn sẽ xem dòng này ở đâu?

Ở terminal đang chạy `npm run dev` khi làm trên máy mình, hoặc trang Logs của dự án trên Vercel khi đã deploy. Không phải tab Console của trình duyệt.

### Vì sao không nên để trình duyệt gửi lên tổng tiền của đơn hàng?

Vì mọi thứ ở máy khách người dùng đều sửa được. Máy chủ phải tự tính lại tổng tiền từ giá lưu trong database.
