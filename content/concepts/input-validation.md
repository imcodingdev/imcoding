---
id: input-validation
title: Kiểm tra đầu vào phía máy chủ
group: auth
prerequisites: [forms-validation, api-endpoint, error-handling]
priority: 1
stage: 3
format: 2
signals:
  - "safeParse"
  - "zod"
  - "req.json()"
  - "formData.get("
  - "'use server'"
---

## Nhắc lại

### Việc kiểm tra ở biểu mẫu trên giao diện (ô bắt buộc, `min`, `max`, báo đỏ khi nhập sai) giúp được gì và không giúp được gì?

Nó giúp người dùng tử tế biết mình nhập sai ngay, không phải chờ máy chủ trả lời. Nó không ngăn được người cố tình, vì họ có thể sửa giao diện hoặc gửi yêu cầu thẳng tới máy chủ mà không qua biểu mẫu.

### Ai gọi được một API endpoint như `POST /api/orders`, và khi dữ liệu gửi lên không hợp lệ thì máy chủ nên trả mã trạng thái nào?

Bất kỳ ai biết địa chỉ đều gọi được, không cần dùng giao diện của bạn. Dữ liệu không hợp lệ thì trả `400` kèm thông báo lỗi rõ ràng, không được lặng lẽ xử lý tiếp.

## Đoán trước

Trên bản thử của ứng dụng đặt lớp học, đối tác dùng một script gọi thẳng `POST /api/bookings`, không mở website hay biểu mẫu. Yêu cầu có phiên đăng nhập hợp lệ nhưng gửi `seats: "hai"` và mã buổi học `BUOI_GIA_KHONG_CO`. API vẫn trả `201` và ghi một bản đặt chỗ sai vào database. Trong `route.ts`, AI chỉ đọc `await req.json()` rồi chuyển dữ liệu cho hàm lưu, với lý do “form đã kiểm tra rồi, JSON đọc được là hợp lệ”. Vì sao cả đăng nhập thành công lẫn đọc được JSON đều chưa đủ để API nhận bản đặt chỗ này?

### Đáp án

Script bỏ qua toàn bộ giao diện và gọi trực tiếp API, nên không chạy bất kỳ kiểm tra nào của form. Phiên đăng nhập chỉ xác định người gọi; đọc JSON chỉ xác nhận cú pháp gói dữ liệu. Máy chủ còn phải kiểm `seats` là số nguyên trong khoảng cho phép, buổi học tồn tại và người gọi được đặt buổi đó, trước khi ghi database. Chuỗi `"hai"` phải bị từ chối với mã `400`; mã buổi không tồn tại cần được xử lý bằng phản hồi phù hợp, chẳng hạn `404`, thay vì báo đã tạo thành công.

## Ví dụ mẫu

Quầy thu ngân không tính tiền theo tờ giấy khách tự ghi. Nhân viên quét từng món, máy tra giá, và từ chối khi mã vạch lạ hoặc số lượng vô lý. Tờ giấy của khách chỉ là lời đề nghị.

**Input validation (kiểm tra đầu vào)** phía máy chủ là bước đó. Mọi dữ liệu đi từ trình duyệt vào route hoặc Server Action phải qua ba câu hỏi:

- **Kiểu:** đây có đúng là số nguyên, chuỗi, ngày tháng như mong đợi không?
- **Khoảng giá trị:** số lượng từ 1 đến 20, ghi chú tối đa 500 ký tự, trạng thái nằm trong danh sách cho trước.
- **Quyền:** món này có tồn tại và đang bán không, bản ghi này có thuộc về người gọi không.

Có ba thứ máy chủ **không nhận** từ trình duyệt mà tự lấy: giá và tổng tiền (tra trong database), `userId` (đọc từ phiên đăng nhập), vai trò và gói dịch vụ (tra trong database).

Cách làm SAI:

```ts
// SAI: dùng thẳng những gì trình duyệt gửi lên
export async function POST(req: Request) {
  const { productId, quantity, userId } = await req.json()
  const product = await getProduct(productId)
  const total = product.price * quantity   // quantity có thể là -29 hoặc "abc"
  await saveOrder({ userId, productId, quantity, total })
  return Response.json({ ok: true })
}
```

Cách làm ĐÚNG, dùng thư viện Zod để mô tả dữ liệu hợp lệ:

```ts
const OrderInput = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
})
export async function POST(req: Request) {
  const user = await requireUser()             // userId lấy từ phiên đăng nhập
  const parsed = OrderInput.safeParse(await req.json())
  if (!parsed.success) return Response.json({ error: 'Dữ liệu không hợp lệ' }, { status: ___ })
  const { productId, quantity } = parsed.data  // chỉ còn 2 trường đã kiểm
  const product = await getProduct(productId)
  if (!product?.active) return Response.json({ error: 'Không có món này' }, { status: 404 })
  await saveOrder({ userId: user.id, productId, quantity, total: product.price * quantity })
  return Response.json({ ok: true }, { status: 201 })
}
```

Điểm cần nhìn khi đọc code AI viết: giữa dòng nhận dữ liệu (`req.json()`, `formData.get(...)`, tham số của Server Action) và dòng dùng dữ liệu (ghi database, tính tiền, gọi dịch vụ ngoài) phải có một bước kiểm tra. Sau bước đó code chỉ dùng kết quả đã kiểm (`parsed.data`), không quay lại dùng dữ liệu thô. `z.object` mặc định bỏ đi các trường không khai báo, nên trường lạ như `userId` hay `role` gửi kèm sẽ không lọt qua.

## Tìm trong project của bạn

1. **Liệt kê các cửa nhận dữ liệu.** Tìm toàn dự án `req.json()`, `formData.get(`, `searchParams.get(`, và các file có `'use server'`. Mỗi kết quả là một chỗ dữ liệu từ trình duyệt đi vào máy chủ.
2. **Tìm bước kiểm tra.** Tìm `safeParse`, `.parse(`, `z.object`. Nếu project không dùng Zod, tìm các câu `if` kiểm tra kiểu và khoảng ngay sau dòng nhận dữ liệu.
3. **Tìm các trường không được tin.** Tìm `price`, `total`, `amount`, `discount`, `userId`, `role`, `plan`, `isAdmin` trong các file ở bước 1.
   - Ổn: các giá trị này được tra từ database hoặc đọc từ phiên đăng nhập.
   - Có vấn đề: chúng được lấy ra từ `req.json()`, `formData` hoặc tham số của Server Action.
4. **Tìm chỗ ghi nguyên cả gói dữ liệu.** Tìm `.update(data)`, `.insert(body)`, `...body`, `...data`. Ghi nguyên một object từ trình duyệt vào database nghĩa là người gửi tự chọn được cột để ghi.
5. **Ghi lại kết quả:**
   - Route hoặc Server Action nào nhận dữ liệu mà không có bước kiểm tra?: `[ ... ]`
   - Chỗ nào lấy giá, tổng tiền, `userId` hoặc vai trò từ trình duyệt?: `[ ... ]`
   - Chỗ nào ghi nguyên object từ trình duyệt vào database?: `[ ... ]`

## Tự giải thích

### Code đã khai báo kiểu TypeScript `quantity: number`. Vì sao lúc chạy thật `quantity` vẫn có thể là chuỗi `"abc"` hoặc số âm?

Kiểu TypeScript chỉ dùng lúc viết và build code, đến lúc chạy thì không còn. Nó không kiểm dữ liệu thật đang đi vào. Dữ liệu từ `req.json()` có hình dạng gì là do người gửi. Kiểu `number` cũng không nói gì về khoảng giá trị: `-29` và `1.5` đều là số. Phải có bước kiểm chạy thật, như `safeParse`.

### Vì sao kiểm tra "đúng kiểu, đúng khoảng" vẫn chưa đủ, mà còn cần kiểm tra quyền?

Vì một giá trị hợp lệ về hình thức vẫn có thể trỏ tới thứ người gọi không được đụng. `orderId` là một mã đúng định dạng, nhưng đơn đó có thể của người khác. Mã giảm giá đúng định dạng nhưng có thể đã hết hạn hoặc chỉ dành cho khách khác. Bước này phải tra database và so với người đang đăng nhập.

## Trắc nghiệm

### Claude Code viết Server Action dưới đây và báo "đã kiểm tra đăng nhập, an toàn". Rủi ro còn lại là gì?

```ts
'use server'
export async function applyDiscount(orderId: string, percent: number) {
  const user = await requireUser()
  const order = await getOrderOf(user.id, orderId)
  await setTotal(order.id, order.subtotal * (1 - percent / 100))
}
```

- [ ] Không còn rủi ro, vì đã lấy đơn hàng theo đúng người đăng nhập
- [x] `percent` do trình duyệt gửi lên và không bị giới hạn, người gọi truyền `100` hoặc lớn hơn để tổng tiền bằng 0 hoặc âm
- [ ] `orderId` kiểu `string` là sai, phải là `number`
- [ ] Server Action không gọi được từ ngoài giao diện nên `percent` luôn đúng

**Giải thích:** Phần quyền đã ổn vì đơn được lấy theo `user.id`. Nhưng mức giảm là giá trị người gọi tự chọn. Server Action gọi được trực tiếp với tham số bất kỳ, như một API endpoint. Mức giảm phải do máy chủ tra từ mã giảm giá hợp lệ, không nhận từ trình duyệt.

### Log máy chủ ghi lại một yêu cầu tới `POST /api/checkout` có nội dung như dưới đây. Route chỉ cần `items`. Cách xử lý nào đúng?

```json
{ "items": [{ "productId": "p_12", "quantity": 2 }],
  "total": 1000, "userId": "u_999", "role": "admin" }
```

- [ ] Dùng `total` và `userId` trong yêu cầu cho nhanh, vì đã có sẵn
- [ ] Chặn vĩnh viễn địa chỉ IP này rồi xử lý đơn như bình thường
- [x] Chỉ lấy `items` qua bước kiểm tra; tổng tiền tự tính từ database, người đặt lấy từ phiên đăng nhập, các trường thừa không được dùng
- [ ] So `total` trong yêu cầu với giá hiển thị trên giao diện

**Giải thích:** Trường thừa không gây hại nếu code không bao giờ đọc chúng. Nguy hiểm là khi code dùng `total`, `userId`, `role` do người gửi tự điền. Giá hiển thị trên giao diện cũng nằm ở trình duyệt nên không phải nguồn đối chiếu.

### Bạn nhờ AI "thêm validation cho form đăng ký". AI sửa đúng một file `components/SignupForm.tsx` có `'use client'`, thêm thông báo đỏ khi email sai định dạng. Kết luận nào đúng?

- [x] Mới có kiểm tra ở giao diện; cần mở route hoặc Server Action nhận form này xem máy chủ có kiểm lại không
- [ ] Đã đủ, vì form không cho bấm gửi khi dữ liệu sai
- [ ] Đã đủ, vì `'use client'` nghĩa là code chạy an toàn trên máy khách
- [ ] Cần xóa kiểm tra ở giao diện vì nó thừa

**Giải thích:** File `'use client'` chạy trên trình duyệt, người dùng bỏ qua được. Kiểm tra ở giao diện vẫn nên giữ vì nó giúp trải nghiệm. Việc còn thiếu là xác nhận bên nhận ở máy chủ có bước kiểm tương ứng.

### Route nhận `page` từ đường dẫn bằng `searchParams.get('page')` rồi dùng để tính vị trí lấy dữ liệu. Vì sao vẫn phải kiểm tra dù đây chỉ là số trang?

- [ ] Không cần kiểm tra, vì số trang không phải dữ liệu nhạy cảm
- [ ] Vì `searchParams` chỉ dùng được trong file `'use client'`
- [ ] Vì số trang phải lấy từ phiên đăng nhập
- [x] Vì giá trị luôn là chuỗi do người gọi tự gõ, có thể là chữ, số âm hoặc số cực lớn, làm truy vấn lỗi hoặc tốn tài nguyên

**Giải thích:** Tham số trên đường dẫn là đầu vào như mọi đầu vào khác, và luôn ở dạng chuỗi. `page=abc` hay `page=-5` có thể làm truy vấn lỗi, còn kích thước trang không giới hạn có thể kéo cả bảng về. Cần đổi sang số nguyên và đặt khoảng hợp lệ.

## Kiểm tra không dùng AI

### Tình huống: Trang "Hồ sơ của tôi" cho sửa họ tên và ảnh đại diện. AI viết Server Action dưới đây. Bảng `profiles` còn có cột `role` và `credits`, và policy RLS cho phép mỗi người sửa dòng của chính mình. Hãy nêu rủi ro, vì sao kiểm tra đăng nhập và RLS không ngăn được, và cách sửa.

```ts
'use server'
export async function updateProfile(data: Profile) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Chưa đăng nhập')
  await supabase.from('profiles').update(data).eq('id', user.id)
}
```

#### Đáp án

1. **Rủi ro:** `data` là nguyên object do trình duyệt gửi và được ghi thẳng vào database. Người dùng gọi action này với `{ role: 'admin', credits: 999999 }` là tự nâng quyền và tự cộng điểm cho mình.
2. **Vì sao các lớp khác không ngăn được:** kiểm tra đăng nhập qua vì họ đăng nhập thật. RLS qua vì họ sửa đúng dòng của mình; RLS quyết định theo dòng, không theo cột. Kiểu `Profile` của TypeScript không kiểm tra gì lúc chạy.
3. **Cách sửa:** khai báo danh sách trường được phép sửa, ví dụ một schema Zod chỉ gồm `full_name` (chuỗi, tối đa 100 ký tự) và `avatar_url` (đường dẫn hợp lệ). Chạy `safeParse`, trả lỗi khi không hợp lệ, và chỉ ghi `parsed.data`.
4. **Thêm một lớp nữa:** `role` và `credits` chỉ được đổi qua đường riêng ở máy chủ, có kiểm tra người gọi là quản trị viên hoặc sau khi thanh toán được xác nhận.

## Lỗi suy luận hay gặp

### "Giao diện không cho nhập sai thì máy chủ không bao giờ nhận dữ liệu sai"

- **Vì sao sai:** Giao diện chỉ là một trong nhiều cách gửi yêu cầu. Người gửi dùng DevTools hoặc công cụ khác là bỏ qua toàn bộ ô nhập, nút bấm, thuộc tính `min` và `required`.
- **Cách sửa:** Với mỗi quy tắc kiểm tra trên giao diện, tìm quy tắc tương ứng trong code máy chủ. Không tìm thấy thì coi như chưa có.

### "Đã lấy giá từ database rồi thì phần tính tiền an toàn"

- **Vì sao sai:** Tổng tiền là kết quả của nhiều giá trị: giá, số lượng, mức giảm, phí giao hàng. Chỉ cần một giá trị trong đó còn lấy từ trình duyệt mà không kiểm là tổng tiền bị điều khiển được.
- **Cách sửa:** Lần ngược phép tính tổng tiền, với từng thành phần hỏi "giá trị này đến từ đâu". Thành phần nào đến từ trình duyệt thì phải có kiểm tra kiểu và khoảng; mức giảm thì phải tra lại ở máy chủ.

## Bài tập thực hành

Mục tiêu: chọn một biểu mẫu quan trọng trong app và xác nhận máy chủ tự kiểm lại dữ liệu, không dựa vào giao diện. Làm trên máy cá nhân hoặc bản preview, bằng tài khoản thử.

### Việc cần làm

1. Chọn một biểu mẫu có số hoặc tiền, ví dụ đặt hàng, đặt lịch, nạp điểm.
2. Mở DevTools, tab Network, gửi biểu mẫu một lần với dữ liệu thử. Chép lại danh sách các trường trình duyệt đã gửi.
3. Tìm route hoặc Server Action nhận yêu cầu đó. Lập bảng bốn cột: tên trường, có kiểm kiểu không, có kiểm khoảng không, có nên lấy từ máy chủ thay vì từ trình duyệt không.
4. Trong tab Elements, xóa thuộc tính `min` hoặc `required` của một ô, nhập một giá trị vô lý như số lượng `-1`, rồi gửi.
5. Ghi lại máy chủ trả gì và database thử có thêm bản ghi vô lý nào không.

### Kết quả đúng

Ở bước 4, máy chủ trả lỗi `400` kèm thông báo, và không có bản ghi mới nào được tạo. Bảng ở bước 3 không còn trường nào thuộc nhóm giá, tổng tiền, `userId`, vai trò mà lấy từ trình duyệt. Nếu máy chủ nhận giá trị vô lý, bạn đã tìm ra đúng chỗ cần giao cho AI sửa, kèm cách thử lại.

### Nhờ AI rà lại

```text
Hãy rà mọi route trong app/api và mọi Server Action ('use server') của project.
Với mỗi nơi, liệt kê: các trường nhận từ trình duyệt, trường nào có kiểm kiểu
và khoảng giá trị ở máy chủ, trường nào được dùng mà chưa kiểm.
Đánh dấu riêng: nơi lấy giá, tổng tiền, mức giảm, userId, role từ trình duyệt;
nơi ghi nguyên object từ trình duyệt vào database.
Chỉ báo cáo theo từng file kèm số dòng. Không sửa code.
```
