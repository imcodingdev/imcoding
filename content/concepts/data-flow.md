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

Một tính năng lưu dữ liệu qua API thường có **5 trạm nối tiếp nhau**: (1) Giao diện thu thập thông tin → (2) Gửi yêu cầu HTTP → (3) Máy chủ xử lý → (4) Ghi Database và trả kết quả → (5) Giao diện cập nhật. Trong tình huống này, sáu bản ghi sau F5 cho thấy việc lưu đã xảy ra nhưng màn hình chưa phản ánh kết quả. Cần rà **Trạm 5**: cập nhật state hoặc gọi `router.refresh()` ở client khi dữ liệu do Server Component cung cấp. Nếu dữ liệu server có cache, còn cần làm mất hiệu lực cache phù hợp ở server, chẳng hạn `revalidatePath()`; không gọi hàm này trong Client Component.

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
    if (res.ok) router.refresh() // Trạm 5: Xin lại Server Component, không tự xóa cache server
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
3. **Tìm Trạm 4 (Chỗ ghi vào sổ Database):** Trong route hoặc file được import như `lib/products.ts`, tìm `prisma.`, `.from(`, `.create(`, `.insert(`, `.update(`. Ổn là đợi kết quả và xử lý lỗi trước khi báo thành công; có vấn đề là bỏ `await`, bỏ qua `error` của Supabase hoặc trả dữ liệu giả mà chưa ghi.
4. **Tìm Trạm 5 (Cập nhật màn hình):** Tìm `setProducts`, `router.refresh`, `revalidatePath` và nơi đọc danh sách. Ổn là cách làm mới khớp nguồn dữ liệu: state được cập nhật, truy vấn client được tải lại, hoặc Server Component nhận dữ liệu mới sau xử lý cache. Có vấn đề là chỉ gọi `router.refresh()` nhưng danh sách vẫn lấy từ state cũ, hoặc cache server chưa được làm mất hiệu lực.
5. **Ghi lại bản đồ dòng chảy của tính năng đó:**
   - Trạm 1 (File component giao diện): `[ Đường dẫn file: ... ]`
   - Trạm 2–3 (File API route / Server Action): `[ Đường dẫn file: ... ]`
   - Trạm 4 (Tên bảng database được ghi): `[ Tên bảng: ... ]`
   - Trạm 5 (Cách giao diện cập nhật sau khi lưu): `[ router.refresh / revalidatePath / state / Chưa có ]`

Tìm thêm trong `src/components/*Form.tsx`, `src/app/api/**/route.ts`, `src/app/**/actions.ts`. Với `catch`, `finally`, `setLoading`: ổn là xử lý lỗi và kết thúc chờ; sai là báo thành công trong nhánh lỗi. Ví dụ mẫu chỉ minh họa luồng, chưa đủ xác thực, kiểm tra đầu vào và xử lý lỗi cho production.

## Tự giải thích

### Giả sử ở Trạm 1 giao diện gửi `body: JSON.stringify({ productName: 'Cà phê' })`, nhưng ở Trạm 3 file `route.ts` lại viết `const { name } = await req.json()`. Chuyện gì sẽ xảy ra và bạn phát hiện bằng cách nào?

Biến `name` ở máy chủ sẽ nhận giá trị `undefined` (rỗng) vì hai trạm đặt tên trường lệch nhau (`productName` khác `name`), dẫn tới lỗi không lưu được vào database hoặc lưu ra dòng trống. Cách phát hiện nhanh nhất là mở tab **Network** trên trình duyệt, bấm vào yêu cầu vừa gửi, đối chiếu mục **Payload** (dữ liệu gửi đi) với dòng `req.json()` trong file `route.ts`.

### Vì sao khi người dùng báo lỗi "Bấm nút Lưu không hoạt động", việc đầu tiên bạn nên làm là mở tab Network trong trình duyệt (F12) thay vì đọc code ngay?

Vì tab Network nằm đúng ở **điểm chia đôi hành trình** giữa trình duyệt (Client) và máy chủ (Server):
- Không thấy yêu cầu nào bay đi khi bấm nút: lỗi ở **Trạm 1** (code giao diện).
- Yêu cầu bay đi nhưng báo đỏ (mã `4xx` hoặc `5xx`): lỗi ở **Trạm 2, 3 hoặc 4** (code máy chủ / database).
- Yêu cầu báo xanh (`200` / `201`) và trả về dữ liệu đúng mà màn hình vẫn sai: lỗi ở **Trạm 5** (quên cập nhật giao diện).

### Nếu bỏ dòng `router.refresh()` ở Trạm 5 (hoặc `revalidatePath` trên máy chủ) sau khi tạo bản ghi mới, dữ liệu trong database có bị mất không?

Dữ liệu trong database **không hề mất** nếu Trạm 4 đã hoàn tất việc ghi. Thiếu bước cập nhật phù hợp có thể làm giao diện giữ bản cũ và khiến người dùng bấm lặp. Tải lại trang cũng chưa chắc lấy được dữ liệu mới nếu cache server vẫn cũ; cần phân biệt làm mới giao diện với làm mất hiệu lực cache dữ liệu.

## Trắc nghiệm

### AI đã gọi router.refresh(), nhưng danh sách từ server vẫn được cache. Cần rà điều gì?

- [ ] Gọi refresh liên tục sẽ tự xóa mọi cache
- [x] Nơi tạo cache và cách làm mất hiệu lực nó ở server sau khi lưu
- [ ] Xóa dữ liệu trong database để server buộc tải lại

**Giải thích:** `router.refresh()` xin lại Server Component, không tự xóa cache dữ liệu trên server. Nếu nguồn đọc vẫn trả bản cache cũ thì giao diện có thể tiếp tục cũ; xóa bản ghi không phải cách sửa cache.

### Log tìm kiếm mẫu cho thấy phản hồi đến ngược thứ tự. Cách đọc lỗi nào hợp lý?

```text
Gửi A: q=ca
Gửi B: q=cafe
Nhận B: kết quả cafe
Nhận A: kết quả ca, rồi ghi đè màn hình
```

- [x] Phản hồi cũ ghi đè kết quả mới; cần cơ chế chỉ nhận kết quả còn phù hợp
- [ ] Database chắc chắn đổi tên sản phẩm cafe thành ca
- [ ] Thêm router.refresh sau mọi phản hồi sẽ bảo đảm đúng thứ tự

**Giải thích:** Thứ tự hoàn tất không nhất thiết trùng thứ tự gửi. Có thể bỏ qua phản hồi đã lỗi thời hoặc hủy yêu cầu cũ; làm mới trang không tự giải quyết cạnh tranh giữa hai kết quả.

### Bạn mở trang danh mục và không thấy fetch('/api/products') trong Network. Code server như sau; kết luận nào đúng?

```tsx
export default async function Page() {
  const products = await prisma.product.findMany()
  return <Catalog products={products} />
}
```

- [ ] Không có request API đó nghĩa là database chưa từng được đọc
- [ ] Prisma đang kết nối database từ trình duyệt
- [x] Server Component đọc database ở server; không nhất thiết có API riêng do trình duyệt gọi

**Giải thích:** Sơ đồ năm trạm là cách theo dõi một luồng điển hình, không bắt mọi lần đọc phải qua `/api`. Network trên trình duyệt không hiển thị kết nối database nội bộ của server.

### Cursor đề nghị tự gửi lại lệnh tạo đơn mỗi khi trình duyệt hết thời gian chờ. Cần cân nhắc gì?

- [ ] Hết thời gian chờ bảo đảm server chưa ghi gì
- [x] Server có thể đã ghi; cần cách xác nhận hoặc chống tạo trùng trước khi gửi lại
- [ ] Chỉ cần ẩn nút sau lần gửi lại thì chắc chắn không trùng

**Giải thích:** Không nhận được phản hồi chưa chứng minh thao tác thất bại. Cần thiết kế nhận diện cùng một thao tác và đối chiếu trạng thái; ẩn nút không ngăn mọi lần thử lại từ mạng hoặc code.

## Kiểm tra không dùng AI

### Tình huống: Trong tính năng "Cập nhật giá sản phẩm", bạn sửa giá từ `50000` thành `65000` rồi bấm Lưu. Giao diện hiện thông báo xanh `"Cập nhật thành công!"`, nhưng khi bấm F5 tải lại trang thì giá lại quay về `50000` như cũ. Bạn mở tab Network kiểm tra yêu cầu `PATCH /api/products/123` thì thấy: Payload gửi đi là `{"newPrice": 65000}`, Status trả về là `200 OK`. Khi mở file `app/api/products/[id]/route.ts`, bạn thấy AI viết: `const { price } = await req.json(); await prisma.product.update({ where: { id }, data: { price } })`. Hãy chỉ ra chính xác dữ liệu đã hỏng ở trạm nào, tại sao máy chủ vẫn báo `200 OK`, và cách sửa.

#### Đáp án

1. **Dữ liệu hỏng ở đâu:** Đứt gãy ở điểm giao nhau giữa **Trạm 1 và Trạm 2–3** do **lệch tên trường dữ liệu**. Giao diện gửi lên trường `newPrice`, nhưng máy chủ lại tìm đọc trường `price`.
2. **Tại sao có thể báo `200 OK` mà không đổi giá:** Thiếu trường `price` khiến biến nhận `undefined`. Với cấu hình Prisma bỏ qua trường `undefined`, câu lệnh không cập nhật cột đó nên giữ giá cũ. Nếu bật `strictUndefinedChecks`, truyền tường minh `undefined` sẽ báo lỗi thay vì bỏ qua; vì vậy cần đối chiếu phiên bản/cấu hình và log, không mặc định mọi project đều trả `200`.
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
- **Cách sửa:** Chọn database làm nguồn dữ liệu chính cho đơn đã lưu. Nếu có bản sao cục bộ, phải thiết kế cách đồng bộ; cập nhật state/tải lại truy vấn client hoặc làm mới Server Component và cache server tùy nguồn dữ liệu, không xem `router.refresh()` và `revalidatePath()` là hai lệnh thay thế nhau ở mọi nơi.

## Bài tập thực hành

Vẽ đường đi một biểu mẫu bằng cách đọc code. Không bấm lưu hoặc tạo bản ghi thật.

### Việc cần làm

1. Chọn form, ghi file, hàm `onSubmit` hoặc `action`, tên trường; chỉ minh họa bằng giá trị giả.
2. Theo `fetch` đến route hoặc import đến Server Action; ghi nơi xác thực và kiểm tra đầu vào.
3. Tìm lời gọi database, ghi bảng/cột, bước chờ và xử lý lỗi, cả file trung gian nếu có.
4. Theo phản hồi về giao diện, ghi nguồn danh sách và cách làm mới: state, truy vấn client hay Server Component.
5. Vẽ mũi tên kèm file và trường; đánh dấu đã khớp hoặc chưa rõ. Không chạy request để bù bằng chứng.

### Kết quả đúng

Có sơ đồ hai chiều, phân biệt lưu thành công với hiển thị mới. Mỗi mũi tên có bằng chứng hoặc nhãn chưa xác minh; không chép token hay dữ liệu thật.

### Nhờ AI rà lại

```text
Chỉ báo cáo, không tự sửa, không chạy lệnh hoặc gọi dịch vụ. Rà sơ đồ luồng và trích đoạn đã che bí mật tôi gửi: tên trường, bước chờ ghi, xử lý lỗi, nguồn dữ liệu giao diện và cache. Chỉ ra chỗ thiếu bằng chứng, không tự mở thêm file hoặc giả định đã lưu thành công.
```
