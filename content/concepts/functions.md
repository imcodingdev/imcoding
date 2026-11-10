---
id: functions
title: Hàm, đầu vào và đầu ra
group: backend
prerequisites: [control-flow]
priority: 2
stage: 2
format: 2
signals:
  - "function "
  - "=> {"
  - "return "
  - "async "
  - "await "
---

## Nhắc lại

### Code có đủ ba mức phí giao hàng nhưng đơn 800.000đ vẫn không được miễn phí. Nguyên nhân thường gặp là gì?

Điều kiện được đọc từ trên xuống và dừng ở điều kiện đúng đầu tiên. Nếu câu hỏi "trên 100.000đ?" đứng trước câu hỏi "trên 500.000đ?", đơn lớn dừng ngay ở mức đầu và không bao giờ tới nhánh miễn phí.

### Vì sao một `return` nằm trong vòng lặp có thể khiến chỉ món đầu tiên trong giỏ được kiểm tra?

Vì `return` kết thúc luôn cả đoạn code đang chạy, không chỉ kết thúc một vòng. Gặp `return` ở món đầu thì các món sau không được xét.

## Đoán trước

Bạn nhờ AI làm trang quản trị, chỉ admin mới được xóa sản phẩm. AI viết một đoạn tên là `isAdmin`, đoạn này tra database xem người đang đăng nhập có vai trò admin không. Ở chỗ xóa sản phẩm, AI viết `if (isAdmin(user))` rồi mới cho xóa. Bạn đọc thấy hợp lý: có kiểm tra, tên rõ ràng. Bạn đăng nhập bằng tài khoản admin, xóa thử một sản phẩm mẫu, chạy tốt. Hôm sau một nhân viên bán hàng lỡ tay xóa mất ba sản phẩm đang bán. Đoạn kiểm tra vẫn nằm nguyên đó và tài khoản nhân viên không hề là admin. Vì sao nhân viên vẫn xóa được?

### Đáp án

Vì `isAdmin` phải đi hỏi database, một việc tốn thời gian. Loại đoạn code như vậy được đánh dấu `async` và không trả ngay câu trả lời đúng/sai. Nó trả về một **lời hứa (Promise)**: "lát nữa sẽ có kết quả". Muốn lấy kết quả thật thì phải có chữ `await` đứng trước để chờ. AI quên `await`, nên `if` nhận về một lời hứa. Lời hứa là một vật có thật, và `if` coi mọi vật có thật là đúng. Kết quả: ai cũng qua được, kể cả khi đáp án cuối cùng là "không phải admin". Bạn thử bằng tài khoản admin nên không thể thấy lỗi này.

## Ví dụ mẫu

Hãy nghĩ tới máy pha cà phê tự động. Bạn bỏ vào **đầu vào**: loại hạt, lượng nước. Máy trả ra **đầu ra**: một ly cà phê. Ngoài ra máy còn làm vài việc bạn không cầm trên tay: thải bã, trừ nước trong bình. Bạn không cần biết bên trong máy chạy thế nào, nhưng phải biết bỏ gì vào và nhận lại gì.

**Hàm (function)** là một đoạn code được đặt tên, hoạt động đúng như vậy. Khi đọc một hàm AI viết, tìm bốn thứ:

- **Tên**: lời hứa về việc hàm làm. Chỉ là lời hứa.
- **Đầu vào (tham số)**: nằm trong ngoặc tròn sau tên. Thứ tự có ý nghĩa.
- **Đầu ra**: thứ đứng sau chữ `return`. Nhánh nào không có `return` thì đầu ra là `undefined` (rỗng).
- **Tác động phụ (side effect)**: việc hàm làm ra thế giới bên ngoài, như ghi database, gửi email, trừ tiền.

Cách làm SAI: hàm tra mã giảm giá có một nhánh không trả về gì.

```ts
function getDiscount(code: string) {
  if (code === 'GIAM50') return 50000
  if (code === 'GIAM20') return 20000
  // Mã lạ: không có return, đầu ra là undefined
}
const total = 300000 - getDiscount('ABC')   // 300000 - undefined = NaN
```

Cách làm ĐÚNG: mọi nhánh đều có đầu ra, và nơi gọi biết chờ.

```ts
function getDiscount(code: string) {
  if (code === 'GIAM50') return 50000
  if (code === 'GIAM20') return 20000
  return 0                                  // mã lạ: không giảm
}

async function isAdmin(userId: string) {    // async: hàm trả về lời hứa
  const { data } = await supabase
    .from('profiles').select('role').eq('id', userId).single()
  return data?.role === 'admin'             // đầu ra: true hoặc false
}

if (___ isAdmin(user.id)) { /* cho phép xóa */ }
```

Khi đọc chỗ gọi hàm, đối chiếu ba điều: đưa vào đúng thứ, đúng thứ tự chưa; hàm `async` đã được chờ chưa; đầu ra có được dùng và kiểm tra không.

## Tìm trong project của bạn

1. **Tìm các hàm phải chờ.** Mở tìm kiếm toàn dự án (`Ctrl+Shift+F` / `Cmd+Shift+F`), tìm `async function` và `async (`. Ghi lại tên các hàm liên quan tới quyền, tiền, lưu dữ liệu.
2. **Soát nơi gọi.** Tìm từng tên hàm đó. Ở mỗi chỗ gọi, xem ngay phía trước có `await` không. Đặc biệt chú ý chỗ gọi nằm trong `if (...)`.
3. **Soát đầu ra của lệnh Supabase.** Tìm `await supabase`. Lệnh của Supabase thường không tự báo lỗi đỏ khi thất bại mà trả về một cặp `{ data, error }`. Xem code có lấy `error` ra và xử lý không, hay chỉ lấy `data`.
4. **Soát các nhánh trả về.** Mở một hàm tính toán quan trọng, đếm số chữ `return`. Đi theo từng nhánh `if` xem có nhánh nào rơi xuống cuối hàm mà không có `return` không.
5. **Soát hàm mà trình duyệt gọi được.** Tìm `'use server'`. Hàm `async` được `export` trong file này là Server Action. Dù code chạy ở máy chủ, trình duyệt vẫn gửi yêu cầu gọi nó được, nên bên trong hàm phải tự kiểm tra đăng nhập và quyền.
6. **Phân loại:**
   - Thấy thế này là ổn: hàm `async` được gọi kèm `await`; `error` được kiểm tra trước khi báo thành công; mọi nhánh có `return` rõ ràng.
   - Thấy thế này là có vấn đề: `if (tenHam(...))` với hàm `async` mà thiếu `await`; chỉ lấy `{ data }`; hàm lưu dữ liệu không trả về gì để nơi gọi biết kết quả.
7. **Ghi lại kết quả của bạn:**
   - Hàm `async` nào bị gọi thiếu `await`?: `[ ... - tên file: ... ]`
   - Lệnh Supabase nào bỏ qua `error`?: `[ ... ]`
   - Server Action nào chưa kiểm tra quyền bên trong?: `[ ... ]`

## Tự giải thích

### Vì sao thiếu một chữ `await` lại biến câu kiểm tra quyền thành "ai cũng qua"?

Hàm `async` trả về lời hứa trước, kết quả thật đến sau. Không có `await`, câu `if` xét chính lời hứa đó. Lời hứa luôn tồn tại nên luôn được coi là đúng, bất kể kết quả sau này là `true` hay `false`. Không có lỗi nào hiện ra. Trường hợp duy nhất bạn thấy "đúng" là khi thử bằng tài khoản có quyền.

### Nếu một hàm lưu đơn hàng không trả về gì, nơi gọi nó mất khả năng gì?

Mất khả năng biết việc lưu thành hay bại. Nơi gọi chỉ còn cách đi tiếp như thể đã lưu xong: gửi email xác nhận, trừ tồn kho, hiện "Đặt hàng thành công". Nếu database từ chối, khách nhận email cho một đơn không tồn tại. Đầu ra của hàm là kênh duy nhất để báo kết quả cho bước sau.

### Vì sao không nên tin tên hàm khi đọc code AI viết?

Tên chỉ là nhãn do AI đặt lúc viết. Sau vài lần sửa, hàm `getUser` có thể đã tạo thêm bản ghi, hàm `validateOrder` có thể chỉ kiểm tra một trong năm điều kiện. Thứ quyết định hàm làm gì là các dòng bên trong: nó đọc gì, ghi gì, trả về gì. Với hàm chạm tới tiền, quyền hoặc xóa dữ liệu, cần mở ra đọc thay vì đoán theo tên.

## Trắc nghiệm

### AI viết hàm tính tiền sau giảm giá và một chỗ gọi nó. Khách có đơn 400.000đ, mã giảm 10%. Khách phải trả bao nhiêu?

```ts
function applyDiscount(total: number, percent: number) {
  return total - (total * percent) / 100
}
const pay = applyDiscount(10, 400000)
```

- [ ] 360.000đ
- [x] Một số âm, vì hai đầu vào bị đưa ngược thứ tự
- [ ] App báo lỗi vì sai thứ tự tham số

**Giải thích:** Hàm nhận tổng tiền trước, phần trăm sau. Chỗ gọi lại đưa `10` làm tổng tiền và `400000` làm phần trăm, kết quả là 10 trừ 40.000, ra âm 39.990. Cả hai đều là số nên không công cụ nào báo lỗi. Phải đối chiếu thứ tự ở chỗ gọi với thứ tự ở chỗ khai báo.

### Đoạn lưu hồ sơ ở máy chủ như sau. Database từ chối lệnh vì vi phạm một ràng buộc của bảng. Người dùng thấy gì?

```ts
const { data } = await supabase.from('profiles').update({ name }).eq('id', id)
return Response.json({ message: 'Đã lưu hồ sơ' })
```

- [ ] Thông báo lỗi từ database
- [ ] Trang bị trắng vì code dừng ở dòng đầu
- [ ] Không thấy gì cho tới khi tải lại
- [x] "Đã lưu hồ sơ", dù không có gì được lưu

**Giải thích:** Lệnh Supabase trả về cặp `{ data, error }` và không tự làm code dừng lại khi thất bại. Đoạn này chỉ lấy `data`, bỏ rơi `error`, rồi báo thành công vô điều kiện. Đầu ra của hàm có hai phần, và phần báo lỗi đang không ai đọc.

### Trong file có `'use server'` ở đầu, AI viết hàm dưới đây và gọi nó từ nút "Xóa" chỉ hiện với admin. Nhận định nào đúng?

```ts
export async function deleteProduct(id: string) {
  await supabase.from('products').delete().eq('id', id)
}
```

- [x] Hàm này là cổng mà trình duyệt gọi được; thiếu bước kiểm tra người gọi ngay bên trong hàm
- [ ] An toàn, vì hàm chạy ở máy chủ nên người ngoài không gọi được
- [ ] An toàn, vì nút Xóa đã ẩn với người không phải admin

**Giải thích:** Server Action chạy ở máy chủ nhưng được mở ra để trình duyệt gọi tới. Ẩn nút chỉ là giao diện. Đầu vào `id` do trình duyệt gửi lên, và hàm không hỏi "ai đang gọi". Bước kiểm tra đăng nhập và quyền phải nằm trong chính hàm này.

### AI báo "đã thêm kiểm tra hạn mức trước khi gọi AI tạo ảnh". Code như sau, `hasQuota` là hàm `async`. Người dùng đã hết lượt có tạo được ảnh không?

```ts
const allowed = hasQuota(user.id)
if (!allowed) return Response.json({ error: 'Hết lượt' }, { status: 429 })
await generateImage(prompt)
```

- [ ] Không, vì có dòng kiểm tra `if (!allowed)`
- [x] Có, vì thiếu `await` nên `allowed` là một lời hứa, luôn được coi là đúng
- [ ] Không, vì mã 429 chặn mọi yêu cầu
- [ ] Có, nhưng chỉ ở lần gọi đầu tiên

**Giải thích:** `hasQuota(user.id)` không có `await` nên `allowed` giữ lời hứa chứ không giữ `true` hay `false`. `!allowed` vì thế luôn sai và dòng chặn không bao giờ chạy. Có dòng kiểm tra trong code không có nghĩa dòng đó đang nhận đúng đầu ra.

## Kiểm tra không dùng AI

### Tình huống: Khách phản ánh nhận được email "Đặt hàng thành công" nhưng shop không thấy đơn. AI viết hai đoạn dưới đây. Hãy mô tả đầu vào, đầu ra và tác động phụ của `saveOrder`, rồi giải thích vì sao email vẫn được gửi khi đơn không được lưu.

```ts
async function saveOrder(order) {
  const { error } = await supabase.from('orders').insert(order)
  if (error) console.log(error)
}

// Nơi gọi, trong app/api/checkout/route.ts
await saveOrder(order)
await sendConfirmEmail(order.email)
return Response.json({ ok: true })
```

#### Đáp án

- **Đầu vào:** một `order` (thông tin đơn hàng).
- **Tác động phụ:** thử ghi một dòng vào bảng `orders`; nếu lỗi thì in lỗi ra nhật ký máy chủ.
- **Đầu ra:** không có. Hàm không `return` gì ở cả hai trường hợp thành công và thất bại.
- **Vì sao email vẫn gửi:** khi database từ chối, hàm chỉ in lỗi rồi kết thúc bình thường. Nơi gọi không nhận được tín hiệu nào nên chạy tiếp dòng gửi email và trả `ok: true`. Lỗi chỉ nằm trong nhật ký, nơi không ai nhìn.
- **Hướng xử lý để giao cho AI:** `saveOrder` phải trả về kết quả rõ ràng (thành công hay thất bại, kèm lý do). Nơi gọi phải kiểm tra kết quả đó; thất bại thì trả mã lỗi cho trình duyệt và không gửi email.

## Lỗi suy luận hay gặp

### "Tên hàm nói gì thì hàm làm đúng thế"

- **Vì sao sai:** Tên không được máy kiểm tra. `checkPermission` có thể chỉ kiểm tra đã đăng nhập chưa mà không xét vai trò.
- **Cách sửa:** Với hàm liên quan tới tiền, quyền, xóa dữ liệu, mở ra và tự điền bốn mục: đầu vào, đầu ra từng nhánh, tác động phụ, nơi gọi.

### "Hàm chạy xong không báo lỗi nghĩa là đã thành công"

- **Vì sao sai:** Nhiều hàm báo thất bại qua đầu ra chứ không dừng chương trình. Lệnh Supabase trả `error`, `fetch` trả `res.ok` bằng `false`. Không ai đọc thì thất bại trôi qua trong im lặng.
- **Cách sửa:** Ở mỗi chỗ gọi hàm quan trọng, tìm dòng đọc kết quả. Không có dòng đó thì coi như chưa kiểm tra.

### "Hàm viết ở phía máy chủ thì người ngoài không chạm tới được"

- **Vì sao sai:** Hàm trong `route.ts` và hàm `export` trong file `'use server'` đều có địa chỉ để trình duyệt gọi. Đầu vào của chúng do người gọi tự quyết.
- **Cách sửa:** Coi mọi đầu vào của các hàm này là chưa đáng tin. Dòng đầu tiên trong hàm nên là kiểm tra người gọi, ví dụ lấy người dùng bằng `supabase.auth.getUser()` ở máy chủ.

## Bài tập thực hành

Mục tiêu: lập "thẻ hàm" cho một hàm quan trọng trong app, để biết chính xác nó nhận gì, trả gì và đụng tới đâu. Chỉ đọc code, không sửa.

### Việc cần làm

1. Chọn một hàm chạm tới tiền, quyền hoặc việc lưu dữ liệu. Nếu chưa biết tên, tìm `async function` trong `app/api/` hoặc file có `'use server'`.
2. Ghi thẻ hàm gồm 5 dòng: tên, đầu vào (từng tham số và nguồn gốc của nó), đầu ra ở từng nhánh, tác động phụ, có `async` không.
3. Tìm tên hàm trong toàn dự án để liệt kê các nơi gọi.
4. Ở mỗi nơi gọi, đánh dấu: có `await` không, đầu vào có đúng thứ tự không, đầu ra có được kiểm tra không.
5. Khoanh những chỗ đầu ra bị bỏ qua hoặc nhánh không có `return`.

### Kết quả đúng

Bạn có một thẻ hàm đủ 5 dòng và danh sách nơi gọi kèm ba dấu kiểm cho mỗi nơi. Bạn trả lời được câu "nếu hàm này thất bại, bước tiếp theo có biết không?" bằng tên file và dòng cụ thể.

### Nhờ AI rà lại

```text
Hãy đọc hàm [tên hàm] trong file [tên file] và báo cáo:
1. Từng đầu vào và nó đến từ đâu (trình duyệt, database, phiên đăng nhập).
2. Giá trị trả về ở từng nhánh, kể cả nhánh không có return.
3. Mọi tác động phụ: ghi database, gửi email, gọi dịch vụ ngoài.
4. Mọi nơi gọi hàm này: có await không, có kiểm tra kết quả không.
Chỉ báo cáo, không sửa bất kỳ file nào.
```
