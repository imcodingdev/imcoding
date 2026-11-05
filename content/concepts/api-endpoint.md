---
id: api-endpoint
title: Điểm cuối API (API Endpoint)
group: api
prerequisites: [server-code, http-request-response]
priority: 1
stage: 2
signals:
  - "app/api/**/route.ts"
  - "export async function GET"
  - "export async function POST"
  - "fetch('/api/"
---

## Giải thích đời thường

Ở ngân hàng có nhiều ô cửa, mỗi ô treo biển: "Ô 1: Gửi tiền", "Ô 2: Rút tiền", "Ô 3: Tra cứu". Mỗi ô nhận đúng một loại việc, yêu cầu đúng loại giấy tờ, và trả lại đúng loại kết quả. Khách không vào kho tiền; khách đến ô cửa.

**API** là toàn bộ dãy ô cửa mà máy chủ mở ra cho bên ngoài (trình duyệt, ứng dụng điện thoại, dịch vụ khác). Mỗi ô cửa là một **endpoint (điểm cuối)**, được xác định bằng hai thứ: **địa chỉ** (ví dụ `/api/orders`) và **phương thức** (`GET` để xem, `POST` để tạo mới, `PATCH` để sửa, `DELETE` để xóa). `GET /api/orders` và `POST /api/orders` là hai ô cửa khác nhau dù chung địa chỉ.

Điều quan trọng: ô cửa mở ra Internet thì **ai biết địa chỉ cũng gõ cửa được**, không chỉ giao diện của bạn. Ẩn nút trên giao diện không đóng ô cửa lại. Mỗi endpoint phải tự kiểm tra người gọi là ai và dữ liệu gửi đến có hợp lệ không, giống nhân viên ô cửa kiểm tra giấy tờ.

## Trong code trông như thế nào

Trong Next.js, file `app/api/orders/route.ts` mở hai ô cửa ở địa chỉ `/api/orders`:

```ts
import { db } from '@/lib/db'
export async function GET() {
  // CÒN THIẾU: kiểm tra đăng nhập; hiện ai gọi cũng lấy được đơn của mọi người
  const orders = await db.order.findMany({ take: 20 })
  return Response.json(orders)
}

export async function POST(req: Request) {
  // CÒN THIẾU: kiểm tra đăng nhập, và kiểm tra quantity là số nguyên > 0
  const { productId, quantity } = await req.json()
  const product = await db.product.findUnique({ where: { id: productId } })
  if (!product) return Response.json({ error: 'Không có sản phẩm' }, { status: 404 })
  const order = await db.order.create({ data: { productId, quantity, total: product.price * quantity } })
  return Response.json(order, { status: 201 })
}
```

Đây là bản **chưa an toàn**, đúng kiểu AI hay sinh ra lúc đầu. Có một điểm làm đúng: giá lấy từ database, không lấy từ dữ liệu trình duyệt gửi lên. Nhưng còn thiếu hai lớp kiểm tra ghi trong chú thích. Thiếu kiểm tra đăng nhập thì ai cũng xem được mọi đơn (bài "Xác thực đăng nhập" chỉ cách thêm). Không kiểm tra `quantity` thì người ta gửi `-5` là ra đơn có tổng tiền âm.

## Hay gặp lỗi gì

- **Endpoint không kiểm tra đăng nhập.** Trang quản trị có khóa, nhưng `GET /api/orders` thì ai cũng gọi được và lấy hết đơn hàng. Cách nhận ra: mở địa chỉ `/api/...` trong cửa sổ ẩn danh mà vẫn thấy dữ liệu.
- **Tin dữ liệu trình duyệt gửi lên.** Endpoint nhận `total` hay `userId` từ trình duyệt rồi lưu thẳng. Cách nhận ra: trong `route.ts` có `const { total } = await req.json()` rồi đem dùng mà không tính lại.
- **Trả về quá nhiều.** Trả nguyên bản ghi người dùng, kể cả mật khẩu đã mã hóa hay ghi chú nội bộ. Cách nhận ra: tab Network hiện các trường mà giao diện không dùng.
- **Lỗi `405 Method Not Allowed`.** Trình duyệt gọi `PUT` nhưng file `route.ts` chỉ có `GET` và `POST`. Cách nhận ra: mã `405` trong tab Network.

## Tự kiểm tra

### Dự án của bạn có những endpoint nào?

Liệt kê các file `route.ts` trong `app/api/`. Mỗi hàm `export async function GET/POST/PATCH/DELETE` trong một file là một endpoint; địa chỉ là đường dẫn thư mục bỏ phần `app`.

### Chọn một endpoint `POST` của bạn. Nó có kiểm tra người gọi đã đăng nhập chưa?

Tìm ở đầu hàm một dòng kiểu `const session = await auth()` và lệnh trả về `401` nếu không có. Không có thì bất kỳ ai cũng gọi được endpoint đó.
