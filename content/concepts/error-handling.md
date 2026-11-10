---
id: error-handling
title: Xử lý lỗi
group: backend
prerequisites: [functions, http-request-response]
priority: 2
stage: 2
format: 2
signals:
  - "catch"
  - "try {"
  - "console.error"
  - "throw new Error"
  - "err.message"
  - "error.tsx"
---

## Nhắc lại

### Một hàm (function) nhận gì và trả gì?

Hàm nhận đầu vào (tham số), làm một việc, rồi trả về đầu ra. Người gọi hàm dựa vào đầu ra đó để làm bước tiếp theo, nên hàm trả sai hoặc im lặng khi hỏng thì các bước sau cũng sai theo.

### Mã trạng thái `400`, `401`, `500` trong phản hồi HTTP nói lên điều gì?

`400` là yêu cầu gửi lên sai. `401` là chưa đăng nhập. `500` là máy chủ gặp sự cố khi xử lý. Mã bắt đầu bằng 4 là lỗi phía người gọi, bắt đầu bằng 5 là lỗi phía máy chủ.

## Đoán trước

Cửa hàng online của bạn gửi email xác nhận sau mỗi đơn. Chạy êm suốt hai tháng. Rồi một khách nhắn hỏi sao không nhận được email, rồi khách thứ hai, thứ ba. Bạn kiểm tra: đơn vẫn được tạo, trang vẫn hiện "Đặt hàng thành công", nhật ký máy chủ trên Vercel không có dòng lỗi nào. Lục lại thì ra khóa của dịch vụ gửi email đã hết hạn từ ba tuần trước, và từ đó không email nào được gửi đi. Một việc hỏng hoàn toàn suốt ba tuần, vì sao không có lấy một dòng lỗi nào ở bất kỳ đâu?

### Đáp án

Vì lỗi đã bị **nuốt**. Đoạn gửi email được bọc trong `try` và `catch`, nhưng khối `catch` để trống: bắt được lỗi rồi không làm gì. Không ghi nhật ký, không báo cho ai, code chạy tiếp và trả về thành công. AI rất hay viết kiểu này để chương trình "không bị sập", và nó làm đúng điều đó: không sập, cũng không cho ai biết là đang hỏng. Một lỗi hiện ra khó chịu trong một phút. Một lỗi bị nuốt gây thiệt hại nhiều tuần trước khi có người phát hiện.

## Ví dụ mẫu

Xe có đèn báo trên bảng đồng hồ. Đèn dầu đỏ sáng lên thì khó chịu, nhưng bạn biết phải dừng xe. Có hai cách làm hỏng hệ thống này. Cách một: dán băng dính đen che đèn, xe vẫn chạy cho tới khi vỡ máy. Cách hai: thay đèn bằng một màn hình in ra toàn bộ sơ đồ mạch điện, người lái không hiểu gì, còn kẻ trộm đứng ngoài thì đọc được cách nối dây.

**Xử lý lỗi (error handling)** là quyết định trước: khi một bước hỏng thì ai được biết, biết những gì, và chương trình làm gì tiếp. Một lỗi được xử lý tử tế trả lời ba câu:

- **Ghi lại** đầy đủ chi tiết ở nhật ký máy chủ, cho bạn và AI lần ra nguyên nhân.
- **Báo cho người dùng** một câu dễ hiểu, không lộ chi tiết bên trong hệ thống.
- **Trả đúng mã trạng thái**, để phía gọi biết đây là thất bại.

Hai kiểu SAI hay gặp trong code AI viết:

```ts
// SAI 1: lỗi bị nuốt. Email hỏng cả tháng cũng không ai biết.
try {
  await sendReceiptEmail(order)
} catch (e) {}

// SAI 2: đưa nguyên chi tiết nội bộ cho người lạ
try {
  await saveOrder(order)
} catch (err: any) {
  return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 })
}
```

Ở kiểu thứ hai, người dùng có thể nhận được tên bảng, tên cột, câu truy vấn, đường dẫn file trên máy chủ, có khi cả chuỗi kết nối database. Với khách thật, đó là mớ chữ vô nghĩa. Với kẻ tấn công, đó là bản đồ.

Cách làm ĐÚNG trong `app/api/orders/route.ts`:

```ts
try {
  await saveOrder(order)
} catch (err) {
  // 1. Ghi đầy đủ ở máy chủ: chỉ bạn xem được trong Logs của Vercel
  console.error('Tạo đơn thất bại', { orderId: order.id, err })
  // 2. Người dùng chỉ nhận câu chung, không có ___ của hệ thống
  return NextResponse.json(
    { error: 'Chưa tạo được đơn. Bạn thử lại sau ít phút nhé.' },
    { status: 500 } // 3. Đúng mã, để giao diện biết là thất bại
  )
}
```

Một nguyên tắc đi kèm: `catch` chỉ nên đặt ở nơi bạn biết phải làm gì với lỗi. Nếu không biết, để lỗi đi tiếp lên trên còn hơn là bắt rồi im lặng. Trong Next.js App Router, file `error.tsx` đặt cạnh `page.tsx` là tấm lưới cuối: trang gặp lỗi không ai bắt thì người dùng thấy giao diện trong file này thay vì màn hình trắng.

## Tìm trong project của bạn

1. **Tìm khối `catch` rỗng:** Tìm kiếm toàn dự án (`Ctrl+Shift+F` / `Cmd+Shift+F`) chuỗi `catch`. Đọc phần trong ngoặc nhọn ngay sau từng kết quả. Có vấn đề: để trống `{}`, chỉ có một dòng chú thích, hoặc chỉ có `return null`, `return []`. Tìm thêm `.catch(() => {})`.
2. **Tìm chỗ lộ chi tiết:** Tìm `err.message`, `error.message`, `err.stack`, `String(err)`, `JSON.stringify(err)`. Ổn: chúng nằm trong `console.error(...)`. Có vấn đề: chúng nằm trong `NextResponse.json(...)`, `Response.json(...)`, hoặc được đưa vào `toast`, `alert` để hiện cho người dùng.
3. **Tìm lỗi không có mã trạng thái:** Tìm `NextResponse.json({ error`. Mỗi kết quả phải có `{ status: ... }` đi kèm. Thiếu thì phản hồi mang mã `200` và giao diện tưởng là thành công.
4. **Kiểm tra việc ghi nhật ký:** Trong các khối `catch` ở máy chủ, có `console.error` không?
5. **Kiểm tra tấm lưới cuối:** Trong thư mục `app/`, có file `error.tsx` không? Nó nên hiện một câu xin lỗi ngắn và nút thử lại, không hiện nội dung của lỗi.
6. **Ghi lại kết quả của bạn:**
   - Số khối `catch` rỗng hoặc im lặng: `[ ... - tên file: ... ]`
   - Có chỗ nào trả `err.message` hoặc `stack` về trình duyệt không?: `[ Có / Không - tên file: ... ]`
   - Dự án có `error.tsx` không?: `[ Có / Không ]`

## Tự giải thích

### Vì sao một khối `catch` rỗng lại tệ hơn việc không có `try` và `catch`?

Không có `catch`, lỗi nổi lên: yêu cầu thất bại, nhật ký có dòng đỏ, người dùng thấy có gì đó sai và bạn được báo. Có `catch` rỗng, lỗi biến mất nhưng việc vẫn hỏng. Bạn mất dấu vết duy nhất để lần ra nguyên nhân, và người dùng được báo thành công cho một việc đã thất bại.

### Nếu trả nguyên `err.message` cho trình duyệt, người ngoài có thể biết được gì?

Tùy lỗi, họ có thể thấy tên bảng và cột trong database, một phần câu truy vấn, tên thư viện và phiên bản, đường dẫn thư mục trên máy chủ, hoặc địa chỉ của dịch vụ nội bộ. Mỗi mẩu giúp họ đoán cấu trúc hệ thống và chọn cách tấn công. Người dùng bình thường thì không dùng được gì từ những dòng đó. Chi tiết thuộc về nhật ký máy chủ.

### Vì sao cần cả ba việc: ghi nhật ký, báo người dùng, và trả đúng mã trạng thái?

Mỗi việc phục vụ một bên. Nhật ký cho người vận hành biết chuyện gì hỏng và ở đâu. Câu báo cho người dùng biết việc của họ chưa xong và nên làm gì tiếp. Mã trạng thái cho code phía giao diện biết đây là thất bại để rẽ đúng nhánh. Thiếu một trong ba thì có một bên bị để trong bóng tối.

## Trắc nghiệm

### Bạn nhờ AI "sửa lỗi app bị sập khi đồng bộ kho". AI sửa như dưới đây và báo "đã hết lỗi". Đánh giá nào đúng?

```ts
try {
  await syncInventory()
} catch (e) {
  // bỏ qua để không sập app
}
```

- [ ] Đây là cách sửa đúng, vì app không còn sập
- [ ] Sai vì thiếu `finally`
- [x] Lỗi không được sửa mà chỉ bị giấu đi; việc đồng bộ vẫn hỏng và từ nay không còn dấu vết
- [ ] Sai vì `try` không dùng được với `await`

**Giải thích:** Thông báo lỗi biến mất không có nghĩa nguyên nhân biến mất. Kho vẫn không được đồng bộ, chỉ khác là không ai được báo. Cách sửa thật phải tìm ra vì sao `syncInventory` hỏng. Tối thiểu khối `catch` phải ghi nhật ký và cho phía gọi biết việc chưa xong.

### Khách gửi cho bạn ảnh chụp màn hình thông báo lỗi hiện trên app. Điều gì đáng lo nhất?

```text
relation "public.user_payments" does not exist
at /var/task/app/api/billing/route.js:41:17
```

- [x] App đang hiện chi tiết nội bộ (tên bảng, đường dẫn file máy chủ) cho bất kỳ ai gặp lỗi
- [ ] Khách dùng trình duyệt quá cũ
- [ ] Bảng `user_payments` bị thiếu
- [ ] Vercel đang gặp sự cố

**Giải thích:** Bảng bị thiếu là một lỗi cần sửa, nhưng nó chỉ là một lỗi. Việc thông báo nội bộ lọt tới màn hình khách là vấn đề của cách xử lý lỗi, và nó sẽ lặp lại với mọi lỗi sau này. Cần đổi để khách chỉ thấy câu chung, còn chi tiết ở nhật ký máy chủ.

### Hàm lấy danh sách sản phẩm được AI viết như sau. Khi database gặp sự cố, khách nhìn thấy gì?

```ts
async function getProducts() {
  try {
    return await db.product.findMany()
  } catch {
    return []
  }
}
```

- [ ] Một trang báo lỗi rõ ràng
- [ ] Danh sách sản phẩm của lần tải trước
- [ ] Vòng xoay đang tải
- [x] Một cửa hàng trống trơn, như thể bạn không bán gì, và không có dấu hiệu nào của lỗi

**Giải thích:** Trả về danh sách rỗng khi có lỗi cũng là một kiểu nuốt lỗi. Giao diện không phân biệt được "không có sản phẩm" với "không đọc được sản phẩm". Khách tưởng cửa hàng đóng cửa, còn bạn không có dòng nhật ký nào. Hàm nên ghi nhật ký và để lỗi đi tiếp cho `error.tsx` hoặc phía gọi xử lý.

### Câu trả lời lỗi nào phù hợp nhất để gửi về trình duyệt khi lưu đơn thất bại?

- [ ] `{ error: err.message }` kèm mã `200`
- [x] `{ error: 'Chưa lưu được đơn. Bạn thử lại sau.' }` kèm mã `500`, đồng thời ghi chi tiết bằng `console.error` ở máy chủ
- [ ] `{ ok: true }` để khách khỏi lo, rồi xử lý sau
- [ ] `{ error: err.stack }` kèm mã `500` để khách gửi lại cho bạn

**Giải thích:** Phương án đúng có đủ ba phần: câu dễ hiểu cho khách, mã trạng thái đúng, chi tiết ở nhật ký. Mã `200` khiến giao diện tưởng thành công. Trả `stack` nghe tiện cho việc gỡ lỗi, nhưng bạn đã có chi tiết đó trong nhật ký máy chủ mà không cần phơi ra ngoài.

## Kiểm tra không dùng AI

### Tình huống: Đây là đoạn xử lý sau khi khách thanh toán xong. Thỉnh thoảng có khách đã trả tiền nhưng đơn vẫn ở trạng thái "chờ thanh toán", và bạn không tìm thấy lỗi nào trong nhật ký. Hãy chỉ ra các vấn đề về xử lý lỗi và nêu cách sửa kèm lý do.

```ts
export async function POST(req: Request) {
  try {
    const event = await req.json()
    await markOrderPaid(event.orderId)
    await sendReceiptEmail(event.orderId)
  } catch (e) {}
  return NextResponse.json({ received: true })
}
```

#### Đáp án

1. **Lỗi bị nuốt:** Khối `catch` rỗng. Nếu `markOrderPaid` hỏng, không có dòng nhật ký nào. Đó là lý do bạn tìm không thấy gì.
2. **Báo thành công dù thất bại:** Hàm luôn trả `received: true` với mã `200`. Dịch vụ thanh toán tưởng bạn đã ghi nhận nên không gửi lại. Nhiều dịch vụ sẽ gửi lại nếu nhận được mã lỗi, nên việc báo thành công giả làm mất cơ hội sửa sai đó.
3. **Hai việc khác tầm quan trọng bị gộp chung:** Ghi nhận thanh toán là việc bắt buộc, gửi email là việc phụ. Gộp chung thì không biết bước nào hỏng.
4. **Cách sửa:** Trong `catch`, ghi `console.error` kèm mã đơn. Nếu ghi nhận thanh toán hỏng thì trả mã `500`. Tách việc gửi email ra: email hỏng thì ghi nhật ký nhưng không coi cả yêu cầu là thất bại. *Lý do:* mỗi thất bại phải để lại dấu vết, và phía gọi phải được biết sự thật.

## Lỗi suy luận hay gặp

### "App không còn hiện lỗi nghĩa là đã hết lỗi"

- **Vì sao sai:** Cách nhanh nhất để một thông báo lỗi biến mất là nuốt nó. AI được yêu cầu "làm cho hết lỗi" đôi khi chọn đúng cách đó.
- **Cách sửa:** Sau mỗi lần AI sửa lỗi, xem phần thay đổi có thêm `catch` nào không và bên trong làm gì. Hỏi AI nguyên nhân gốc là gì. Thử lại đúng thao tác từng gây lỗi và kiểm tra kết quả thật, không chỉ nhìn việc màn hình hết đỏ.

### "Hiện càng nhiều chi tiết lỗi cho người dùng thì càng dễ hỗ trợ"

- **Vì sao sai:** Chi tiết đó cũng hiện cho người có ý đồ xấu, và khách thật thì không hiểu. Bạn đã có đủ chi tiết trong nhật ký máy chủ.
- **Cách sửa:** Hiện câu chung cho người dùng. Nếu cần đối chiếu, có thể kèm một mã tham chiếu ngắn không mang thông tin nội bộ, rồi tra mã đó trong nhật ký.

## Bài tập thực hành

Mục tiêu: tìm các lỗi bị nuốt và các chỗ lộ chi tiết trong dự án, rồi xem một lỗi thật đi tới đâu. Chỉ đọc code và thử trên bản chạy ở máy hoặc bản preview.

### Việc cần làm

1. Tìm `catch` trong toàn dự án. Lập danh sách các khối rỗng hoặc chỉ trả về giá trị rỗng, kèm tên file.
2. Tìm `err.message` và `err.stack`. Đánh dấu chỗ nào được trả về trình duyệt.
3. Trên bản thử, cố ý tạo một lỗi vô hại: tắt mạng trong DevTools rồi bấm một nút có gọi máy chủ, hoặc gửi form với dữ liệu sai.
4. Ghi lại nguyên văn câu thông báo mà người dùng nhìn thấy.
5. Mở tab Network, bấm vào yêu cầu bị lỗi và đọc phần Response. Ghi lại nó có chứa tên bảng, đường dẫn file hay đoạn `stack` nào không.

### Kết quả đúng

Bạn có hai danh sách: các khối `catch` im lặng, và các chỗ trả chi tiết lỗi về trình duyệt. Với lỗi bạn tự tạo, câu thông báo là tiếng Việt dễ hiểu, phần Response không có chi tiết nội bộ, và yêu cầu lỗi mang mã 4xx hoặc 5xx chứ không phải `200`.

### Nhờ AI rà lại

```text
Hãy liệt kê mọi khối catch trong dự án. Với mỗi khối, cho biết:
tên file và dòng, lỗi có được ghi nhật ký không, phía gọi có biết
là thất bại không, có trả err.message hoặc stack về trình duyệt không.
Liệt kê riêng các câu trả lời lỗi thiếu mã trạng thái.
Chỉ báo cáo theo bảng, không sửa file nào.
```
