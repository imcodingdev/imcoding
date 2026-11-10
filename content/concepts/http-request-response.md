---
id: http-request-response
title: Yêu cầu và phản hồi HTTP (HTTP Request–Response)
group: web
prerequisites: [client-server]
priority: 1
stage: 2
format: 2
signals:
  - "fetch("
  - "res.ok"
  - "res.status"
  - "NextResponse.json"
  - "{ status: 4"
---

## Nhắc lại

### Vì sao kẻ xấu có thể dễ dàng sửa đổi code hoặc giả mạo dữ liệu ở phía Client (trình duyệt), nhưng không làm vậy được với code chạy trên Server (máy chủ)?

Vì toàn bộ code và giao diện ở Client đều tải về thiết bị của người dùng; họ chỉ cần bấm F12 (DevTools) là xem và sửa được trên máy họ. Ngược lại, code Server chạy trên máy chủ của bạn (như Vercel) nên người dùng không chạm trực tiếp vào được.

### Nếu bạn ẩn nút "Xóa đơn hàng" trên màn hình của khách thường bằng điều kiện giao diện ở Client, dữ liệu trên Server đã an toàn chưa?

Chưa. Ẩn nút chỉ là giấu trên màn hình trình duyệt; nếu kẻ xấu biết địa chỉ xử lý trên Server, họ vẫn gửi thẳng lệnh xóa lên đó được nếu Server không tự kiểm tra lại quyền.

## Đoán trước

Bạn nhờ AI làm trang thanh toán đơn hàng. Hôm nay kho hết sạch cà phê, máy chủ trả về thông báo lỗi kèm mã trạng thái `400` (yêu cầu không hợp lệ) và không lưu đơn vào cơ sở dữ liệu. Thế nhưng trên điện thoại của khách, ứng dụng vẫn hiện pháo hoa *"Đặt hàng thành công!"* và xóa sạch giỏ hàng. Khách chuyển khoản xong gọi đòi hàng thì bạn tìm khắp database không thấy đơn nào. Tại sao máy chủ đã báo lỗi `400` mà giao diện ở trình duyệt vẫn tưởng là thành công?

### Đáp án

Trong JavaScript, hàm `fetch()` gửi yêu cầu lên máy chủ **chỉ tự động nhảy vào nhánh báo lỗi (`catch`) khi mất mạng hoặc không kết nối được tới máy chủ**. Còn khi máy chủ vẫn nhận đơn và trả lời — dù là từ chối với mã `400` (dữ liệu sai), `401` (chưa đăng nhập) hay `500` (máy chủ sập) — thì `fetch()` vẫn coi cuộc nói chuyện đã hoàn tất và chạy thẳng xuống dòng hiện thông báo thành công. Nếu code viết thiếu câu lệnh kiểm tra `if (!res.ok)`, trình duyệt sẽ bỏ qua lỗi của máy chủ và báo tin giả cho khách.

## Ví dụ mẫu

Hãy nghĩ tới việc đặt hàng với nhà cung cấp bằng **phiếu đặt hàng**. Mỗi lần trình duyệt (Client) nói chuyện với máy chủ (Server) qua quy tắc **HTTP** luôn là một cặp: một tờ **yêu cầu (HTTP Request)** gửi đi và một tờ **phản hồi (HTTP Response)** trả về.

- **Yêu cầu (Request)** gồm: phương thức hành động (`GET` để xem, `POST` để tạo mới, `PATCH` để sửa, `DELETE` để xóa), địa chỉ nhận, phần đầu (`headers` chứa thông tin phụ như thẻ đăng nhập) và nội dung gửi kèm (`body`).
- **Phản hồi (Response)** gồm: **mã trạng thái (status code)** như con dấu trên đầu phiếu (`200` OK, `201` đã tạo mới, `400` phiếu ghi sai, `401` chưa đăng nhập, `403` không đủ quyền, `404` không tìm thấy, `500` máy chủ lỗi) và nội dung trả về.

Lưu ý: HTTP mặc định **không tự nhớ bạn là ai** giữa hai lần gửi phiếu. Muốn máy chủ nhận ra bạn ở phiếu thứ hai, trình duyệt phải đính kèm "thẻ thành viên" (cookie hoặc token) trong `headers`.

Cách làm SAI (thiếu kiểm tra trạng thái ở cả hai đầu):

```ts
// SAI Ở CLIENT: Không kiểm tra res.ok, máy chủ trả 400 hay 500 vẫn báo thành công!
const res = await fetch('/api/orders', {
  method: 'POST',
  body: JSON.stringify({ productId: 'cafe-sua', quantity: 2 }),
})
const order = await res.json()
alert('Đặt hàng thành công mã: ' + order.id)

// SAI Ở SERVER: Báo lỗi nhưng quên gắn status, mặc định trả về 200 (OK)!
return NextResponse.json({ error: 'Hết hàng trong kho' })
```

Cách làm ĐÚNG (Server đóng dấu mã lỗi rõ ràng, Client kiểm tra dấu trước khi mừng):

```ts
// ĐÚNG Ở SERVER (app/api/orders/route.ts): Trả mã 400 khi từ chối
if (!body.productId) {
  return NextResponse.json({ error: 'Thiếu sản phẩm' }, { status: 400 })
}

// ĐÚNG Ở CLIENT: Kiểm tra trạng thái phản hồi trước khi đọc kết quả
const res = await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ productId: 'cafe-sua', quantity: 2 }),
})
if (!___) throw new Error(`Đặt hàng thất bại: mã ${res.status}`)
const order = await res.json()
```

## Tìm trong project của bạn

1. **Tìm các chỗ trình duyệt gửi yêu cầu:** Mở tìm kiếm toàn dự án (`Ctrl+Shift+F` / `Cmd+Shift+F`), gõ `fetch(`. Mở từng file trong `app/` hoặc `components/` có gọi `fetch(`.
2. **Kiểm tra xem Client có nhìn "con dấu" không:** Ngay dưới dòng `await fetch(...)`, xem có dòng `if (!res.ok)` hoặc kiểm tra `res.status` không, hay gọi thẳng `await res.json()` rồi báo thành công.
3. **Tìm các chỗ máy chủ trả lời lỗi:** Tìm `NextResponse.json` hoặc `Response.json` trong `app/api/` ở những dòng có chữ `error` hoặc `message` báo lỗi.
4. **Kiểm tra xem Server có đóng dấu mã lỗi không:** Ở những dòng trả lỗi đó, xem tham số thứ hai có `{ status: 400 }`, `{ status: 401 }`, `{ status: 403 }`, `{ status: 404 }` hay `{ status: 500 }` không. Nếu thiếu `{ status: ... }`, máy chủ đang đóng dấu `200` (Thành công) cho thông báo lỗi!
5. **Ghi lại kết quả:**
   - Có lệnh `fetch(` nào chưa kiểm tra `res.ok` không?: `[ Có / Không - tên file: ... ]`
   - Có API nào trả về `{ error: ... }` mà quên ghi `{ status: ... }` không?: `[ Có / Không - tên file: ... ]`
   - Khi mở F12 → tab Network và bấm thử một nút, cột Status hiện số mấy?: `[ Mã trạng thái: ... ]`

Trong Network, chọn đúng yêu cầu Fetch/XHR theo URL và thời điểm thao tác; xem Method, Status, Content-Type và Response cùng nhau. Ổn: trạng thái và nội dung phù hợp hợp đồng API, giao diện xử lý lỗi rõ ràng. Có vấn đề: code gọi `res.json()` nhưng nhận HTML, hoặc mã `204` không có body mà vẫn cố đọc JSON. Với project dùng `src/`, tìm thêm `src/app/api/**/route.ts`. Chỉ ghi đường dẫn không có query nhạy cảm; không xuất HAR hay Copy as cURL gửi AI vì có thể chứa cookie/token.

## Tự giải thích

### Vì sao bọc lệnh `fetch()` trong khối `try / catch` mà không viết `if (!res.ok)` thì vẫn không bắt được lỗi `404` hay `500` từ máy chủ?

Vì với `fetch()`, miễn là đường truyền mạng thông suốt và máy chủ có gửi về phản hồi hợp lệ thì kết nối đã hoàn thành, nó không tự ném ra ngoại lệ (exception). Muốn nhảy vào `catch` khi gặp mã `400`, `404` hay `500`, bạn bắt buộc phải kiểm tra `if (!res.ok)` (`res.ok` chỉ bằng `true` khi mã từ `200` đến `299`) và chủ động `throw new Error(...)`.

### Điều gì xảy ra nếu trên máy chủ, lập trình viên (hoặc AI) viết `return NextResponse.json({ error: 'Không đủ tiền' })` mà quên truyền `{ status: 400 }`?

Khi không truyền mã trạng thái, Next.js mặc định gắn mã `200 OK` cho phản hồi. Trình duyệt kiểm tra `res.ok` sẽ thấy bằng `true` (vì mã là `200`), từ đó hiểu nhầm giao dịch đã trừ tiền thành công và cho khách đi tiếp sang bước nhận hàng.

### Mã trạng thái `401 Unauthorized` và `403 Forbidden` khác nhau như thế nào trong thực tế sử dụng ứng dụng?

`401` nghĩa là **"Máy chủ chưa biết bạn là ai"** (chưa đăng nhập hoặc phiên đăng nhập hết hạn) — giao diện nên chuyển người dùng về trang Đăng nhập. Còn `403` nghĩa là **"Máy chủ biết rõ bạn là ai, nhưng tài khoản của bạn không được phép làm việc này"** (như nhân viên bấm vào trang của Giám đốc) — giao diện phải báo "Bạn không có quyền truy cập" chứ không bắt đăng nhập lại.

## Trắc nghiệm

### Network ghi 204 No Content, AI vẫn gọi res.json() rồi báo lỗi. Cần xử lý gì?

```ts
const res = await fetch('/api/demo', { method: 'POST' })
const data = await res.json()
```

- [ ] Đổi mọi mã 204 thành 500
- [x] Xử lý thành công không có body, không cố đọc JSON
- [ ] Thêm try/catch là body sẽ xuất hiện

**Giải thích:** 204 là phản hồi thành công không có nội dung. JSON parser cần dữ liệu hợp lệ; catch không tạo được body còn thiếu.

### AI thấy Unexpected token '<' khi đọc JSON. Network có Content-Type: text/html. Nên kiểm tra gì trước?

- [x] URL cuối cùng và nội dung trả về, có thể là trang đăng nhập hoặc trang lỗi
- [ ] Đổi tên mọi trường JSON của database
- [ ] Kết luận dữ liệu người dùng đã bị xóa

**Giải thích:** Dấu `<` thường đến từ HTML đang bị đọc như JSON. Cần xem phản hồi và redirect trước khi suy đoán lỗi dữ liệu.

### Log ghi 429 Too Many Requests. AI đề xuất lặp ngay liên tục cho đến khi thành công. Bạn chọn gì?

- [ ] Gửi nhanh hơn để vượt hàng chờ
- [ ] Xem 429 như 200 và báo thành công
- [x] Dừng lặp dồn dập, thông báo giới hạn và chờ theo Retry-After nếu có

**Giải thích:** 429 cho biết giới hạn tần suất. Gọi dồn thêm làm tình hình xấu hơn; thử lại còn phải phù hợp tính chất thao tác, nhất là thao tác tính tiền.

### Network hiện (failed), không có HTTP status; Console báo Failed to fetch. Nhận định nào hợp lý?

- [ ] Máy chủ chắc chắn đã trả 500
- [x] Chưa có phản hồi HTTP đọc được; cần kiểm tra mạng, URL hoặc chặn CORS
- [ ] Không có status nghĩa là thành công không body

**Giải thích:** Không nhận được phản hồi khác với nhận phản hồi lỗi HTTP. CORS hoặc sự cố mạng có thể ngăn trình duyệt đọc phản hồi; chưa đủ bằng chứng kết luận server trả 500.

## Kiểm tra không dùng AI

### Tình huống: Nhân viên thu ngân (đã đăng nhập tài khoản nhân viên) bấm nút "Xuất toàn bộ danh sách lương công ty". Máy chủ từ chối nhưng trả về mã `401`, khiến màn hình thu ngân tự động văng ra trang Đăng nhập. Thu ngân tưởng mạng lỗi nên cứ đăng nhập đi đăng nhập lại chục lần vẫn bị văng ra. Hãy chỉ ra điểm sai trong phản hồi HTTP của máy chủ và cách sửa ở cả Server lẫn Client.

#### Đáp án

1. **Điểm sai ở Server:** Thu ngân **đã đăng nhập thành công**, tức máy chủ đã biết người này là ai nhưng họ không có quyền xem bảng lương. Trả về mã `401` (chưa xác thực danh tính) là sai bản chất.
2. **Cách sửa ở Server:** Trong API xuất bảng lương, khi thấy người dùng đã đăng nhập nhưng vai trò (role) không phải Quản trị viên/Kế toán trưởng, phải trả về mã **`403` (Forbidden - Không đủ quyền)**: `return NextResponse.json({ error: 'Bạn không có quyền xem bảng lương' }, { status: 403 })`.
3. **Cách sửa ở Client:** Sau khi `fetch`, tách rõ xử lý theo `res.status`:
   - Nếu `res.status === 401`: chuyển hướng sang trang `/login`.
   - Nếu `res.status === 403`: giữ nguyên phiên đăng nhập và hiện thông báo *"Tài khoản nhân viên không có quyền thực hiện thao tác này"*.

## Lỗi suy luận hay gặp

### "Cứ thấy tab Network hiện màu xanh mã `200` nghĩa là tính năng đã chạy đúng hoàn toàn"

- **Vì sao sai:** Nhiều đoạn code do AI sinh ra trả về `NextResponse.json({ success: false, error: '...' })` nhưng quên đặt `{ status: 400 }` hoặc `{ status: 500 }`. Khi đó tab Network vẫn hiện mã `200` xanh dù nội dung bên trong là thông báo thất bại.
- **Cách sửa:** Khi kiểm tra tab Network trong F12, ngoài cột `Status`, hãy bấm vào yêu cầu đó và mở tab **Response / Preview** để đọc nội dung thực sự, đồng thời gắn đúng HTTP status code cho mọi nhánh lỗi.

### "Đã có `try { await fetch(...) } catch (err) { ... }` là bắt được mọi lỗi từ máy chủ rồi"

- **Vì sao sai:** Khối `catch` chỉ chạy khi rớt mạng, sai tên miền hoặc trình duyệt chặn kết nối. Mọi mã lỗi HTTP như `400`, `401`, `403`, `404`, `500` đều đi thẳng qua `await fetch(...)` bình thường.
- **Cách sửa:** Luôn đặt câu lệnh `if (!res.ok)` ngay sau `await fetch(...)` để đọc mã lỗi và xử lý trước khi cập nhật giao diện.

### "Lần trước người dùng vừa gọi API đăng nhập xong thì lần gọi API tiếp theo máy chủ đương nhiên tự nhớ người đó"

- **Vì sao sai:** Mỗi cặp Request–Response trong HTTP hoàn toàn độc lập; máy chủ không tự nhớ cuộc gọi trước là của ai nếu cuộc gọi sau không mang theo bằng chứng nhận diện.
- **Cách sửa:** Đảm bảo cơ chế xác thực (như cookie phiên đăng nhập hoặc header `Authorization`) được gửi kèm trong mỗi yêu cầu cần quyền hạn.

## Bài tập thực hành

Đọc một cặp request–response lấy danh sách mẫu trên bản local của project, không gửi thao tác thay đổi dữ liệu.

### Việc cần làm

1. Chọn bản thử dùng dữ liệu giả và màn hình chỉ đọc; nếu chưa có môi trường an toàn, dừng phần chạy và ghi điều kiện cần chuẩn bị.
2. Mở DevTools → Network, chọn Fetch/XHR rồi tải danh sách mẫu một lần. Không dùng Replay, Edit and Resend hoặc gọi API thanh toán.
3. Chọn đúng request, ghi Method, đường dẫn không có query nhạy cảm, Status và Content-Type. Không ghi Authorization, Cookie hoặc xuất HAR.
4. Xem Response/Preview, ghi tên trường của dữ liệu giả hoặc ghi “không có body”. Đối chiếu với `fetch` và route trong mã nguồn.
5. Ghi giao diện xử lý phản hồi thế nào, kèm điểm chưa khớp nếu có; không sửa server để tạo lỗi trên dữ liệu thật.

### Kết quả đúng

Có bản ghi một cặp yêu cầu–phản hồi với phương thức, trạng thái, loại nội dung và cách giao diện xử lý. Phân biệt request với response, không suy kết quả chỉ từ màu trong Network; bản ghi không chứa thông tin phiên đăng nhập.

### Nhờ AI rà lại

```text
Chỉ báo cáo, không tự sửa hoặc gửi request. Rà bản ghi Network đã che thông tin và đoạn fetch/route tôi cung cấp: status, Content-Type, body có khớp cách đọc và hiển thị không? Không yêu cầu HAR, cookie, token hay dữ liệu khách hàng. Nêu rõ bằng chứng còn thiếu.
```
