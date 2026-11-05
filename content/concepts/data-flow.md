---
id: data-flow
title: Dòng chảy dữ liệu (Data Flow)
group: systems
prerequisites: [client-server, api-endpoint, database-table]
priority: 1
stage: 2
format: 2
signals:
  - "onSubmit"
  - "fetch('/api/"
  - "prisma."
  - "revalidatePath"
  - "router.refresh"
---

## Nhắc lại

### Khi người dùng bấm một nút trên trình duyệt (Client), làm thế nào để giao diện gửi yêu cầu sang cho máy chủ (Server) xử lý?

Giao diện trên trình duyệt gửi một yêu cầu HTTP (thường qua lệnh `fetch('/api/...', { method: 'POST', ... })` hoặc gọi Server Action) tới đúng địa chỉ API endpoint đang mở trên máy chủ.

### Sau khi API endpoint trên máy chủ nhận được dữ liệu đơn hàng mới, nó phải lưu vào đâu để khi máy chủ khởi động lại dữ liệu không bị mất?

API endpoint phải dùng công cụ kết nối (như Prisma hoặc Supabase client) để ghi bản ghi mới vào một bảng (table) trong cơ sở dữ liệu (Database), tuyệt đối không lưu tạm vào biến mảng trong RAM.

## Đoán trước

Bạn bảo AI làm trang quản lý thực đơn cho quán cà phê. Khi bạn điền tên món `"Bạc xỉu"`, giá `35000` rồi bấm nút **"Thêm món"**, vòng xoay tải (loading) hiện lên một giây rồi tắt, không có thông báo lỗi nào, nhưng danh sách món ăn trên màn hình vẫn y như cũ, không hề có `"Bạc xỉu"`. Tưởng nút bấm bị hỏng, bạn bấm liền 5 lần nữa rồi bấm F5 tải lại trang. Bất ngờ, trên màn hình hiện ra cùng lúc 6 món `"Bạc xỉu"` giống hệt nhau! Chuyện gì đã xảy ra trên đường đi của dữ liệu?

### Đáp án

Một tính năng lưu dữ liệu gồm **5 trạm nối tiếp nhau**: (1) Giao diện thu thập thông tin → (2) Gửi yêu cầu HTTP lên API endpoint → (3) API endpoint xử lý → (4) Ghi vào Database và trả kết quả về → (5) Giao diện cập nhật lại màn hình. Trong sự cố trên, các trạm 1, 2, 3 và 4 đã chạy thành công: mỗi lần bạn bấm nút là một dòng `"Bạc xỉu"` đã nằm gọn trong database. Lỗi nằm ở **Trạm 5**: sau khi nhận phản hồi thành công từ máy chủ, code giao diện của AI quên gọi lệnh làm mới dữ liệu (như `router.refresh()` hoặc `revalidatePath()`), khiến màn hình vẫn giữ danh sách cũ cho tới khi bạn bấm F5.

## Ví dụ mẫu

Hãy hình dung quy trình gọi món trong quán ăn: khách ghi phiếu ở bàn (Trạm 1), nhân viên mang phiếu tới quầy (Trạm 2), quầy kiểm tra và ghi vào sổ bán hàng (Trạm 3 & 4), rồi báo lại để bảng điện tử tại bàn cập nhật món đã gọi (Trạm 5). Nếu khách than "gọi rồi mà không thấy món", người quản lý sẽ dò từng trạm xem tờ phiếu đang kẹt ở đâu.

**Data Flow (Dòng chảy dữ liệu)** là thói quen nhìn một tính năng như hành trình đi qua các trạm từ trình duyệt tới database rồi quay về. Khi gặp lỗi, thay vì ra lệnh chung chung cho AI `"Nút lưu không chạy, sửa đi"` (khiến AI đoán mò và sửa hỏng chỗ đang đúng), bạn xác định đúng trạm bị đứt gãy rồi chỉ thẳng cho AI sửa file ở trạm đó.

Đoạn 1 — Trạm 1 (giao diện gửi đi) và Trạm 5 (giao diện cập nhật) trong `components/AddProductForm.tsx`:

```tsx
'use client'
import { useRouter } from 'next/navigation'
export function AddProductForm() {
  const router = useRouter()
  async function save(form: FormData) {
    const res = await fetch('/api/products', { // Trạm 1 -> 2: Gửi JSON lên API
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.get('name'), price: Number(form.get('price')) }),
    })
    if (res.ok) router.refresh() // Trạm 5: Xin lại dữ liệu mới từ máy chủ để vẽ lại
  }
  return <form action={save}>{/* các ô input và nút Lưu */}</form>
}
```

Đoạn 2 — Trạm 2, 3, 4 (nhận yêu cầu, ghi database, trả lời) trong `app/api/products/route.ts`:

```ts
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  // Trạm 2 & 3: Đọc dữ liệu từ yêu cầu gửi lên (tên trường phải khớp với Trạm 1!)
  const { ___, price } = await req.json()
  // Trạm 4: Lưu vào bảng Product trong database và trả kết quả mã 201
  const product = await prisma.product.create({
    data: { name, price }
  })
  return Response.json(product, { status: 201 })
}
```

## Tìm trong project của bạn

Chọn một tính năng có nút **"Lưu" / "Tạo mới" / "Cập nhật"** trong dự án của bạn và lần theo dấu vết dữ liệu qua các bước sau:

1. **Tìm Trạm 1 (Nơi bắt đầu trên giao diện):** Mở file component chứa biểu mẫu (form), tìm thuộc tính `onSubmit` hoặc `action`. Xem nó đang gom những trường dữ liệu nào và gọi tới đường dẫn `fetch('/api/...')` nào (hoặc gọi hàm `'use server'` nào).
2. **Tìm Trạm 2 & 3 (Cửa ngõ máy chủ):** Mở file `app/api/.../route.ts` tương ứng với đường dẫn vừa tìm được. So sánh tên các trường lấy ra từ `await req.json()` xem có khớp từng chữ cái (kể cả viết hoa/thường) với tên trường gửi đi ở Trạm 1 không.
3. **Tìm Trạm 4 (Chỗ ghi vào sổ Database):** Ngay trong file máy chủ đó, tìm dòng `prisma.` hoặc `supabase.from(`. Xem dữ liệu có thực sự được truyền vào lệnh `.create(` / `.insert(` / `.update(` không.
4. **Tìm Trạm 5 (Cập nhật lại màn hình):** Quay lại file ở Trạm 1 (hoặc Server Action), xem sau khi lưu thành công có lệnh `router.refresh()`, `revalidatePath(...)`, hoặc cập nhật `useState` để màn hình hiện dữ liệu mới chưa.
5. **Ghi lại bản đồ dòng chảy của tính năng đó:**
   - Trạm 1 (File component giao diện): `[ Đường dẫn file: ... ]`
   - Trạm 2–3 (File API route / Server Action): `[ Đường dẫn file: ... ]`
   - Trạm 4 (Tên bảng database được ghi): `[ Tên bảng: ... ]`
   - Trạm 5 (Cách giao diện cập nhật sau khi lưu): `[ router.refresh / revalidatePath / state / Chưa có ]`

## Tự giải thích

### Giả sử ở Trạm 1 giao diện gửi `body: JSON.stringify({ productName: 'Cà phê' })`, nhưng ở Trạm 3 file `route.ts` lại viết `const { name } = await req.json()`. Chuyện gì sẽ xảy ra và bạn phát hiện bằng cách nào?

Biến `name` ở máy chủ sẽ nhận giá trị `undefined` (rỗng) vì hai trạm đặt tên trường lệch nhau (`productName` khác `name`), dẫn tới lỗi không lưu được vào database hoặc lưu ra dòng trống. Cách phát hiện nhanh nhất là mở tab **Network** trên trình duyệt, bấm vào yêu cầu vừa gửi, đối chiếu mục **Payload** (dữ liệu gửi đi) với dòng `req.json()` trong file `route.ts`.

### Vì sao khi người dùng báo lỗi "Bấm nút Lưu không hoạt động", việc đầu tiên bạn nên làm là mở tab Network trong trình duyệt (F12) thay vì đọc code ngay?

Vì tab Network nằm đúng ở **điểm chia đôi hành trình** giữa trình duyệt (Client) và máy chủ (Server):
- Không thấy yêu cầu nào bay đi khi bấm nút: lỗi ở **Trạm 1** (code giao diện).
- Yêu cầu bay đi nhưng báo đỏ (mã `4xx` hoặc `5xx`): lỗi ở **Trạm 2, 3 hoặc 4** (code máy chủ / database).
- Yêu cầu báo xanh (`200` / `201`) và trả về dữ liệu đúng mà màn hình vẫn sai: lỗi ở **Trạm 5** (quên cập nhật giao diện).

### Nếu bỏ dòng `router.refresh()` ở Trạm 5 (hoặc `revalidatePath` trên máy chủ) sau khi tạo bản ghi mới, dữ liệu trong database có bị mất không?

Dữ liệu trong database **không hề mất** vì Trạm 4 đã hoàn tất việc ghi sổ trước đó. Việc thiếu Trạm 5 chỉ làm cho giao diện trình duyệt tiếp tục hiển thị bản chụp cũ cho đến khi người dùng tự tải lại trang. Tuy nhiên, điều này khiến người dùng tưởng chưa lưu được nên bấm lặp lại nhiều lần, tạo ra hàng loạt bản ghi trùng lặp.

## Kiểm tra không dùng AI

### Tình huống: Trong tính năng "Cập nhật giá sản phẩm", bạn sửa giá từ `50000` thành `65000` rồi bấm Lưu. Giao diện hiện thông báo xanh `"Cập nhật thành công!"`, nhưng khi bấm F5 tải lại trang thì giá lại quay về `50000` như cũ. Bạn mở tab Network kiểm tra yêu cầu `PATCH /api/products/123` thì thấy: Payload gửi đi là `{"newPrice": 65000}`, Status trả về là `200 OK`. Khi mở file `app/api/products/[id]/route.ts`, bạn thấy AI viết: `const { price } = await req.json(); await prisma.product.update({ where: { id }, data: { price } })`. Hãy chỉ ra chính xác dữ liệu đã hỏng ở trạm nào, tại sao máy chủ vẫn báo `200 OK`, và cách sửa.

#### Đáp án

1. **Dữ liệu hỏng ở đâu:** Đứt gãy ở điểm giao nhau giữa **Trạm 1 và Trạm 2–3** do **lệch tên trường dữ liệu**. Giao diện gửi lên trường `newPrice`, nhưng máy chủ lại tìm đọc trường `price`.
2. **Tại sao máy chủ vẫn báo `200 OK` và không đổi giá:** Vì không có trường `price` trong gói tin gửi lên, biến `price` ở máy chủ có giá trị là `undefined`. Khi truyền `data: { price: undefined }` vào Prisma, Prisma hiểu là *"bỏ qua, không cập nhật cột này"* nên câu lệnh chạy xong mà không báo lỗi, trả về `200 OK` nhưng giữ nguyên giá cũ `50000` trong database.
3. **Cách sửa:** Thống nhất tên trường ở cả hai đầu — sửa giao diện gửi `{ price: 65000 }` (hoặc sửa `route.ts` đọc `newPrice`), đồng thời kiểm tra dữ liệu đầu vào ở `route.ts` (nếu `typeof price !== 'number'` thì trả về lỗi `400 Bad Request` ngay).

## Lỗi suy luận hay gặp

### "Khi tính năng bị lỗi, cứ copy thông báo lỗi hoặc bảo AI 'nút Lưu hỏng rồi, sửa giúp tôi' là nhanh nhất"

- **Vì sao sai:** AI không nhìn thấy màn hình tab Network hay dữ liệu thật trong database của bạn. Nếu chỉ nói "nút Lưu hỏng", AI thường đoán mò và sửa bừa file giao diện trong khi lỗi thật nằm ở API hoặc database, thậm chí tự ý đổi sang lưu giả vào `localStorage`.
- **Cách sửa:** Tự dò qua tab Network xem dữ liệu dừng ở trạm nào, sau đó giao việc cụ thể cho AI kèm đúng tên file và hiện tượng ở trạm đó (ví dụ: *"Trạm 1 gửi `newPrice` nhưng `app/api/products/route.ts` đang đọc `price`, hãy đồng bộ lại"*).

### "Đã hiện thông báo 'Lưu thành công' (Toast màu xanh) trên màn hình nghĩa là dữ liệu chắc chắn đã vào database"

- **Vì sao sai:** Thông báo màu xanh trên màn hình chỉ là dòng lệnh giao diện chạy khi không thấy lỗi mạng hoặc khi AI viết sẵn dòng thông báo giả ngay sau lúc bấm nút. Nếu API trả về `200 OK` rỗng hoặc chưa hề gọi database, thông báo xanh vẫn hiện ra bình thường.
- **Cách sửa:** Để xác nhận dữ liệu đã lưu thật hay chưa, hãy kiểm tra phản hồi trong tab Network, bấm F5 tải lại trang, hoặc nhìn trực tiếp vào bảng trong trang quản trị database (Prisma Studio / Supabase Table Editor).

### "Để giao diện cập nhật nhanh và đỡ mất công tải lại, tôi lưu giỏ hàng và danh sách đơn vừa ở `localStorage` vừa ở database"

- **Vì sao sai:** Khi cùng một thông tin được lưu ở hai nơi độc lập (hai "nguồn sự thật"), sớm muộn chúng cũng lệch nhau: xóa đơn trên máy chủ nhưng `localStorage` vẫn còn, hoặc mở trên điện thoại thấy giỏ hàng khác hẳn trên máy tính.
- **Cách sửa:** Chọn một nguồn sự thật duy nhất (Single Source of Truth) là database trên máy chủ; giao diện chỉ gửi yêu cầu thay đổi lên máy chủ rồi dùng `router.refresh()` hoặc `revalidatePath()` để lấy dữ liệu chuẩn về hiển thị.
