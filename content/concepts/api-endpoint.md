---
id: api-endpoint
title: Điểm cuối API (API Endpoint)
group: api
prerequisites: [server-code, http-request-response]
priority: 1
stage: 2
format: 2
signals:
  - "app/api/**/route.ts"
  - "export async function GET"
  - "export async function POST"
  - "fetch('/api/"
---

## Nhắc lại

### Code đặt trong file `app/api/.../route.ts` của Next.js chạy ở đâu, và người dùng có mở F12 để đọc được mã nguồn bên trong file này không?

Code trong `route.ts` là code máy chủ (Server code), chỉ chạy trên máy chủ (như Vercel). Người dùng mở F12 trên trình duyệt không thể xem được mã nguồn của file này, họ chỉ thấy yêu cầu gửi lên và kết quả trả về.

### Khi một yêu cầu HTTP gửi tới máy chủ nhưng người gửi chưa đăng nhập hoặc gửi dữ liệu sai quy định, máy chủ cần làm gì trong phản hồi?

Máy chủ phải từ chối thực hiện và trả về phản hồi kèm đúng mã trạng thái lỗi HTTP (như `401` khi chưa đăng nhập, `400` khi dữ liệu gửi lên không hợp lệ) thay vì trả về mã `200` mặc định.

## Đoán trước

Bạn bán khóa học trực tuyến giá 2.000.000đ. Trên giao diện trang thanh toán, bạn đã khóa cứng ô hiển thị giá tiền, khách không thể gõ sửa trên màn hình. Khi khách bấm "Mua ngay", trình duyệt gửi yêu cầu `POST /api/orders` kèm nội dung `{"courseId": "ai-web", "price": 2000000}`. Một hôm bạn kiểm tra thấy có người mua khóa học thành công và được kích hoạt tài khoản tự động nhưng hóa đơn chỉ ghi `1đ`. Giao diện trên web không hề cho sửa giá, tại sao họ lại tạo được đơn hàng giá `1đ` trên máy chủ của bạn?

### Đáp án

Giao diện trang web chỉ là một cách để gửi yêu cầu, nhưng **điểm cuối API (`POST /api/orders`) là ô cửa mở thẳng ra Internet**. Kẻ xấu không cần bấm nút trên giao diện của bạn; họ mở F12 (hoặc dùng công cụ bên ngoài) copy yêu cầu gọi vào `/api/orders`, sửa `"price": 2000000` thành `"price": 1` rồi bắn thẳng lên máy chủ. Vì code trong `route.ts` của bạn tin tưởng lấy luôn biến `price` từ trình duyệt gửi lên để tạo đơn thay vì tự tra cứu giá gốc trong cơ sở dữ liệu trên máy chủ, hệ thống đã bán khóa học với giá `1đ`.

## Ví dụ mẫu

Ở ngân hàng có nhiều ô cửa giao dịch: "Ô 1: Mở sổ", "Ô 2: Rút tiền", "Ô 3: Tra cứu số dư". Khách hàng không được bước vào kho tiền bên trong mà chỉ được đứng ngoài đưa giấy tờ qua từng ô cửa.

Trong ứng dụng web, mỗi ô cửa mà máy chủ mở ra cho bên ngoài gọi tới được gọi là một **API Endpoint (Điểm cuối API)**. Trong Next.js App Router, một file `app/api/orders/route.ts` sẽ mở ra địa chỉ `/api/orders`, và mỗi hàm bạn xuất ra (`export async function GET`, `POST`, `PATCH`, `DELETE`) là một ô cửa riêng biệt.

Nguyên tắc sống còn khi kiểm tra code AI viết cho API Endpoint: **Ô cửa mở ra Internet thì bất kỳ ai biết địa chỉ đều gõ cửa được**. Theo bảng xếp hạng **OWASP Top 10 năm 2021**, lỗi kiểm soát quyền truy cập (**Broken Access Control**) đứng **hạng 1** trong các rủi ro bảo mật ứng dụng web nguy hiểm nhất. Mỗi endpoint bắt buộc phải tự kiểm tra: **(1) Người gõ cửa là ai?**, **(2) Dữ liệu đưa vào có hợp lệ không?**, và **(3) Không bao giờ tin giá tiền hay quyền hạn do trình duyệt gửi lên**.

Cách làm SAI (kiểu code AI hay tạo ra khi bạn chỉ bảo "viết API tạo đơn hàng"):

```ts
// SAI (app/api/orders/route.ts): Không kiểm tra đăng nhập, tin luôn giá từ Client!
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { userId, productId, quantity, total } = await req.json()
  const { data } = await supabase
    .from('orders')
    .insert({ user_id: userId, product_id: productId, quantity, total })
    .select().single()
  return NextResponse.json(data, { status: 201 })
}
```

Cách làm ĐÚNG (kiểm tra danh tính ở cửa, kiểm tra số lượng, tự tính tiền từ database):

```ts
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: ___ })

  const { productId, quantity } = await req.json()
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return NextResponse.json({ error: 'Số lượng không hợp lệ' }, { status: 400 })
  }
  const { data: product } = await supabase.from('products').select('price').eq('id', productId).single()
  if (!product) return NextResponse.json({ error: 'Không tìm thấy món' }, { status: 404 })
  const { data: order } = await supabase.from('orders')
    .insert({ user_id: user.id, product_id: productId, quantity, total: product.price * quantity }).select().single()
  return NextResponse.json(order, { status: 201 })
}
```

## Tìm trong project của bạn

Hãy lập bản đồ và kiểm tra toàn bộ các "ô cửa" API trong dự án của bạn:

1. **Liệt kê tất cả API Endpoint:** Mở cây thư mục dự án, tìm vào `app/api/` (hoặc `src/app/api/`). Tìm mọi file `route.ts` hoặc `route.js`. Đường dẫn thư mục từ sau chữ `app` chính là địa chỉ ô cửa (ví dụ `app/api/orders/route.ts` là `/api/orders`).
2. **Kiểm tra người gác cửa (Xác thực):** Mở từng file `route.ts`, nhìn vào đầu mỗi hàm `GET`, `POST`, `PUT`, `PATCH`, `DELETE`. Xem có dòng kiểm tra người dùng hiện tại (như `supabase.auth.getUser()` hoặc `auth()`) và chặn lại bằng mã `401`/`403` không.
3. **Kiểm tra dữ liệu trình duyệt gửi lên:** Tìm dòng `await req.json()` trong các hàm `POST`, `PATCH`. Xem có trường nhạy cảm nào như `price`, `total`, `role`, `isAdmin`, `userId` được lấy thẳng từ `req.json()` để lưu vào database không.
4. **Kiểm tra dữ liệu trả về:** Nhìn vào dòng `NextResponse.json(...)` hoặc `Response.json(...)` ở cuối hàm `GET`. Xem endpoint có đang lấy toàn bộ bảng (`select('*')`) và trả thừa thông tin nhạy cảm của người khác về trình duyệt không.
5. **Ghi lại kết quả của bạn:**
   - Tổng số file `route.ts` trong dự án: `[ Số lượng: ... ]`
   - Endpoint chưa kiểm tra đăng nhập ở đầu hàm: `[ Có / Không - tên file: ... ]`
   - Endpoint đang tin tưởng `userId`, `price` hoặc `total` lấy từ `await req.json()`: `[ Có / Không - tên file: ... ]`

## Tự giải thích

### Vì sao bạn đã xóa nút "Xóa sản phẩm" trên giao diện của khách hàng thường, nhưng nếu endpoint `DELETE /api/products` không kiểm tra quyền Admin thì khách hàng vẫn xóa sạch sản phẩm của bạn được?

Vì nút bấm trên giao diện và endpoint `DELETE /api/products` trên máy chủ là hai thứ tách rời nhau. Giao diện chỉ giúp người dùng bấm cho tiện, còn bản thân địa chỉ `/api/products` vẫn nằm công khai trên Internet. Bất kỳ ai cũng có thể dùng F12 hoặc viết lệnh `fetch('/api/products', { method: 'DELETE' })` gửi thẳng vào ô cửa đó nếu hàm `DELETE` trong `route.ts` không tự kiểm tra quyền Admin.

### Tại sao trong hàm `POST /api/orders`, ta không nên nhận `userId` từ `await req.json()` do trình duyệt gửi lên, mà phải lấy `user.id` từ `supabase.auth.getUser()` trên máy chủ?

Vì mọi thứ nằm trong `req.json()` đều do phía trình duyệt tự viết vào và có thể bị sửa tùy ý. Nếu máy chủ lấy `userId` từ `req.json()`, kẻ xấu chỉ cần điền `userId` của người khác vào là có thể đặt hàng, xem lịch sử, hoặc sửa dữ liệu mạo danh người đó. Chỉ có `supabase.auth.getUser()` đọc từ phiên đăng nhập đã xác thực trên máy chủ mới cho biết chính xác ai đang gửi yêu cầu.

### Khi nào trình duyệt gọi vào địa chỉ `/api/orders` đã tồn tại nhưng lại nhận về lỗi `405 Method Not Allowed`?

Mỗi địa chỉ `/api/orders` có thể mở nhiều ô cửa ứng với các phương thức khác nhau (`GET`, `POST`, `PATCH`, `DELETE`). Lỗi `405` xảy ra khi file `app/api/orders/route.ts` chỉ viết hàm `export async function GET()`, nhưng trình duyệt lại gửi yêu cầu với phương thức `POST` hoặc `DELETE` — tức là gõ đúng địa chỉ nhưng đòi làm thao tác mà ô cửa đó chưa mở hỗ trợ.

## Kiểm tra không dùng AI

### Tình huống: AI vừa viết cho bạn file `app/api/profile/route.ts` có hàm `PATCH` để người dùng tự đổi tên hiển thị: code đọc `const body = await req.json()`, sau đó cập nhật thẳng toàn bộ `body` vào bảng `users` trong cơ sở dữ liệu theo đúng ID người đang đăng nhập (`update(body).eq('id', user.id)`). Trong bảng `users` ngoài cột `name` còn có cột `role` (`'user'` hoặc `'admin'`) và cột `balance` (số dư ví). Hãy chỉ ra lỗ hổng nghiêm trọng trong endpoint này và cách yêu cầu AI sửa lại.

#### Đáp án

1. **Lỗ hổng nghiêm trọng:** Dù endpoint đã kiểm tra đúng người đang đăng nhập (`user.id`), nhưng nó lại **đem toàn bộ đối tượng `body` do trình duyệt gửi lên cập nhật thẳng vào bảng `users`**. Kẻ xấu chỉ cần mở F12, gửi yêu cầu `PATCH /api/profile` với nội dung `{"name": "Nam", "role": "admin", "balance": 999999999}`. Cơ sở dữ liệu sẽ cập nhật luôn cả 3 cột, biến tài khoản thường thành Admin và tự cộng tiền vào ví!
2. **Cách sửa:** Không bao giờ truyền thẳng toàn bộ `body` từ trình duyệt vào lệnh cập nhật cơ sở dữ liệu. Phải chỉ đích danh từng trường được phép sửa:
   - Chỉ trích xuất đúng trường `name`: `const { name } = await req.json()`.
   - Kiểm tra `name` là chuỗi hợp lệ, không rỗng, độ dài vừa phải.
   - Trong lệnh cập nhật database, chỉ truyền duy nhất `{ name }`: `.update({ name }).eq('id', user.id)`.

## Lỗi suy luận hay gặp

### "Đường dẫn `/api/admin/export-users` do mình tự đặt tên bí mật, không có nút nào trên web dẫn tới đó nên người ngoài không thể biết mà gọi"

- **Vì sao sai:** Tên đường dẫn trong code Client sau khi đóng gói gửi xuống trình duyệt vẫn có thể bị dò ra trong tab Sources/Network của F12, hoặc bị các công cụ quét tự động dò trúng. Giấu tên đường dẫn không phải là bảo mật.
- **Cách sửa:** Coi mọi địa chỉ `/api/...` là công khai. Luôn kiểm tra xác thực đăng nhập và quyền hạn (role) ngay những dòng đầu tiên của mọi hàm trong `route.ts`.

### "Đã kiểm tra dữ liệu đầu vào rất kỹ bằng JavaScript ở form trên màn hình rồi thì trong `route.ts` không cần kiểm tra lại nữa"

- **Vì sao sai:** Kiểm tra ở form trên màn hình (Client) chỉ giúp người dùng bình thường đỡ nhập nhầm, còn kẻ xấu gọi thẳng vào API Endpoint sẽ bỏ qua toàn bộ giao diện. Nếu không kiểm tra `quantity > 0` trong `route.ts`, kẻ xấu gửi `quantity: -5` sẽ tạo ra đơn hàng có tổng tiền âm!
- **Cách sửa:** Mọi quy tắc kiểm tra dữ liệu (số lượng nguyên dương, độ dài chuỗi, định dạng email...) bắt buộc phải được kiểm tra lại bên trong file `route.ts` trên máy chủ.

### "Lấy dữ liệu trong `route.ts` cứ viết `select('*')` rồi trả hết về trình duyệt, giao diện cần trường nào thì lấy trường đó hiển thị cho tiện"

- **Vì sao sai:** Dù giao diện chỉ hiển thị tên người dùng, nhưng toàn bộ dữ liệu mà `NextResponse.json(data)` trả về đều hiện rõ trong tab Network (F12), làm lộ email, số điện thoại, ghi chú nội bộ của người khác.
- **Cách sửa:** Chỉ truy vấn và trả về từ API Endpoint đúng những trường dữ liệu mà màn hình đó thực sự được phép xem (ví dụ `.select('id, name, avatar_url')`).
