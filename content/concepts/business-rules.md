---
id: business-rules
title: Quy tắc nghiệp vụ (Business rules)
group: systems
prerequisites: []
priority: 2
stage: 2
format: 2
signals:
  - "discount"
  - "coupon"
  - "stock"
  - "status ==="
  - "total"
---

## Đoán trước

Shop của bạn có mã `GIAM50`, giảm 50.000đ, mỗi khách chỉ được dùng một lần. Bạn nhắn cho AI: "Thêm ô nhập mã giảm giá vào trang thanh toán". AI làm xong, báo "đã hoàn thành và đã kiểm tra". Bạn nhập mã, thấy tổng tiền giảm đúng 50.000đ nên cho chạy thật. Cuối tuần đối soát, bạn thấy một khách đã dùng `GIAM50` cho 14 đơn liên tiếp, có đơn giá trị 60.000đ chỉ còn phải trả 10.000đ. Code không báo lỗi nào, tính năng chạy đúng như AI mô tả. Vậy cái sai nằm ở đâu?

### Đáp án

Cái sai nằm ở chỗ quy định "mỗi khách dùng một lần" chưa bao giờ có mặt trong code. Bạn chỉ yêu cầu "thêm ô nhập mã", AI làm đúng yêu cầu đó và tự đoán phần còn lại. Lần thử của bạn chỉ kiểm tra việc mã có trừ tiền hay không, không kiểm tra lần nhập thứ hai. **Quy tắc nghiệp vụ (business rule)** là quy định của việc kinh doanh mà phần mềm phải giữ trong mọi trường hợp. AI không biết quy tắc của riêng shop bạn. Quy tắc nào bạn không viết ra thì AI sẽ bỏ qua hoặc bịa một phiên bản nghe có vẻ hợp lý.

## Ví dụ mẫu

Một quán cà phê có những quy định không phụ thuộc vào ai đứng quầy: không bán chịu, hết sữa thì không nhận món có sữa, phiếu tặng chỉ dùng một lần. Nhân viên mới không tự biết các điều này. Chủ quán phải nói, và phải có chỗ kiểm soát để dù khách nài nỉ cũng không vượt qua được.

Trong app, quy tắc nghiệp vụ là những câu như "không bán quá tồn kho", "đơn đã giao thì không được hủy", "tổng tiền bằng giá nhân số lượng". Có hai điều cần đọc ra từ code AI viết:

- **Quy tắc có được viết ra không.** Mỗi quy tắc thường hiện thành một dòng kiểm tra rồi từ chối.
- **Quy tắc được giữ ở đâu.** Giữ ở giao diện (trình duyệt) thì người dùng vượt qua được. Giữ ở máy chủ hoặc trong database thì không.

Cách làm SAI: máy chủ nhận nguyên con số tổng tiền do trình duyệt gửi lên.

```ts
// SAI: file app/api/orders/route.ts
export async function POST(req: Request) {
  const { productId, quantity, total } = await req.json()
  // Không có dòng kiểm tra nào: gửi quantity = -3 hay total = 1 đều được lưu
  await supabase.from('orders').insert({ product_id: productId, quantity, total })
  return Response.json({ ok: true })
}
```

Cách làm ĐÚNG: mỗi quy tắc là một dòng đọc được, nằm ở máy chủ.

```ts
export async function POST(req: Request) {
  const { productId, quantity } = await req.json()
  const { data: product } = await supabase
    .from('products').select('price, stock').eq('id', productId).single()
  // Quy tắc 1: số lượng phải là số nguyên từ 1 trở lên
  if (!product || !Number.isInteger(quantity) || quantity < 1)
    return Response.json({ error: 'Đơn không hợp lệ' }, { status: 400 })
  // Quy tắc 2: không bán quá tồn kho
  if (quantity > product.stock)
    return Response.json({ error: 'Không đủ hàng' }, { status: 400 })
  // Quy tắc 3: tổng tiền do ___ tính lại từ giá trong database
  const total = product.price * quantity
  await supabase.from('orders').insert({ product_id: productId, quantity, total })
  return Response.json({ ok: true })
}
```

Bạn không cần viết được đoạn này. Bạn cần đếm được: tôi có ba quy tắc, code có đủ ba dòng kiểm tra tương ứng không, và chúng có nằm ở file chạy trên máy chủ không.

## Tìm trong project của bạn

1. **Viết quy tắc ra trước khi mở code.** Ghi 5 quy tắc quan trọng nhất của app bằng câu thường, mỗi câu có dạng "Không được... khi..." hoặc "Luôn phải...". Ví dụ: "Không được đặt lịch trùng giờ", "Gói miễn phí tối đa 3 dự án".
2. **Tìm chỗ code nhắc tới quy tắc.** Mở tìm kiếm toàn dự án (`Ctrl+Shift+F` / `Cmd+Shift+F`), tìm các từ khớp với quy tắc của bạn: `discount`, `coupon`, `stock`, `quantity`, `total`, `status`, `limit`, `plan`.
3. **Xem quy tắc nằm ở file nào.** File trong `app/api/`, file có `'use server'`, hoặc policy và ràng buộc trong Supabase là phía máy chủ. File có `'use client'` ở đầu là phía trình duyệt.
4. **Phân loại từng quy tắc:**
   - Thấy thế này là ổn: có dòng kiểm tra ở máy chủ, trả lỗi rõ ràng khi vi phạm; giao diện có thể kiểm tra thêm để báo sớm cho người dùng.
   - Thấy thế này là có vấn đề: quy tắc chỉ có trong file `'use client'`, chỉ thể hiện bằng nút bị ẩn hoặc bị làm mờ, hoặc tìm mãi không thấy ở đâu.
5. **Ghi lại kết quả của bạn:**
   - Quy tắc nào không tìm thấy trong code?: `[ ... ]`
   - Quy tắc nào chỉ được giữ ở giao diện?: `[ ... - tên file: ... ]`
   - Con số nào (giá, tổng tiền, số lượt còn lại) đang được trình duyệt gửi lên và máy chủ dùng luôn?: `[ ... ]`

## Tự giải thích

### Vì sao AI viết ra tính năng chạy được, không lỗi, mà vẫn sai quy tắc nghiệp vụ?

Vì "chạy được" và "đúng quy định của shop" là hai chuyện khác nhau. AI biết cách làm ô nhập mã giảm giá nói chung, nhưng không biết mã của bạn dùng mấy lần, có cộng dồn không, có áp cho hàng đang sale không. Thiếu thông tin thì AI chọn cách đơn giản nhất. Code vẫn chạy trơn tru vì với máy tính, giảm giá 14 lần cũng hợp lệ như giảm một lần.

### Nếu bỏ dòng kiểm tra tồn kho ở máy chủ, chỉ giữ việc làm mờ nút "Mua" khi hết hàng thì chuyện gì xảy ra?

Khách bình thường vẫn bị chặn, nên bạn thử tay sẽ thấy ổn. Nhưng hai khách mở trang cùng lúc khi còn một món đều thấy nút sáng và đều đặt được. Người rành kỹ thuật còn có thể gửi yêu cầu thẳng tới máy chủ mà không cần bấm nút. Kết quả là bán quá số hàng đang có, và bạn chỉ biết khi đi đóng gói.

### Vì sao nên viết quy tắc bằng câu thường trước khi nhờ AI làm, thay vì đợi AI làm xong rồi xem?

Vì danh sách quy tắc chính là thước đo để kiểm tra. Không có danh sách, bạn chỉ thử được những gì hiện trên màn hình, mà quy tắc bị thiếu thì không hiện ra chỗ nào cả. Có danh sách, bạn đưa nó cho AI ngay trong yêu cầu, rồi dò từng dòng: quy tắc này nằm ở file nào, thử vi phạm thì app phản ứng ra sao.

## Trắc nghiệm

### Bạn yêu cầu "gói Free chỉ được tạo tối đa 3 dự án". AI thêm đoạn này vào một file có `'use client'` và báo đã xong. Nhận định nào đúng?

```tsx
<button disabled={projects.length >= 3} onClick={createProject}>
  Tạo dự án mới
</button>
```

- [ ] Quy tắc đã được giữ vì nút bị khóa khi đủ 3 dự án
- [x] Quy tắc mới chỉ được nhắc ở giao diện; cần thêm bước đếm và từ chối ở máy chủ
- [ ] Sai ở chỗ phải dùng `> 3` thay vì `>= 3`

**Giải thích:** Nút bị khóa chỉ là lời nhắc trên trình duyệt của người dùng. Nơi tạo dự án ở máy chủ vẫn nhận yêu cầu thứ tư nếu không tự đếm lại. Điều kiện `>= 3` thì đúng với câu "tối đa 3": khi đã có 3 dự án thì khóa nút.

### AI báo: "Đã thêm tính năng hủy đơn. Đã kiểm tra: bấm Hủy thì trạng thái đơn chuyển sang `cancelled`." Quy tắc của bạn là đơn đã giao cho bên vận chuyển thì không được hủy. Việc nên làm tiếp theo là gì?

- [x] Tạo một đơn thử ở trạng thái đã giao vận chuyển rồi bấm Hủy, xem app có từ chối không
- [ ] Không cần làm gì, vì AI đã kiểm tra
- [ ] Bấm Hủy thêm vài đơn mới tạo để chắc chắn tính năng ổn định
- [ ] Ẩn nút Hủy ở trang chi tiết đơn đã giao là đủ

**Giải thích:** AI chỉ kiểm tra trường hợp thuận lợi. Quy tắc nghiệp vụ được kiểm chứng bằng cách cố tình vi phạm nó. Thử thêm nhiều đơn mới tạo vẫn là thử cùng một trường hợp. Ẩn nút không ngăn được yêu cầu gửi thẳng tới máy chủ.

### Đoạn code áp mã giảm giá ở máy chủ như sau. Quy tắc nào của shop đang KHÔNG được giữ?

```ts
const { data: coupon } = await supabase
  .from('coupons').select('amount, expires_at').eq('code', code).single()
if (!coupon) return Response.json({ error: 'Mã không tồn tại' }, { status: 400 })
if (new Date(coupon.expires_at) < new Date())
  return Response.json({ error: 'Mã đã hết hạn' }, { status: 400 })
const total = subtotal - coupon.amount
```

- [ ] Mã phải tồn tại
- [ ] Mã hết hạn thì không được dùng
- [x] Mỗi khách chỉ dùng mã một lần, và tổng tiền không được âm

**Giải thích:** Đọc từng dòng kiểm tra: có dòng cho "mã tồn tại", có dòng cho "còn hạn". Không có dòng nào tra xem khách này đã dùng mã chưa, cũng không có dòng nào chặn trường hợp `coupon.amount` lớn hơn `subtotal`. Quy tắc không có dòng tương ứng thì coi như chưa tồn tại.

### Bạn sắp nhờ AI làm tính năng hoàn tiền. Cách giao việc nào giúp giữ quy tắc tốt nhất?

- [ ] "Làm tính năng hoàn tiền giống các shop lớn"
- [ ] "Làm tính năng hoàn tiền, nhớ làm kỹ và bảo mật"
- [ ] "Làm nút Hoàn tiền ở trang đơn hàng, chỉ admin mới thấy nút"
- [x] "Hoàn tiền chỉ trong 7 ngày từ lúc giao, mỗi đơn một lần, không vượt số tiền đã trả; kiểm tra ở máy chủ"

**Giải thích:** Phương án cuối nêu từng quy tắc thành câu kiểm chứng được và nói rõ nơi phải giữ. "Giống shop lớn" hay "làm kỹ" để AI tự đoán quy định. "Chỉ admin thấy nút" mới nói về giao diện, chưa nói gì về thời hạn và số tiền.

## Kiểm tra không dùng AI

### Tình huống: App đặt lịch spa của bạn có quy tắc "một kỹ thuật viên không nhận hai khách cùng khung giờ". AI viết phần kiểm tra như dưới đây trong trang đặt lịch (file có `'use client'`). Hãy nêu ít nhất hai cách quy tắc này vẫn bị phá, và quy tắc cần được giữ ở đâu.

```tsx
// bookings: danh sách lịch đã tải về lúc khách mở trang
const taken = bookings.some(b => b.staff_id === staffId && b.slot === slot)
if (taken) {
  alert('Khung giờ này đã có khách')
} else {
  await fetch('/api/bookings', { method: 'POST', body: JSON.stringify({ staffId, slot }) })
}
```

#### Đáp án

1. **Dữ liệu cũ:** `bookings` được tải lúc mở trang. Hai khách mở trang cùng lúc đều thấy khung giờ trống, đều qua được bước kiểm tra và đều gửi yêu cầu đặt. Kết quả là trùng lịch.
2. **Đi vòng qua giao diện:** bước kiểm tra chạy trên trình duyệt. Ai gửi thẳng yêu cầu tới `/api/bookings` thì không đi qua dòng `if (taken)`.
3. **Nơi cần giữ quy tắc:** trong `app/api/bookings/route.ts`, máy chủ phải tự tra database xem khung giờ đã có lịch chưa rồi mới lưu. Chắc hơn nữa là đặt ràng buộc không trùng (unique) trên cặp cột kỹ thuật viên và khung giờ ngay trong database, để lần ghi thứ hai bị từ chối dù hai yêu cầu đến gần như cùng lúc.
4. Phần kiểm tra ở giao diện vẫn nên giữ để báo sớm cho khách, nhưng nó chỉ là tiện ích, không phải chốt chặn.

## Lỗi suy luận hay gặp

### "AI giỏi thế thì tự hiểu quy định bán hàng thông thường"

- **Vì sao sai:** Không có quy định "thông thường". Shop này cho cộng dồn mã, shop kia không; nơi cho hủy trong 24 giờ, nơi không cho hủy. AI chọn một phương án phổ biến và không báo cho bạn biết nó vừa quyết định hộ.
- **Cách sửa:** Viết quy tắc thành danh sách và dán vào yêu cầu. Cuối yêu cầu thêm câu: "Liệt kê những quy tắc bạn phải tự giả định".

### "Tôi thử trên màn hình thấy bị chặn rồi, vậy là quy tắc đã được giữ"

- **Vì sao sai:** Màn hình chỉ cho thấy lớp giao diện. Nút bị ẩn, ô nhập bị giới hạn đều nằm ở trình duyệt, nơi người dùng sửa được.
- **Cách sửa:** Với mỗi quy tắc liên quan tới tiền, hàng, quyền hoặc hạn mức, tìm cho ra dòng kiểm tra ở máy chủ hoặc ràng buộc trong database. Không tìm thấy thì ghi nhận là chưa có.

### "Chạy thử một đơn đúng là tính toán đúng"

- **Vì sao sai:** Quy tắc thường hỏng ở trường hợp biên: số lượng bằng 0, mã dùng lần hai, đơn đúng bằng ngưỡng miễn phí ship, hai người thao tác cùng lúc.
- **Cách sửa:** Với mỗi quy tắc, thử ít nhất ba ca: một ca hợp lệ, một ca vi phạm rõ ràng và một ca nằm ngay trên ranh giới.

## Bài tập thực hành

Mục tiêu: có một bảng quy tắc nghiệp vụ cho app của bạn và biết quy tắc nào đang thật sự được giữ. Làm trên máy cá nhân hoặc bản preview, với dữ liệu thử.

### Việc cần làm

1. Tạo file `docs/business-rules.md` trong project, ghi 5 quy tắc quan trọng nhất bằng câu thường.
2. Với mỗi quy tắc, thêm ba cột: nơi giữ (giao diện / máy chủ / database / chưa thấy), tên file, cách thử vi phạm.
3. Dùng tìm kiếm toàn dự án để điền cột nơi giữ và tên file.
4. Chọn 2 quy tắc liên quan tới tiền hoặc hàng. Dùng tài khoản thử và sản phẩm thử để cố tình vi phạm từng quy tắc.
5. Ghi lại app phản ứng thế nào: từ chối kèm thông báo, im lặng, hay vẫn cho qua.

### Kết quả đúng

Bạn có bảng 5 dòng, mỗi dòng trả lời được "quy tắc này nằm ở file nào" hoặc ghi rõ "chưa thấy trong code". Hai quy tắc đã thử có kết quả cụ thể. Mọi dòng "chỉ ở giao diện" hoặc "chưa thấy" là danh sách việc cần giao tiếp cho AI.

### Nhờ AI rà lại

```text
Đây là danh sách quy tắc nghiệp vụ của tôi trong docs/business-rules.md.
Với từng quy tắc, hãy chỉ ra file và dòng code đang thực thi nó,
và cho biết nó được kiểm tra ở trình duyệt, ở máy chủ hay trong database.
Quy tắc nào không tìm thấy thì ghi rõ "chưa có".
Chỉ báo cáo, không sửa bất kỳ file nào.
```
