---
id: client-server
title: Máy khách – máy chủ (Client–Server)
group: web
prerequisites: []
priority: 1
stage: 1
format: 2
signals:
  - "'use client'"
  - "app/api/**/route.ts"
  - "fetch("
  - "localhost:3000"
---

## Đoán trước

Bạn nhờ AI làm trang bán khóa học giá 2.000.000 đồng. Khi tự bấm mua thử, hệ thống trừ đúng 2.000.000 đồng. Nhưng sáng hôm sau, báo cáo ghi nhận có người mua thành công khóa học này chỉ với 1.000 đồng. Mở file giao diện nút mua hàng (có dòng `'use client'` ở đầu), bạn thấy AI tính sẵn `total = 2000000` rồi gửi con số `total` đó lên máy chủ để tạo hóa đơn. Vì sao khách hàng tự hạ giá khóa học xuống 1.000 đồng được?

### Đáp án

Vì file có `'use client'` chạy ngay trên trình duyệt của người mua (máy khách). Mọi dữ liệu và phép tính trên trình duyệt đều có thể bị người dùng mở công cụ trình duyệt ra xem và sửa trước khi gửi đi. Khách chỉ cần đổi `2000000` thành `1000` trong yêu cầu gửi lên máy chủ là mua được giá rẻ nếu máy chủ cứ thế tin lời.

## Ví dụ mẫu

Hãy hình dung một quán cà phê: khách ngồi ở bàn chọn món và số lượng; quầy pha chế ở phía sau giữ công thức, két tiền và sổ sách. Khách không được tự ghi tổng tiền lên hóa đơn thu ngân mà chỉ gửi tên món và số lượng vào quầy.

Ứng dụng web cũng chia làm hai phía:
- **Máy khách (client)** là trình duyệt trên điện thoại hoặc máy tính của người dùng, dùng để hiển thị giao diện và gửi yêu cầu. Mọi thứ chạy ở máy khách thì người dùng đều **xem và sửa được**.
- **Máy chủ (server)** là máy tính đặt ở dịch vụ đám mây như Vercel. Nó giữ cơ sở dữ liệu (database), khóa bí mật (secret) và xử lý các quyết định quan trọng.

Trong Next.js App Router, ranh giới giữa hai phía thể hiện qua vị trí file và dòng đánh dấu đầu file:

```tsx
// File: components/OrderButton.tsx
'use client' // Đánh dấu file chạy ở trình duyệt (máy khách)
export default function OrderButton() {
  async function order() {
    // Chỉ gửi mã mặt hàng và số lượng, KHÔNG gửi giá tiền
    const res = await fetch('/api/orders', {
      method: 'POST',
      body: JSON.stringify({ itemId: 'course-01', quantity: 1 }),
    })
    alert(res.ok ? 'Đã đặt hàng' : 'Có lỗi')
  }
  return <button onClick={order}>Đặt hàng</button>
}
```

Ở phía quầy pha chế, file trong `app/api/.../route.ts` luôn chạy trên máy chủ:

```ts
// File: app/api/orders/route.ts — luôn chạy trên máy chủ (server)
export async function POST(request: Request) {
  const { itemId, quantity } = await request.json()
  // Máy chủ tự tra giá gốc trong database thay vì nhận giá từ trình duyệt vì ___
  const priceFromDb = 2000000
  const total = priceFromDb * quantity
  console.log('Đã tạo đơn với số tiền:', total) // Hiện ở terminal máy chủ
  return Response.json({ ok: true, total })
}
```


## Tìm trong project của bạn

Khi chạy `npm run dev`, máy tính của bạn đóng cả hai vai (máy khách và máy chủ tại `localhost:3000`), nên rất dễ nhìn lẫn. Hãy mở dự án và làm 4 bước sau để tách bạch chúng:

1. Mở công cụ tìm kiếm toàn dự án, gõ `'use client'` để tìm các file giao diện chạy ở trình duyệt (thường trong `components/` hoặc `app/`).
2. Mở thư mục `app/api/` và tìm các file `route.ts` (hoặc `route.js`). Đây là các đầu mối tiếp nhận yêu cầu chạy trên máy chủ.
3. Tìm từ khóa `fetch(` trong các file có `'use client'` để xem trình duyệt đang gửi thông tin gì lên máy chủ.
4. Ghi lại kết quả kiểm tra:
   - **Một file chạy ở máy khách (`'use client'`):** `____________________`
   - **Một file chạy ở máy chủ (`route.ts`):** `____________________`
   - **Một dữ liệu đang gửi qua `fetch(`:** `____________________`
   - **Dữ liệu đó có chứa giá tiền, quyền admin hay thông tin nhạy cảm do trình duyệt tự quyết định không?** `Có / Không`

Ổn: `fetch` gửi dữ liệu đầu vào, còn `app/api/orders/route.ts` (hoặc `src/app/api/orders/route.ts`) kiểm tra lại trước khi xử lý. Có vấn đề: máy chủ tin ngay `role`, `userId` hay giá do trình duyệt gửi. Tìm thêm `request.json`, `role` và `userId` ở nơi nhận yêu cầu; chỉ thấy kiểm tra trên giao diện chưa đủ kết luận an toàn.

## Tự giải thích

### Vì sao không nên để trình duyệt tính sẵn tổng tiền đơn hàng rồi gửi lên máy chủ?

Vì trình duyệt nằm trong tay người dùng. Họ có thể can thiệp vào lệnh `fetch` để sửa tổng tiền thành `0` trước khi gói tin bay về máy chủ. Máy chủ chỉ được nhận mã sản phẩm và số lượng, rồi tự tra giá chuẩn trong cơ sở dữ liệu để tính tiền.

### Nếu thêm dòng `console.log('đã nhận đơn')` vào file `app/api/orders/route.ts`, bạn sẽ nhìn thấy dòng chữ này ở đâu và vì sao?

Bạn sẽ thấy nó ở cửa sổ terminal đang chạy `npm run dev` (hoặc mục Logs trên Vercel sau khi đưa web lên mạng), chứ không thấy trong tab Console của trình duyệt. Vì `route.ts` chạy trên máy chủ nên lệnh `console.log` sẽ in ra màn hình máy chủ.

### Điều gì xảy ra nếu AI viết code lưu hóa đơn khách hàng vào một file `.json` trên ổ cứng thay vì lưu vào cơ sở dữ liệu?

Khi chạy thử ở `localhost:3000`, mọi thứ có vẻ ổn vì máy cá nhân giữ nguyên file đó. Nhưng trên dịch vụ máy chủ như Vercel, các hàm máy chủ chỉ bật lên xử lý tạm thời rồi tắt, không giữ lại file ghi thêm trên ổ cứng, khiến dữ liệu khách hàng biến mất sau một thời gian ngắn.

## Trắc nghiệm

### AI lưu vai trò như sau. Máy chủ nên dựa vào đâu để cấp quyền?

```js
localStorage.setItem('role', 'admin')
fetch('/api/reports', { headers: { 'X-Role': 'admin' } })
```

- [ ] Tin `X-Role` vì được ứng dụng tự gửi
- [x] Xác minh phiên và quyền trên máy chủ
- [ ] Tin localStorage vì chỉ máy người dùng đọc được

**Giải thích:** Người dùng sửa được cả localStorage lẫn header. Header do giao diện gửi không phải bằng chứng quyền quản trị.

### Cursor nói “hai phía đều ở localhost nên fetch không đi qua mạng”. Bạn kiểm tra thế nào?

- [x] Mở Network để xem yêu cầu HTTP giữa trình duyệt và máy chủ local
- [ ] Không cần kiểm tra vì localhost chỉ có một tiến trình
- [ ] Chỉ tìm yêu cầu sau khi triển khai lên Vercel

**Giải thích:** Hai phía vẫn giao tiếp qua HTTP dù cùng máy. Localhost không biến trình duyệt và máy chủ thành một chương trình.

### Trang có bộ lọc danh sách mẫu đã tải sẵn. AI muốn gửi mỗi lần gõ lên máy chủ. Phương án hợp lý là gì?

- [ ] Mọi thao tác lọc bắt buộc ở máy chủ
- [ ] Đưa cả mật khẩu database vào bộ lọc để nhanh hơn
- [x] Có thể lọc tại trình duyệt nếu chỉ dùng dữ liệu công khai đã tải

**Giải thích:** Lọc để hiển thị không nhất thiết cần máy chủ. Điều này không cho phép chuyển bí mật hoặc quyết định quyền truy cập sang trình duyệt.

### Network cho thấy API trả danh sách mẫu, nhưng màn hình vẫn trống. AI kết luận database đã mất. Bằng chứng hiện có nói gì?

- [ ] Chắc chắn database đã bị xóa
- [x] Cần kiểm tra bước nhận và hiển thị dữ liệu ở giao diện
- [ ] API trả dữ liệu thì giao diện chắc chắn đúng

**Giải thích:** Có phản hồi chứa danh sách cho thấy dữ liệu đã đến trình duyệt ở yêu cầu đó. Nó chưa chứng minh code hiển thị đọc đúng trường, cũng không chứng minh database bị mất.

## Kiểm tra không dùng AI

### Tình huống: Trong file `components/Checkout.tsx` (có `'use client'` ở đầu), AI viết danh sách mã giảm giá `VIP50`, `ADMIN100` (giảm 100%) ngay trong code; nếu khách gõ `ADMIN100` thì gửi lệnh tạo đơn hàng miễn phí lên máy chủ. Hãy nêu 2 rủi ro và cách yêu cầu AI sửa lại kèm lý do.

#### Đáp án

- **Rủi ro 1 (Lộ bí mật):** Vì `Checkout.tsx` có `'use client'`, toàn bộ code chứa danh sách mã `VIP50`, `ADMIN100` đều tải về trình duyệt. Ai mở mã nguồn trên trình duyệt cũng đọc được mã giảm 100%.
- **Rủi ro 2 (Giả mạo kết quả):** Việc kiểm tra mã và quyết định "đơn miễn phí" diễn ra ở máy khách. Kẻ gian có thể bỏ qua bước kiểm tra và gửi thẳng yêu cầu tạo đơn miễn phí lên máy chủ.
- **Cách sửa và lý do:** Yêu cầu AI xóa danh sách mã và phép tính giảm giá khỏi `Checkout.tsx`. Trình duyệt chỉ gửi chuỗi mã người dùng nhập lên `route.ts` trên máy chủ để máy chủ tự đối chiếu với cơ sở dữ liệu và tính tiền, giúp giữ kín mã và không bị sửa kết quả.

## Lỗi suy luận hay gặp

### "Mình đã ẩn nút bấm trên màn hình rồi thì người dùng không gọi lệnh đó được nữa"

- **Vì sao sai:** Ẩn nút bấm ở file `'use client'` chỉ như che rèm trước quầy. Đường dẫn `/api/...` trên máy chủ vẫn mở, người dùng có thể tự gửi lệnh `fetch` trực tiếp vào đó mà không cần bấm nút.
- **Cách sửa:** Mọi bước kiểm tra quyền hạn bắt buộc phải đặt ở code chạy trên máy chủ (`route.ts`).

### "Chạy trên máy mình (`localhost:3000`) thấy nhanh và lưu file tốt, nghĩa là đưa lên mạng cũng vậy"

- **Vì sao sai:** Khi chạy `npm run dev`, trình duyệt và máy chủ nằm chung trên máy tính của bạn và dùng chung ổ cứng. Khi đưa lên Vercel, máy khách ở xa còn máy chủ không cho phép lưu dữ liệu lâu dài vào file nội bộ.
- **Cách sửa:** Phân biệt rõ việc gì diễn ra ở trình duyệt, việc gì ở máy chủ, và lưu dữ liệu lâu dài vào cơ sở dữ liệu (như Supabase).

### "Biến môi trường nào đặt trong file `.env` đọc ở `'use client'` cũng làm lộ khóa bí mật"

- **Vì sao sai:** Next.js mặc định chặn các biến môi trường thông thường sang trình duyệt; đọc biến không có tiền tố `NEXT_PUBLIC_` trong component trình duyệt chỉ nhận được `undefined` (gây lỗi code chứ không lộ khóa). Khóa chỉ lộ khi gắn tiền tố `NEXT_PUBLIC_` hoặc viết cứng vào code.
- **Cách sửa:** Tuyệt đối không gắn `NEXT_PUBLIC_` cho khóa bí mật và chỉ đọc chúng ở code máy chủ.

## Bài tập thực hành

Vẽ đường đi của một lần tải danh sách mẫu từ giao diện đến máy chủ trong project của bạn.

### Việc cần làm

1. Chọn bản local dùng dữ liệu giả, không kết nối database thật; nếu chưa có, chỉ lần theo mã nguồn, không chạy ứng dụng.
2. Tìm một `fetch(` đọc danh sách và ghi tên file cùng đường dẫn được gọi, không ghi cookie hay token.
3. Tìm `route.ts` tương ứng trong `app/api` hoặc `src/app/api`; ghi dữ liệu đầu vào và trường kết quả trả lại.
4. Nếu có bản local an toàn, mở Network, tải danh sách một lần và đối chiếu đường dẫn với code. Không thử gửi lệnh mua hay xóa.

### Kết quả đúng

Có sơ đồ gồm file giao diện → đường dẫn → file xử lý → kết quả, nêu rõ phía chạy của mỗi phần. Nếu không tìm được route vì dùng API ngoài hoặc Server Action, ghi đúng giới hạn đó, không tự đoán tên file.

### Nhờ AI rà lại

```text
Rà sơ đồ và các file tôi đã chỉ định. Chỉ báo cáo, không tự sửa hay chạy request. Chỉ rõ phần chạy ở trình duyệt, phần ở máy chủ và chỗ chưa có bằng chứng. Không đọc file môi trường hoặc đưa khóa, cookie vào báo cáo.
```
