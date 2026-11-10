---
id: programming-values
title: Biến và kiểu dữ liệu
group: backend
prerequisites: [html-css-js]
priority: 2
stage: 2
format: 2
signals:
  - "const "
  - "Number("
  - "e.target.value"
  - "formData.get("
  - "=== null"
---

## Nhắc lại

### Trong một file `.tsx`, ba lớp HTML, CSS và JavaScript đảm nhận việc gì?

HTML là khung và nội dung (nút, ô nhập, tiêu đề). CSS là hình thức (màu, cỡ chữ, bố cục). JavaScript là hành động: bấm nút thì tính gì, gửi dữ liệu đi đâu. Bài này đọc sâu hơn vào lớp JavaScript.

## Đoán trước

Bạn nhờ AI thêm ô "Phí giao hàng" để nhân viên tự nhập cho từng đơn. Món hàng giá 150.000đ, nhân viên nhập phí 30000. Màn hình xác nhận hiện "Tổng thanh toán: 15000030000đ". Bạn báo AI, AI trả lời "đã sửa phần hiển thị" và thêm dấu chấm ngăn cách, giờ màn hình hiện "15.000.030.000đ". Phép cộng thì đơn giản, hai con số nhìn đều đúng. Vì sao kết quả lại thành mười lăm tỷ?

### Đáp án

Vì với máy tính, `30000` nhân viên gõ vào ô nhập không phải là số. Mọi thứ lấy từ ô nhập đều là chữ (kiểu `string`), kể cả khi trông như số. Dấu `+` giữa một số và một chuỗi chữ không cộng mà **nối đuôi**: `150000` nối với `"30000"` thành `"15000030000"`. AI sửa phần hiển thị là sửa sai chỗ, vì giá trị đã hỏng từ trước khi được in ra. Mỗi giá trị trong code có một **kiểu dữ liệu (data type)**, và kiểu quyết định phép tính cho ra kết quả gì.

## Ví dụ mẫu

Hãy nghĩ tới các hộp trong kho, mỗi hộp dán một nhãn. **Biến (variable)** là cái nhãn; thứ nằm trong hộp là **giá trị (value)**. Dòng `const price = 150000` đọc là: hộp dán nhãn `price` đang chứa số 150000. Chữ `const` cho biết hộp không bị thay ruột về sau, còn `let` thì có thể bị thay.

Bạn chỉ cần nhận mặt sáu loại giá trị:

- **Chuỗi (`string`)**: chữ, nằm trong dấu nháy. `'30000'` là chữ, không phải số.
- **Số (`number`)**: không có dấu nháy. `30000`.
- **Đúng/sai (`boolean`)**: chỉ có `true` hoặc `false`, không có nháy.
- **Rỗng (`null`, `undefined`)**: hộp chưa có gì. Khác với số `0` và chuỗi rỗng `''`.
- **Danh sách (`array`)**: nhiều giá trị trong ngoặc vuông `[ ]`.
- **Đối tượng (`object`)**: một hồ sơ gồm nhiều mục có tên, trong ngoặc nhọn `{ }`.

Cách làm SAI: lấy chữ từ ô nhập rồi đem cộng thẳng.

```tsx
const price = 150000                  // số
const shippingFee = e.target.value    // LUÔN là chuỗi: '30000'
const total = price + shippingFee     // số + chuỗi = nối đuôi: '15000030000'
```

Cách làm ĐÚNG: đổi sang số, rồi kiểm tra kết quả đổi trước khi tính.

```tsx
const price = 150000
const shippingFee = Number(e.target.value)   // '30000' thành 30000
// Nếu nhân viên gõ 'ba mươi nghìn', Number() cho ra NaN (không phải số)
if (Number.isNaN(shippingFee) || shippingFee < 0) {
  setError('Phí giao hàng phải là số từ 0 trở lên')
} else {
  const total = price + shippingFee          // kiểu của total lúc này là ___
  setTotal(total)
}
```

Khi đọc code AI viết, hãy tự hỏi ở mỗi dòng: giá trị này từ đâu tới, và nó đang là chữ, số, đúng/sai hay rỗng?

## Tìm trong project của bạn

1. **Tìm nơi giá trị đi vào app.** Mở tìm kiếm toàn dự án (`Ctrl+Shift+F` / `Cmd+Shift+F`), tìm `e.target.value`, `formData.get(` và `searchParams.get(`. Giá trị lấy từ ba nguồn này là chuỗi, hoặc rỗng nếu người dùng không gửi.
2. **Xem giá trị đó có bị đem tính toán không.** Đi theo tên biến xuống các dòng dưới. Nếu nó xuất hiện cạnh dấu `+`, `*`, `>`, `<` hoặc được lưu vào cột kiểu số, thì trước đó phải có bước đổi như `Number(...)` hoặc `parseInt(...)`.
3. **Tìm chỗ xử lý giá trị rỗng.** Tìm `|| 0`, `?? 0`, `=== null`, `undefined`. Mỗi chỗ là một quyết định: khi thiếu dữ liệu thì app coi là gì. Hỏi lại xem quyết định đó có hợp quy định của bạn không.
4. **Tìm chỗ kiểu bị bỏ ngỏ.** Tìm `: any` và `as any`. Đây là dấu hiệu AI bảo TypeScript (lớp kiểm tra kiểu của dự án) ngừng soát ở chỗ đó.
5. **Phân loại:**
   - Thấy thế này là ổn: giá trị từ form hoặc URL được đổi kiểu ngay sau khi lấy, có nhánh xử lý khi đổi thất bại.
   - Thấy thế này là có vấn đề: chuỗi từ form được cộng, so sánh hoặc lưu thẳng; `|| 0` biến mọi dữ liệu thiếu thành 0; nhiều `any` ở phần tính tiền.
6. **Ghi lại kết quả của bạn:**
   - Ô nhập nào đang được dùng để tính toán mà chưa đổi sang số?: `[ ... - tên file: ... ]`
   - Chỗ nào dùng `|| 0` với tiền hoặc số lượng?: `[ ... ]`
   - Có bao nhiêu `any` trong phần thanh toán?: `[ ... ]`

## Tự giải thích

### Vì sao `150000 + '30000'` không báo lỗi mà lại cho ra một kết quả sai?

Vì JavaScript cho phép cộng số với chuỗi và tự hiểu là nối chữ. Với nó đây là phép tính hợp lệ nên không có gì để báo. Chính vì không có lỗi đỏ, loại sai này chỉ lộ ra khi có người nhìn vào con số cuối cùng. Thứ bạn cần soát là kiểu của từng giá trị trước phép tính, không phải chờ app báo lỗi.

### Số `0`, chuỗi rỗng `''`, `null` và `undefined` khác nhau thế nào khi nói về tồn kho?

`0` nghĩa là đã đếm và hết hàng. `null` thường nghĩa là chưa có số liệu. `undefined` thường nghĩa là mục đó không hề tồn tại trong dữ liệu. `''` là ô nhập bị bỏ trống. Nếu code gộp cả bốn thành `0` bằng `|| 0`, sản phẩm chưa nhập số tồn sẽ hiện "hết hàng". Gộp theo chiều ngược lại thì món đã hết vẫn bán được.

### Vì sao TypeScript không báo đỏ mà dữ liệu sai kiểu vẫn lọt vào app lúc chạy thật?

TypeScript chỉ soát code lúc viết và lúc build. Khi app chạy, phần ghi chú kiểu đã bị gỡ bỏ. Dữ liệu tới từ bên ngoài như form, URL, phản hồi API không được ai kiểm tra kiểu nếu code không tự kiểm. Dòng `quantity: number` là lời hứa của người viết, không phải cánh cửa chặn.

## Trắc nghiệm

### Trang giỏ hàng có đoạn sau. Khách chọn số lượng 2 trong ô nhập. Màn hình hiện gì?

```tsx
const quantity = e.target.value   // khách chọn 2
const bonus = 1                   // tặng kèm 1 sản phẩm
const itemsToShip = quantity + bonus
```

- [ ] `3`
- [ ] Báo lỗi vì không cộng được chữ với số
- [x] `21`

**Giải thích:** `e.target.value` là chuỗi `'2'`. Chuỗi cộng số thành nối đuôi, ra `'21'`. JavaScript không báo lỗi ở phép này. Kho sẽ nhận lệnh giao 21 món thay vì 3.

### AI viết đoạn tính giá cho khách VIP. Khách thường mở link `/checkout?vip=false`. Chuyện gì xảy ra?

```ts
const isVip = searchParams.get('vip')   // lấy từ URL
const price = isVip ? 80000 : 100000
```

- [x] Khách vẫn được giá 80000, vì `'false'` là một chuỗi có nội dung nên được coi là đúng
- [ ] Khách trả 100000, vì giá trị là false
- [ ] App báo lỗi vì `vip` phải là boolean

**Giải thích:** Thứ lấy từ URL là chuỗi `'false'`, không phải giá trị `false`. Chuỗi nào có ký tự cũng được coi là đúng trong phép kiểm tra. Ngoài lỗi kiểu, còn một lỗi lớn hơn: quyền VIP không được phép đọc từ URL do khách tự gõ.

### Trang hồ sơ bị trắng, Console báo `Cannot read properties of null (reading 'name')` ở dòng dưới. Cách đọc nào đúng?

```tsx
<h1>Xin chào {user.name}</h1>
```

- [ ] Tên của người dùng đang là chuỗi rỗng
- [x] Hộp `user` đang rỗng (`null`), nên không có mục `name` nào để lấy
- [ ] Cột `name` trong database bị xóa
- [ ] Cần đổi `name` thành số

**Giải thích:** Thông báo nói rõ: đọc mục `name` của một thứ đang là `null`. Thứ rỗng là `user`, không phải `name`. Thường gặp khi người dùng chưa đăng nhập hoặc dữ liệu chưa tải xong. Nếu chỉ tên bị rỗng, trang vẫn hiện "Xin chào" mà không có lỗi.

### AI viết phần hiển thị tồn kho như sau. Sản phẩm mới tạo chưa nhập số tồn (`stock` là `null`). Hậu quả là gì?

```ts
const stock = product.stock || 0
const label = stock > 0 ? 'Còn hàng' : 'Hết hàng'
```

- [ ] App báo lỗi vì `null` không so sánh được với số
- [ ] Hiện "Còn hàng" vì chưa có ai mua
- [ ] Không hiện gì cả
- [x] Hiện "Hết hàng", vì `|| 0` đã biến "chưa có số liệu" thành số 0

**Giải thích:** `|| 0` thay mọi giá trị rỗng bằng 0. Từ đó trở đi code không còn phân biệt được "chưa nhập" với "đã hết". Đây là quyết định nghiệp vụ mà AI tự chọn hộ bạn. Có thể đúng ý bạn, có thể không, nhưng bạn cần biết nó tồn tại.

## Kiểm tra không dùng AI

### Tình huống: App bán khóa học có ô chọn số lượng vé và mã giới thiệu. AI viết đoạn dưới đây ở máy chủ. Một khách để trống ô số lượng rồi bấm Mua và được tạo đơn 0đ. Hãy chỉ ra kiểu của từng giá trị và giải thích vì sao đơn 0đ lọt qua.

```ts
const quantity = formData.get('quantity')        // khách để trống
const count = Number(quantity) || 0
const total = count * 500000
if (total >= 0) {
  await createOrder({ count, total })
}
```

#### Đáp án

- `quantity` là chuỗi rỗng `''`, vì ô nhập bị bỏ trống.
- `Number('')` cho ra `0`. Thêm `|| 0` thì vẫn là `0`. Vậy `count` là số 0. Nếu khách gõ chữ, `Number` cho ra `NaN`, và `|| 0` cũng biến nó thành 0.
- `total` là `0 * 500000`, bằng số 0.
- Điều kiện `total >= 0` đúng với số 0, nên đơn 0 vé, 0đ vẫn được tạo.
- **Vấn đề:** `|| 0` che mất hai tình huống cần từ chối là "bỏ trống" và "gõ sai". Điều kiện cuối lại kiểm tra sai thứ.
- **Hướng xử lý để giao cho AI:** sau khi đổi sang số, phải từ chối nếu kết quả không phải số nguyên từ 1 trở lên, trả lỗi rõ ràng, không tự thay bằng 0.

## Lỗi suy luận hay gặp

### "Nhìn giống số thì là số"

- **Vì sao sai:** `'30000'` và `30000` in ra màn hình giống hệt nhau nhưng cho kết quả khác nhau khi tính. Mắt người không phân biệt được trên giao diện.
- **Cách sửa:** Nhìn vào nguồn gốc. Giá trị đến từ ô nhập, form, URL thì mặc định coi là chuỗi cho tới khi thấy bước đổi kiểu.

### "Thiếu dữ liệu thì cứ coi là 0 cho an toàn"

- **Vì sao sai:** 0 là một câu trả lời cụ thể: giá 0đ, tồn kho 0, giảm giá 0%. Biến "không biết" thành 0 có thể tạo ra đơn miễn phí hoặc khóa bán một sản phẩm đang có hàng.
- **Cách sửa:** Mỗi chỗ có `|| 0` hoặc `?? 0` ở phần tiền và số lượng, hỏi AI: "Khi giá trị này rỗng, app nên từ chối hay nên dùng mặc định? Vì sao?".

### "TypeScript không gạch đỏ nghĩa là dữ liệu đúng kiểu"

- **Vì sao sai:** TypeScript không có mặt lúc app chạy. Nó tin lời khai báo của người viết, kể cả khi dữ liệu thật từ form hay API không giống lời khai.
- **Cách sửa:** Ở mọi điểm dữ liệu từ ngoài đi vào, tìm bước kiểm tra chạy thật như `Number.isNaN(...)`, `Number.isInteger(...)` hoặc một thư viện kiểm tra dữ liệu, thay vì chỉ tin vào ghi chú kiểu.

## Bài tập thực hành

Mục tiêu: lần theo một con số từ lúc người dùng gõ vào tới lúc được lưu, và ghi lại kiểu của nó ở từng chặng. Chỉ đọc code, không cần sửa gì.

### Việc cần làm

1. Chọn một ô nhập số quan trọng trong app: số lượng, giá, phí, số ngày.
2. Tìm tên ô nhập đó trong code và mở file chứa nó.
3. Lập bảng 3 cột: tên biến, giá trị ví dụ, kiểu (chuỗi / số / đúng-sai / rỗng).
4. Điền bảng cho từng chặng: lúc lấy từ ô nhập, sau khi đổi kiểu (nếu có), lúc đem tính, lúc gửi lên máy chủ hoặc lưu database.
5. Đánh dấu chặng nào giá trị là chuỗi mà đã bị đem tính, và chặng nào giá trị rỗng bị thay bằng 0.

### Kết quả đúng

Bảng có ít nhất 3 chặng, mỗi chặng ghi rõ kiểu. Bạn chỉ ra được dòng code nơi chuỗi được đổi thành số, hoặc kết luận được rằng không có dòng nào như vậy. Kết luận thứ hai là một lỗi cần giao cho AI sửa.

### Nhờ AI rà lại

```text
Hãy lần theo giá trị của ô nhập [tên ô] từ giao diện tới lúc lưu database.
Ở mỗi bước, cho tôi biết tên biến, file, và kiểu dữ liệu thật lúc chạy
(string, number, boolean, null, undefined).
Chỉ ra mọi chỗ chuỗi bị đem tính toán khi chưa đổi sang số,
và mọi chỗ giá trị rỗng bị thay bằng 0.
Chỉ báo cáo, không sửa bất kỳ file nào.
```
