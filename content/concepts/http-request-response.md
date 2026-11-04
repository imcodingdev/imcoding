---
id: http-request-response
title: Yêu cầu và phản hồi HTTP (HTTP Request–Response)
group: web
prerequisites: [client-server]
priority: 1
signals:
  - "fetch("
  - "res.ok"
  - "res.status"
  - "NextResponse.json"
  - "{ status: 4"
---

## Giải thích đời thường

Hãy nghĩ tới việc đặt hàng với nhà cung cấp bằng **phiếu đặt hàng**. Bạn ghi rõ muốn làm gì (đặt mới, hỏi giá, hủy đơn), gửi tới bộ phận nào, kèm chi tiết đơn. Nhà cung cấp gửi lại **phiếu trả lời**, trên đầu đóng một con dấu: "Đã nhận", "Không có mặt hàng này", "Kho đang có sự cố".

HTTP là quy tắc chung cho những tờ phiếu đó trên Internet. Mỗi lần trình duyệt nói chuyện với máy chủ là một cặp: **yêu cầu (request)** đi và **phản hồi (response)** về. Yêu cầu gồm phương thức (`GET` để xem, `POST` để gửi mới...), địa chỉ, phần đầu (headers) và nội dung. Phản hồi gồm **mã trạng thái** (con dấu) và nội dung.

Mã hay gặp: `200` là ổn, `201` là đã tạo mới, `400` là phiếu ghi sai, `401` là chưa đăng nhập, `403` là không có quyền, `404` là không tìm thấy, `500` là máy chủ gặp lỗi. Thêm một điều: máy chủ không tự nhớ bạn giữa hai tờ phiếu. Muốn được nhận ra, mỗi phiếu phải kèm "thẻ thành viên" (cookie hoặc token).

## Trong code trông như thế nào

Phía trình duyệt gửi yêu cầu và đọc phản hồi:

```ts
const res = await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ productId: 'cafe-sua', quantity: 2 }),
})
if (!res.ok) {
  throw new Error(`Lỗi ${res.status}`)
}
const order = await res.json()
```

Phía máy chủ trả lời kèm mã trạng thái:

```ts
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()
  if (!body.productId) {
    return NextResponse.json({ error: 'Thiếu sản phẩm' }, { status: 400 })
  }
  return NextResponse.json({ id: 'DH001' }, { status: 201 })
}
```

## Hay gặp lỗi gì

- **Không kiểm tra `res.ok`.** `fetch` chỉ báo lỗi khi không kết nối được; máy chủ trả `404` hay `500` thì `fetch` vẫn chạy tiếp như thường. Cách nhận ra: code gọi `await res.json()` ngay mà không có dòng `if (!res.ok)`, giao diện báo "thành công" dù đơn không được lưu.
- **Máy chủ luôn trả `200`, kể cả khi lỗi.** AI viết `NextResponse.json({ error: '...' })` mà quên `{ status: ... }`. Cách nhận ra: tab Network trong DevTools toàn mã 200 nhưng nội dung trả về có chữ `error`.
- **Nhầm `401` với `403`.** `401` là "chưa biết bạn là ai", `403` là "biết rồi nhưng không cho". Cách nhận ra: người đã đăng nhập mà thiếu quyền lại bị đẩy về trang đăng nhập.

## Tự kiểm tra

### Mở trang web của bạn, bấm F12, vào tab Network rồi bấm một nút. Bạn tìm mã trạng thái ở đâu?

Mỗi dòng trong tab Network là một yêu cầu; cột Status ghi mã trạng thái (200, 404...). Bấm vào dòng đó để xem Headers, nội dung gửi đi (Payload) và nội dung trả về (Response).

### Máy chủ trả về `500`. Code `fetch` của bạn có tự nhảy vào khối `catch` không?

Không. `fetch` chỉ ném lỗi khi không kết nối được. Bạn phải tự kiểm tra `res.ok` hoặc `res.status`.

### Trong dự án của bạn, hãy tìm một chỗ gọi `fetch(` và xem nó có kiểm tra `res.ok` không.

Tìm `fetch(` trong `app/` hoặc `components/`. Nếu ngay sau đó là `await res.json()` mà không có `if (!res.ok)`, đó là chỗ nên nhờ AI bổ sung xử lý lỗi.
