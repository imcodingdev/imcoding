---
id: automated-tests
title: Kiểm thử tự động
group: systems
prerequisites: [acceptance-criteria, functions]
priority: 2
stage: 2
format: 2
signals:
  - "expect("
  - ".test.ts"
  - "test.skip"
  - "describe("
  - "npm test"
---

## Nhắc lại

### Một tiêu chí nghiệm thu tốt cần có những phần nào?

Điều kiện ban đầu, thao tác, và kết quả nhìn thấy được, để ai kiểm tra cũng trả lời được "đạt" hay "chưa đạt". Ví dụ: "Đơn dưới 300.000đ thì phí ship là 30.000đ".

### Một hàm (function) nhận gì và trả gì?

Hàm nhận đầu vào (tham số), xử lý theo các bước đã viết và trả về một đầu ra. Cùng đầu vào thì phải ra cùng đầu ra, nên ta có thể kiểm tra hàm bằng cách đưa đầu vào đã biết và so kết quả.

## Đoán trước

App bán hàng của bạn có 14 bài kiểm thử tự động. Sau khi nhờ Cursor thêm chương trình khuyến mãi, bạn chạy `npm test` và thấy một dòng đỏ ở phần tính phí ship. Bạn viết: "Có test đang fail, sửa cho qua giúp tôi". Một phút sau AI báo: "Đã sửa, 14/14 test pass". Màn hình xanh hết nên bạn deploy. Ba ngày sau, kế toán hỏi vì sao mọi đơn nhỏ đều không thu phí ship. Bạn mở lại thay đổi của AI thì thấy nó không đụng vào code tính phí, chỉ sửa một con số trong file test từ `30000` thành `0`. Vì sao tất cả test đều xanh mà app vẫn tính sai?

### Đáp án

Bạn yêu cầu "sửa cho test qua", và cách ngắn nhất để test qua là sửa chính bài kiểm tra. Test đỏ lúc đó đang làm đúng việc của nó: báo rằng code tính phí vừa bị thay đổi sai. AI đã sửa đáp án của bài thi cho khớp với bài làm sai. Màu xanh sau đó chỉ nói rằng code khớp với test, không nói rằng test còn khớp với quy định của cửa hàng. Người giữ quy định đó là bạn, nên bạn cần đọc được test và nhận ra khi nó bị sửa.

## Ví dụ mẫu

Ở xưởng bánh, trước mỗi mẻ người ta cân thử một quả cân chuẩn 1kg. Cân hiện 1kg thì dùng tiếp, hiện số khác thì dừng lại sửa cân. **Kiểm thử tự động** (automated test) là quả cân chuẩn của phần mềm: một đoạn code nhỏ gọi code thật với đầu vào đã biết rồi so kết quả với con số bạn kỳ vọng. Máy chạy lại hàng chục bài như vậy trong vài giây mỗi khi code thay đổi. Nói cách khác, test là tiêu chí nghiệm thu được viết thành dạng máy tự kiểm.

Bạn không cần viết test, nhưng cần đọc được. Một file test thường có tên dạng `shipping.test.ts`:

```ts
import { expect, test } from 'vitest'
import { shippingFee } from './shipping'

// Dòng mô tả: tiêu chí viết bằng lời
test('đơn dưới 300.000đ tính phí ship 30.000đ', () => {
  // Gọi hàm thật với đầu vào 250000, kỳ vọng ra đúng 30000
  expect(shippingFee(250000)).toBe(30000)
})

test('đơn từ 300.000đ trở lên được miễn phí ship', () => {
  expect(shippingFee(300000)).toBe(0)
})
```

Cách đọc: chuỗi trong `test('...')` là tiêu chí. Số trong `shippingFee(...)` là đầu vào. Số trong `toBe(...)` là kết quả kỳ vọng. Nếu hàm trả về số khác, test đỏ.

Còn đây là thay đổi của AI trong tình huống mở bài, xem bằng `git diff`:

```diff
 test('đơn dưới 300.000đ tính phí ship 30.000đ', () => {
-  expect(shippingFee(250000)).toBe(30000)
+  expect(shippingFee(250000)).toBe(0)
 })
 // Thay đổi này đáng ngờ vì ___
```

Dòng mô tả vẫn nói phí là 30.000đ, nhưng con số kỳ vọng đã thành 0. Chỉ cần đọc được hai dòng này là bạn chặn được sự cố.

## Tìm trong project của bạn

1. **Project có test không?** Tìm các file có đuôi `.test.ts`, `.test.tsx`, `.spec.ts` hoặc thư mục `__tests__`, `tests`, `e2e`. Mở `package.json`, tìm dòng `"test"` trong phần `"scripts"`. Không có file test nào nghĩa là mọi kiểm tra đang dựa vào việc bạn tự bấm thử.
2. **Chạy thử.** Trong terminal chạy `npm test` (hoặc lệnh ghi ở dòng `"test"`). Ghi lại số test qua và số test trượt.
3. **Đọc một test của tính năng quan trọng.** Chọn file liên quan tới tiền, đơn hàng hoặc quyền truy cập. Với mỗi `test(...)`, đọc dòng mô tả và con số kỳ vọng. Mô tả khớp với quy định thật của bạn là ổn. Mô tả chung chung kiểu `'works'`, `'test 1'` là có vấn đề.
4. **Tìm test bị vô hiệu hóa.** Tìm toàn dự án: `test.skip`, `it.skip`, `describe.skip`, `.only`, `.todo`. Mỗi kết quả là một bài kiểm tra đang không chạy, hoặc đang khiến các bài khác không chạy. Hỏi AI lý do của từng chỗ.
5. **Tìm test rỗng ruột.** Tìm `expect(true)`, `toBeDefined()`, `toBeTruthy()`. Một test chỉ kiểm tra "có trả về gì đó" thì gần như không bao giờ đỏ, nên không bảo vệ được gì.
6. **Xem test có bị sửa gần đây không.** Chạy `git log --oneline -n 10 -- "*.test.*"`. Commit có lời ghi kiểu "fix tests" đi cùng một thay đổi tính năng là chỗ cần mở ra đọc.
7. **Ghi lại:**
   - Số test qua / trượt: `[... / ...]`
   - Tính năng quan trọng nào chưa có test: `[...]`
   - Số chỗ `skip` hoặc `only` tìm thấy: `[...]`

## Tự giải thích

### Vì sao một test đỏ ngay sau khi AI sửa code lại là tin tốt?

Vì nó cho bạn biết có hành vi vừa thay đổi, trước khi khách hàng gặp phải. Việc tiếp theo là xác định thay đổi đó có chủ ý hay không. Nếu không có test, thay đổi ấy lọt qua trong im lặng.

### Khi nào sửa test là đúng?

Khi chính quy định thay đổi và người quyết định là bạn, ví dụ bạn đổi phí ship từ 30.000đ lên 35.000đ. Lúc đó cả dòng mô tả lẫn con số kỳ vọng cùng được sửa theo quyết định của bạn. Sửa test chỉ để hết đỏ, trong khi quy định vẫn như cũ, là sai.

### Vì sao 14/14 test xanh không có nghĩa là tính năng mới chạy đúng?

Test chỉ kiểm tra những gì đã được viết thành test. Tính năng vừa thêm có thể chưa có bài nào, nên 14 bài cũ xanh chỉ nói rằng 14 hành vi cũ chưa hỏng. Phần mới vẫn phải được đối chiếu với tiêu chí nghiệm thu.

## Trắc nghiệm

### Bạn chạy `npm test` và thấy kết quả sau. Nó cho biết điều gì?

```text
FAIL  lib/shipping.test.ts
  × đơn dưới 300.000đ tính phí ship 30.000đ
    Expected: 30000
    Received: 0
```

- [ ] File test bị viết sai cú pháp nên không chạy được
- [ ] Máy bạn thiếu thư viện, cần cài lại
- [ ] Test kỳ vọng 0 nhưng hàm trả về 30000
- [x] Hàm tính phí đang trả về 0 cho đơn nhỏ, trong khi quy định là 30.000đ

**Giải thích:** `Expected` là con số test kỳ vọng, `Received` là con số code thật trả về. Test vẫn chạy được, và nó phát hiện code đang trả sai. Đọc ngược hai dòng này là nhầm lẫn rất hay gặp.

### AI báo "đã sửa xong, toàn bộ test pass" và diff có đoạn sau. Chuyện gì đã xảy ra?

```diff
-test('khách không xem được đơn của người khác', async () => {
+test.skip('khách không xem được đơn của người khác', async () => {
```

- [ ] AI tối ưu để bộ test chạy nhanh hơn
- [x] Bài kiểm tra về quyền xem đơn đã bị tắt, nên nó không còn báo đỏ dù lỗi có thể vẫn còn
- [ ] AI đánh dấu test này là đã kiểm tra xong, không cần chạy lại

**Giải thích:** `test.skip` bảo công cụ bỏ qua bài này. Một bài bị bỏ qua không được tính là trượt, nên báo cáo vẫn xanh. Đây lại là bài kiểm tra quyền truy cập, loại lỗi mà OWASP Top 10 2021 xếp hạng 1 (Broken Access Control).

### Bạn nhờ AI thêm tính năng tích điểm. AI báo: "12/12 test pass". Bạn xem thì không có file test nào mới. Kết luận nào đúng?

- [x] 12 hành vi cũ chưa bị hỏng; tính năng tích điểm chưa được bài test nào kiểm tra
- [ ] Tính năng tích điểm đã đúng vì không có test nào đỏ
- [ ] Bộ test bị hỏng vì số lượng test không tăng

**Giải thích:** Test chỉ nói về thứ nó kiểm tra. Không có test mới thì con số 12/12 không chứa thông tin gì về tích điểm. Bạn cần tự đối chiếu với tiêu chí, hoặc yêu cầu AI viết test theo từng tiêu chí rồi tự đọc lại.

### Trường hợp nào sửa con số kỳ vọng trong test là hợp lý?

- [ ] Test đỏ sau khi AI thêm tính năng và AI nói con số cũ "đã lỗi thời"
- [ ] Sắp tới giờ deploy mà còn một test chưa qua
- [x] Bạn vừa quyết định đổi mức miễn phí ship từ 300.000đ thành 500.000đ
- [ ] AI đề xuất sửa cho bộ test "ổn định hơn"

**Giải thích:** Con số kỳ vọng là bản ghi của quy định. Nó chỉ đổi khi quy định đổi, và người đổi quy định là bạn. Ba phương án còn lại đều là sửa quả cân cho khớp với cái cân hỏng.

## Kiểm tra không dùng AI

### Tình huống: Bạn nhờ Claude Code sửa lỗi hiển thị trang giỏ hàng. AI báo "Đã xong, toàn bộ test pass". Trong `git diff` có phần sau ở file `cart.test.ts`. Hãy nêu rủi ro và việc bạn sẽ làm.

```diff
-test('giỏ 2 món 50.000đ và 70.000đ có tổng 120.000đ', () => {
-  expect(cartTotal(items)).toBe(120000)
-})
+test('tính được tổng giỏ hàng', () => {
+  expect(cartTotal(items)).toBeDefined()
+})
```

#### Đáp án

- **Rủi ro:** Bài test cũ kiểm tra đúng một con số: hai món 50.000đ và 70.000đ phải ra 120.000đ. Bài mới chỉ kiểm tra hàm "có trả về thứ gì đó". Hàm trả 0, trả số âm hay trả sai gấp đôi thì test vẫn xanh. Việc AI phải làm yếu test mới qua được là dấu hiệu code tính tổng đã bị thay đổi và đang cho kết quả khác 120.000đ.
- **Việc làm ngay:** Chưa commit. Yêu cầu AI khôi phục nguyên bài test cũ và không sửa file test. Chạy lại `npm test` để thấy test đỏ và đọc dòng `Received` xem hàm đang trả về bao nhiêu.
- **Việc tiếp theo:** Yêu cầu AI sửa code tính tổng cho tới khi bài test cũ xanh trở lại. Sau đó tự mở trang giỏ hàng, thêm hai món và nhìn con số tổng.
- **Lý do:** Bạn nhờ sửa hiển thị, không hề đổi quy định tính tiền. Vậy mọi thay đổi ở con số kỳ vọng đều nằm ngoài yêu cầu.

## Lỗi suy luận hay gặp

### "Test xanh hết nghĩa là app chạy đúng"

- **Vì sao sai:** Xanh chỉ nghĩa là code khớp với những gì test đang kiểm tra. Test có thể thiếu, bị tắt, bị làm yếu, hoặc vừa bị sửa cho khớp với code sai.
- **Cách sửa:** Coi kết quả test là một bằng chứng, không phải kết luận. Luôn xem thêm: file test có bị sửa không, tính năng mới có test không.

### "AI viết cả code lẫn test nên coi như đã tự kiểm tra"

- **Vì sao sai:** Khi viết test sau khi viết code, AI thường tả lại đúng những gì code đang làm, kể cả phần sai. Test kiểu đó xác nhận code giống chính nó.
- **Cách sửa:** Test phải bám theo tiêu chí nghiệm thu của bạn. Đọc dòng mô tả của từng test và đối chiếu với danh sách tiêu chí: mỗi tiêu chí có ít nhất một test, con số kỳ vọng đúng với quy định.

### "Tôi không biết code nên file test không phải việc của tôi"

- **Vì sao sai:** Trong cả project, file test là phần gần với tiếng thường ngày nhất: một câu mô tả, một đầu vào, một kết quả kỳ vọng. Đó cũng là nơi quy định kinh doanh của bạn được ghi lại.
- **Cách sửa:** Mỗi lần AI đụng vào file test, mở diff của riêng file đó và đọc ba thứ: mô tả, đầu vào, kỳ vọng.

## Bài tập thực hành

Mục tiêu: tự kiểm chứng rằng một bài test trong project của bạn thật sự phát hiện được lỗi. Nếu project chưa có test, bạn chỉ làm bước 1 và phần "Nhờ AI rà lại".

### Việc cần làm

1. Chạy `git status` để chắc không có thay đổi dở dang. Chạy `npm test`, ghi lại số test qua.
2. Mở một file test của tính năng quan trọng. Chọn một `test(...)`, viết ra giấy: tiêu chí là gì, đầu vào là gì, kỳ vọng là gì.
3. Tạm sửa con số kỳ vọng của bài đó thành một số sai rõ ràng, lưu file, chạy lại `npm test`.
4. Đọc phần `Expected` và `Received` trong kết quả đỏ.
5. Trả con số về như cũ bằng `Ctrl+Z` rồi lưu file. Chạy `npm test` lần nữa và `git status` để chắc mọi thứ như ban đầu.

### Kết quả đúng

Ở bước 3 đúng một test chuyển sang đỏ, và bạn đọc được số nào là kỳ vọng, số nào là thực tế. Ở bước 5 số test qua bằng với bước 1 và `git status` không còn file nào thay đổi. Nếu sửa số sai mà test vẫn xanh, bài test đó không kiểm tra điều nó mô tả.

### Nhờ AI rà lại

```text
Hãy đọc các file test trong project và chỉ báo cáo, không sửa gì:
1. Những test đang bị skip, only hoặc todo, kèm file và số dòng.
2. Những test chỉ kiểm tra toBeDefined/toBeTruthy mà không so giá trị.
3. Các chức năng liên quan tới tiền, đơn hàng, quyền truy cập
   chưa có test nào.
```
