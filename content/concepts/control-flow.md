---
id: control-flow
title: Điều kiện và vòng lặp
group: backend
prerequisites: [programming-values]
priority: 2
stage: 2
format: 2
signals:
  - "if ("
  - "else if"
  - "switch ("
  - "for ("
  - ".forEach("
  - "&&"
---

## Nhắc lại

### Khách mở link `/checkout?vip=false`. Vì sao đoạn `isVip ? 80000 : 100000` vẫn cho khách giá 80000?

Vì giá trị lấy từ URL là chuỗi `'false'`, không phải giá trị đúng/sai `false`. Chuỗi nào có ký tự cũng được coi là đúng trong phép kiểm tra.

### Vì sao `product.stock || 0` có thể làm sản phẩm mới tạo hiện "Hết hàng"?

Vì `|| 0` biến giá trị rỗng (`null`, chưa nhập số tồn) thành số 0. Từ đó code không phân biệt được "chưa có số liệu" với "đã hết hàng".

## Đoán trước

Shop bạn có chính sách phí giao hàng: đơn trên 100.000đ thì phí 20.000đ, đơn trên 500.000đ thì miễn phí, còn lại 30.000đ. Bạn nhờ AI viết phần tính phí, AI báo "đã xong, đã thử với đơn 50.000đ và đơn 200.000đ, kết quả đúng". Một tuần sau, khách mua đơn 800.000đ nhắn hỏi vì sao vẫn bị tính 20.000đ phí giao hàng. Bạn mở code thì thấy có đủ cả ba mức phí, con số nào cũng đúng. Vì sao mức miễn phí không bao giờ được áp dụng?

### Đáp án

Vì máy tính đọc các điều kiện **lần lượt từ trên xuống và dừng ở điều kiện đúng đầu tiên**. AI viết câu hỏi "đơn trên 100.000đ?" trước câu hỏi "đơn trên 500.000đ?". Đơn 800.000đ lớn hơn 100.000đ, nên dừng ngay ở mức phí 20.000đ và không bao giờ đi tới dòng miễn phí. Nội dung từng dòng đều đúng, chỉ thứ tự sai. AI thử hai đơn và cả hai đều không chạm tới nhánh bị hỏng. Khi đọc code có điều kiện, câu cần hỏi là: với mỗi trường hợp thật, code sẽ rẽ vào nhánh nào?

## Ví dụ mẫu

Nhân viên mới ở quầy thường được phát một tờ hướng dẫn: "Nếu khách có thẻ thành viên thì giảm 10%. Nếu không thì tính giá gốc. Với từng món trong giỏ, quét mã rồi cộng vào hóa đơn." Tờ giấy đó có hai thứ mà code nào cũng có:

- **Điều kiện (`if` / `else`)**: chỗ rẽ nhánh. Đúng thì làm việc này, sai thì làm việc kia. `else if` là hỏi tiếp một câu khác. `else` cuối cùng là "mọi trường hợp còn lại".
- **Vòng lặp (`for`, `.map`, `.forEach`)**: lặp lại một việc cho từng phần tử trong danh sách.

Cách đọc vài ký hiệu hay gặp: `===` là "bằng đúng", `!==` là "khác", `&&` là "và" (mọi vế cùng đúng), `||` là "hoặc" (một vế đúng là đủ), `>` là lớn hơn, `>=` là lớn hơn hoặc bằng.

Cách làm SAI: điều kiện rộng đứng trước điều kiện hẹp.

```ts
function getShippingFee(total: number) {
  if (total > 100000) return 20000        // đơn 800.000đ dừng ngay ở đây
  else if (total > 500000) return 0       // không đơn nào tới được dòng này
  return 30000
}
```

Cách làm ĐÚNG: điều kiện hẹp trước, và vòng lặp cộng tiền từng món trong giỏ.

```ts
function getShippingFee(total: number) {
  if (total > 500000) return 0            // hỏi mức cao nhất trước
  if (total > 100000) return 20000
  return 30000                            // mọi trường hợp còn lại
}

let total = 0
for (const item of cart) {                // lặp qua từng món trong giỏ
  if (item.quantity <= 0) continue        // bỏ qua món này, đi tiếp món sau
  total = total + item.price * item.quantity
}
// Giỏ rỗng thì vòng lặp chạy ___ lần và total vẫn là 0
```

Bạn không cần nhớ cách viết. Bạn cần cầm một trường hợp cụ thể, ví dụ đơn đúng 500.000đ, rồi dùng ngón tay đi theo từng dòng xem nó rẽ vào đâu.

## Tìm trong project của bạn

1. **Tìm chuỗi điều kiện nhiều tầng.** Mở tìm kiếm toàn dự án (`Ctrl+Shift+F` / `Cmd+Shift+F`), tìm `else if` và `switch (`. Ưu tiên các file tính tiền, phân quyền, trạng thái đơn.
2. **Soát thứ tự và ranh giới.** Với mỗi chuỗi, đọc các điều kiện từ trên xuống. Hỏi: có điều kiện nào phía trên "nuốt" mất điều kiện phía dưới không? Chỗ nào dùng `>` thì giá trị đúng bằng ngưỡng rơi vào nhánh nào?
3. **Tìm nhánh "còn lại".** Xem cuối chuỗi có `else` hoặc `default:` không, và nhánh đó làm gì. Một trạng thái lạ rơi vào đây sẽ được coi là gì?
4. **Soát điều kiện về quyền.** Tìm `role` và `!==`. Đọc thành câu tiếng Việt với "và" / "hoặc" rồi thử với từng vai trò.
5. **Tìm vòng lặp có lối thoát sớm.** Tìm `for (` và `.forEach(`. Trong thân vòng lặp, tìm `return` và `break`: đó là chỗ vòng lặp dừng trước khi đi hết danh sách.
6. **Phân loại:**
   - Thấy thế này là ổn: điều kiện hẹp đứng trước; nhánh cuối từ chối hoặc báo lỗi với giá trị lạ; vòng lặp chỉ thoát sớm khi gặp lỗi.
   - Thấy thế này là có vấn đề: nhánh cuối mặc định cho qua; `return` ở cả hai nhánh `if` và `else` ngay trong vòng lặp; không rõ danh sách rỗng thì ra kết quả gì.
7. **Ghi lại kết quả của bạn:**
   - Chuỗi điều kiện nào có thứ tự đáng ngờ?: `[ tên file: ... ]`
   - Giá trị đúng bằng ngưỡng rơi vào nhánh nào?: `[ ... ]`
   - Vòng lặp nào dừng sớm?: `[ tên file: ... ]`

## Tự giải thích

### Vì sao AI thử hai đơn và báo "kết quả đúng" mà lỗi phí giao hàng vẫn tồn tại?

Vì mỗi lần thử chỉ đi qua một nhánh. Ba mức phí là ba nhánh, cộng thêm các điểm ranh giới. Hai đơn 50.000đ và 200.000đ chỉ chạm nhánh 30.000đ và nhánh 20.000đ. Nhánh miễn phí chưa từng được chạy. Một chuỗi điều kiện chỉ được coi là đã kiểm tra khi mỗi nhánh có ít nhất một ca thử đi qua.

### Nếu bỏ nhánh `else` cuối cùng trong đoạn xử lý trạng thái đơn hàng thì chuyện gì xảy ra với một trạng thái mới như `refunded`?

Không nhánh nào khớp, code đi tiếp xuống dưới như không có gì. Tùy đoạn phía sau, đơn hoàn tiền có thể không hiện nhãn nào, hoặc tệ hơn là được xử lý như đơn bình thường. Không có lỗi đỏ, vì với máy tính "không khớp nhánh nào" là chuyện hợp lệ. Nhánh cuối nên là nơi báo "gặp trạng thái lạ" thay vì im lặng.

### Vì sao cần hỏi "danh sách rỗng thì sao" mỗi khi đọc một vòng lặp?

Vì vòng lặp trên danh sách rỗng chạy không lần nào, và mọi thứ giữ nguyên giá trị ban đầu. Nếu code khởi đầu bằng "tất cả đã thanh toán là đúng" rồi dùng vòng lặp để tìm đơn chưa trả, thì người chưa có đơn nào cũng được coi là đã thanh toán hết. Giá trị khởi đầu chính là câu trả lời cho ca rỗng.

## Trắc nghiệm

### Quy định: "Đơn từ 500.000đ trở lên được miễn phí giao hàng". Khách mua đúng 500.000đ. Với đoạn code này, khách trả phí bao nhiêu?

```ts
if (total > 500000) fee = 0
else fee = 30000
```

- [ ] 0đ, vì đơn đạt mức 500.000đ
- [ ] App báo lỗi vì không có nhánh cho đúng 500.000đ
- [x] 30.000đ, vì `>` nghĩa là lớn hơn hẳn, 500.000 không lớn hơn 500.000

**Giải thích:** "Từ 500.000đ trở lên" phải là `>=`. Dấu `>` loại mất đúng giá trị ngưỡng. Không có lỗi nào được báo, vì đơn 500.000đ rơi gọn vào nhánh `else`. Loại sai này chỉ lộ khi thử đúng giá trị ranh giới.

### AI viết đoạn chặn quyền vào trang quản trị: chỉ `admin` và `staff` được vào. Điều gì xảy ra?

```ts
if (user.role !== 'admin' || user.role !== 'staff') {
  return Response.json({ error: 'Không có quyền' }, { status: 403 })
}
```

- [x] Mọi người đều bị chặn, kể cả admin, vì không ai vừa là admin vừa là staff
- [ ] Chỉ admin và staff vào được, đúng như yêu cầu
- [ ] Mọi người đều vào được
- [ ] Chỉ khách thường bị chặn

**Giải thích:** Đọc thành lời: "nếu vai trò khác admin HOẶC khác staff thì chặn". Admin thì khác staff, staff thì khác admin, nên vế nào đó luôn đúng. Ở đây phải là "và" (`&&`). Lỗi này ít nguy hiểm vì bạn thấy ngay. Chiều ngược lại, dùng nhầm khiến ai cũng lọt, mới đáng sợ, và cách đọc để phát hiện là như nhau.

### Đoạn code mở khóa khóa học khi học viên đã trả hết các đơn. Một tài khoản mới đăng ký, chưa có đơn nào. Kết quả?

```ts
let allPaid = true
for (const order of orders) {
  if (order.status !== 'paid') allPaid = false
}
if (allPaid) unlockCourse(user.id)
```

- [ ] Không mở khóa, vì chưa có đơn nào được trả
- [ ] Báo lỗi vì `orders` rỗng
- [ ] Vòng lặp chạy mãi không dừng
- [x] Khóa học được mở, vì vòng lặp không chạy lần nào và `allPaid` vẫn là `true`

**Giải thích:** Danh sách rỗng thì thân vòng lặp bị bỏ qua hoàn toàn. `allPaid` giữ nguyên giá trị khởi đầu là `true`. Code thiếu điều kiện "phải có ít nhất một đơn". Vòng lặp trên danh sách rỗng không gây lỗi và không chạy vô hạn.

### AI viết đoạn kiểm tra tồn kho cho cả giỏ hàng trước khi cho thanh toán. Giỏ có 3 món, món thứ ba đã hết hàng. Kết quả?

```ts
for (const item of cart) {
  if (item.quantity > item.stock) return { ok: false }
  else return { ok: true }
}
```

- [ ] Trả về `ok: false` vì có một món hết hàng
- [x] Trả về `ok: true` ngay sau món đầu tiên, hai món sau không được kiểm tra
- [ ] Kiểm tra đủ ba món rồi trả về kết quả của món cuối

**Giải thích:** `return` kết thúc luôn cả đoạn code, không chỉ kết thúc một vòng. Vì cả hai nhánh đều `return`, vòng lặp luôn dừng ở món đầu. Cách đúng là chỉ thoát sớm khi gặp món thiếu hàng, và trả `ok: true` sau khi vòng lặp đã đi hết.

## Kiểm tra không dùng AI

### Tình huống: App cho thuê phòng họp tính giá theo số giờ. Quy định: thuê dưới 2 giờ thì 200.000đ mỗi giờ; từ 2 đến 4 giờ thì 180.000đ mỗi giờ; trên 4 giờ thì 150.000đ mỗi giờ. AI viết đoạn dưới đây. Hãy đi theo code với ba ca: 1 giờ, đúng 2 giờ, 6 giờ. Chỉ ra ca nào sai và vì sao.

```ts
let rate = 200000
if (hours > 2) {
  rate = 180000
} else if (hours > 4) {
  rate = 150000
}
const price = rate * hours
```

#### Đáp án

- **1 giờ:** `1 > 2` sai, sang `else if`: `1 > 4` sai. `rate` giữ 200.000. Đúng quy định.
- **Đúng 2 giờ:** `2 > 2` sai, `2 > 4` sai. `rate` vẫn là 200.000. **Sai**, vì quy định ghi "từ 2 giờ" phải được 180.000. Nguyên nhân: dùng `>` thay cho `>=`.
- **6 giờ:** `6 > 2` đúng, `rate` thành 180.000 và dừng. Nhánh `else if (hours > 4)` không được xét. **Sai**, vì lẽ ra là 150.000. Nguyên nhân: điều kiện rộng đứng trước điều kiện hẹp.
- **Kết luận:** nhánh 150.000đ không bao giờ chạy với bất kỳ số giờ nào. Yêu cầu giao cho AI: hỏi mức "trên 4 giờ" trước, sau đó mới tới "từ 2 giờ trở lên" và phải bao gồm cả đúng 2 giờ. Kèm ba ca thử gồm cả giá trị ranh giới 2 và 4.

## Lỗi suy luận hay gặp

### "Có đủ các mức trong code là tính đúng"

- **Vì sao sai:** Sự có mặt của một nhánh không bảo đảm nhánh đó được chạy. Thứ tự điều kiện có thể làm một nhánh thành vô dụng.
- **Cách sửa:** Với mỗi nhánh, tự tìm một ca cụ thể đi vào được nhánh đó. Không tìm ra ca nào thì nhánh đó đang chết.

### "Không khớp điều kiện nào thì không có gì xảy ra"

- **Vì sao sai:** Code vẫn chạy tiếp với giá trị mặc định đã gán từ trước. Nếu mặc định là "cho qua" hoặc "giá 0", mọi trường hợp lạ đều được ưu ái.
- **Cách sửa:** Tìm giá trị khởi đầu và nhánh `else` cuối. Ở phần tiền và quyền, mặc định nên là từ chối.

### "Vòng lặp thì chắc chắn đi hết danh sách"

- **Vì sao sai:** `return` và `break` làm vòng lặp dừng giữa chừng. Danh sách rỗng thì không chạy lần nào.
- **Cách sửa:** Mỗi khi thấy vòng lặp, hỏi ba câu: rỗng thì sao, có một phần tử thì sao, phần tử có vấn đề nằm ở cuối thì sao.

## Bài tập thực hành

Mục tiêu: lập bảng nhánh cho một đoạn tính toán quan trọng trong app và tìm ra nhánh chưa từng được thử. Chỉ đọc code và thử trên máy cá nhân hoặc bản preview với dữ liệu thử.

### Việc cần làm

1. Chọn một quy định có nhiều mức trong app: phí giao hàng, bậc giảm giá, giá theo gói.
2. Tìm đoạn code tương ứng bằng tìm kiếm toàn dự án, mở file ra.
3. Lập bảng 4 cột: ca thử, giá trị đầu vào, nhánh code sẽ rẽ vào, kết quả theo quy định.
4. Điền ít nhất 5 ca: một ca cho mỗi mức, cộng các giá trị đúng bằng từng ngưỡng.
5. Dùng ngón tay đi theo code cho từng ca, ghi kết quả code cho ra, so với cột quy định.
6. Thử 2 ca ranh giới trên app thật ở bản thử, xem con số hiện ra có khớp không.

### Kết quả đúng

Bảng có ít nhất 5 dòng và mỗi nhánh trong code có ít nhất một ca đi qua. Mọi dòng lệch giữa "code cho ra" và "quy định" được đánh dấu kèm tên file. Nếu không lệch dòng nào, bạn đã có sẵn bộ ca thử để dùng lại mỗi lần AI sửa đoạn này.

### Nhờ AI rà lại

```text
Đây là quy định của tôi: [dán quy định].
Hãy đọc đoạn code tính [tên] trong file [tên file] và lập bảng:
mỗi nhánh điều kiện, khoảng giá trị đi vào nhánh đó, kết quả trả về.
Chỉ ra nhánh nào không giá trị nào tới được, và giá trị đúng bằng
từng ngưỡng rơi vào nhánh nào.
Chỉ báo cáo, không sửa bất kỳ file nào.
```
