---
id: json
title: Định dạng dữ liệu JSON (JSON)
group: api
prerequisites: [http-request-response]
priority: 1
stage: 2
format: 2
signals:
  - "JSON.stringify"
  - "JSON.parse"
  - "await res.json()"
  - "'Content-Type': 'application/json'"
  - "package.json"
---

## Nhắc lại

### Khi gọi `const res = await fetch('/api/orders')`, nếu máy chủ gặp sự cố và trả về mã `500`, lệnh `fetch` có tự động dừng lại và báo lỗi không?

Không. `fetch` chỉ tự báo lỗi khi mất kết nối mạng. Khi máy chủ trả về mã `500`, `fetch` vẫn chạy tiếp xuống các dòng code bên dưới trừ khi bạn tự kiểm tra `if (!res.ok)`.

### Sự khác nhau giữa mã trạng thái `401` và `403` trong phản hồi HTTP là gì?

`401` là người gọi chưa đăng nhập (máy chủ chưa biết bạn là ai); còn `403` là người gọi đã đăng nhập rồi nhưng tài khoản đó không được cấp quyền thực hiện thao tác này.

## Đoán trước

Bạn thêm tính năng tạo mã giảm giá trên trang quản trị. Khi bấm nút "Lưu", màn hình trắng xóa và bảng điều khiển (Console) hiện dòng chữ đỏ: `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`. Bạn mở code xem chỗ `await res.json()` và bảo AI sửa lỗi đọc JSON suốt hai tiếng nhưng vẫn không hết lỗi. Thực ra dữ liệu JSON của bạn không hề hỏng — vậy ký tự `<` và chữ `<!DOCTYPE` kia từ đâu chui ra?

### Đáp án

Dòng chữ `<!DOCTYPE html>` là câu mở đầu của một **trang web HTML**, không phải dữ liệu JSON. Khi trình duyệt gọi `fetch('/api/coupons')`, rất có thể bạn đã gõ sai đường dẫn API (máy chủ trả về trang lỗi `404 Not Found` bằng HTML) hoặc máy chủ bị sập giữa chừng (trả về trang báo lỗi `500` bằng HTML). Vì code phía Client không kiểm tra `res.ok` mà gọi thẳng `await res.json()` để "mở gói JSON" trên một trang HTML, nó đụng ngay dấu `<` đầu tiên và báo lỗi cú pháp.

## Ví dụ mẫu

Hãy tưởng tượng mọi nhà cung cấp và cửa hàng thống nhất dùng **một mẫu phiếu giao hàng chuẩn**: mỗi dòng viết theo khuôn `"tên mục": giá trị`, đặt trong ngoặc nhọn `{ }`, còn danh sách nhiều món đặt trong ngoặc vuông `[ ]`. Nhờ chung mẫu văn bản thuần túy đó, dù trình duyệt hay máy chủ dùng ngôn ngữ nào thì hai bên đều đọc hiểu được ngay.

Mẫu phiếu chuẩn đó trên Internet gọi là **JSON (JavaScript Object Notation)**. Khi đi trên đường truyền mạng, dữ liệu bắt buộc phải nằm dưới dạng chuỗi chữ (văn bản):
- Trước khi gửi đi qua `fetch`, ta phải **"đóng gói"** đối tượng dữ liệu trong code thành chuỗi JSON bằng `JSON.stringify(...)`.
- Khi nhận phản hồi về, ta **"mở gói"** chuỗi JSON trở lại thành dữ liệu dùng được trong code bằng `await res.json()` (hoặc `JSON.parse(...)`).

Cách làm SAI (quên đóng gói khi gửi, và mở gói mù quáng khi nhận):

```ts
// SAI 1: Truyền thẳng đối tượng vào body mà quên đóng gói thành chuỗi JSON
const res = await fetch('/api/orders', {
  method: 'POST',
  body: { productId: 'cafe-sua', quantity: 2 } as any, // Bị biến thành "[object Object]"!
})
// SAI 2: Gọi res.json() ngay cả khi máy chủ trả về trang lỗi HTML 404/500
const order = await res.json()
// SAI 3: Tưởng ngày tháng trong JSON vẫn là kiểu Date nên gọi thẳng hàm ngày tháng
console.log(order.createdAt.getFullYear()) // Lỗi: getFullYear is not a function!
```

Cách làm ĐÚNG (đóng gói chuẩn, kiểm tra trước khi mở gói, đổi lại kiểu ngày tháng):

```ts
const res = await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: ___.stringify({ productId: 'cafe-sua', quantity: 2 }),
})
if (!res.ok) {
  const errText = await res.text() // Đọc dạng chữ thường để xem lỗi thật sự
  throw new Error(`Lỗi ${res.status}: ${errText}`)
}
const order = await res.json() // Mở gói chuỗi JSON thành dữ liệu
const year = new Date(order.createdAt).getFullYear() // Chuyển chuỗi ISO lại thành Date
```

## Tìm trong project của bạn

Kiểm tra cách dự án của bạn đóng gói và mở gói JSON theo các bước sau:

1. **Kiểm tra đóng gói khi gửi (`JSON.stringify`):** Mở tìm kiếm toàn dự án (`Ctrl+Shift+F` / `Cmd+Shift+F`), tìm `fetch(`. Với các lệnh có `method: 'POST'`, `'PUT'`, hoặc `'PATCH'`, kiểm tra xem phần `body:` đã bọc trong `JSON.stringify(...)` và kèm header `'Content-Type': 'application/json'` chưa.
2. **Kiểm tra mở gói an toàn (`res.json()`):** Tìm tất cả các dòng có `.json()` trong thư mục `app/` và `components/`. Xem phía trên dòng `await res.json()` hoặc `await req.json()` có bước kiểm tra lỗi hoặc khối bắt lỗi hợp lệ không.
3. **Kiểm tra xử lý ngày tháng từ JSON:** Tìm các trường thời gian như `createdAt`, `updatedAt`, `created_at` ở các file giao diện. Xem code có bọc `new Date(...)` trước khi định dạng ngày tháng không.
4. **Kiểm tra file cấu hình JSON:** Mở file `package.json` ở thư mục gốc dự án để quan sát cấu trúc JSON chuẩn (mọi tên trường nằm trong ngoặc kép `""`, mục cuối cùng không có dấu phẩy thừa).
5. **Ghi lại kết quả:**
   - Có chỗ nào gọi `await res.json()` mà chưa kiểm tra `res.ok` phía trên không?: `[ Có / Không - tên file: ... ]`
   - Trong tab Network (F12), khi bấm vào một yêu cầu API, tab **Payload** và **Response** hiển thị những trường JSON nào?: `[ Các trường: ... ]`
   - Có file cấu hình `.json` nào đang bị báo đỏ trong trình soạn thảo không?: `[ Có / Không ]`

## Tự giải thích

### Vì sao khi gặp lỗi `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`, việc sửa code ở dòng `res.json()` không giải quyết được gốc rễ vấn đề?

Vì lỗi không nằm ở hàm đọc JSON, mà do **máy chủ đã trả về một trang HTML báo lỗi thay vì trả về JSON**. Bạn cần mở F12 → tab Network xem yêu cầu đó gọi tới địa chỉ nào và nhận mã trạng thái gì (thường là `404` do sai đường dẫn `/api/...`, hoặc `500` do code máy chủ bị sập), từ đó sửa đúng đường dẫn hoặc sửa lỗi trên máy chủ.

### Điều gì xảy ra nếu bạn gửi dữ liệu bằng `fetch` với `body: { name: "Lan" }` mà quên dùng `JSON.stringify()`?

Hàm `fetch` chỉ gửi được văn bản hoặc dữ liệu nhị phân qua mạng. Khi đưa thẳng một đối tượng JavaScript vào `body`, trình duyệt tự ép kiểu nó thành chuỗi vô nghĩa `"[object Object]"`. Khi máy chủ gọi `await req.json()` để đọc đơn hàng, máy chủ sẽ báo lỗi ngay vì `"[object Object]"` không phải là JSON hợp lệ.

### Vì sao đối tượng ngày tháng (`Date`) khi gửi từ máy chủ qua JSON về trình duyệt lại không gọi được các hàm như `.getFullYear()` hay `.toLocaleDateString()` nữa?

Vì định dạng JSON chuẩn chỉ hỗ trợ chuỗi chữ, số, `true`/`false`, `null`, mảng `[]` và đối tượng `{}` — **JSON không có kiểu Ngày tháng (`Date`)**. Khi đóng gói sang JSON, ngày giờ bị biến thành chuỗi chữ (như `"2026-11-05T08:30:00.000Z"`). Khi trình duyệt mở gói JSON ra, nó vẫn chỉ là chuỗi chữ; muốn dùng các hàm ngày tháng, bạn phải bọc lại bằng `new Date(chuoiNgay)`.

## Kiểm tra không dùng AI

### Tình huống: Bạn tự mở file `package.json` để thêm một thư viện mới. Bạn viết thêm dòng `"stripe": "^14.0.0",` ở dòng cuối cùng trong mục `"dependencies"`, và cẩn thận viết thêm dòng ghi chú `// Thư viện thanh toán Stripe` ngay bên cạnh để dễ nhớ. Khi chạy lệnh `npm run dev`, toàn bộ dự án báo lỗi không chạy được. Hãy chỉ ra 2 lỗi vi phạm quy tắc JSON trong thao tác vừa rồi và cách sửa.

#### Đáp án

1. **Lỗi 1 — Dấu phẩy thừa ở phần tử cuối cùng (Trailing comma):** Khác với JavaScript/TypeScript, định dạng JSON chuẩn **cấm tuyệt đối dấu phẩy `,` sau mục cuối cùng** trong ngoặc nhọn `{}` hoặc ngoặc vuông `[]`. Dấu phẩy cuối dòng `"stripe": "^14.0.0",` làm trình đọc JSON báo lỗi cú pháp.
2. **Lỗi 2 — Viết ghi chú (Comment) trong file JSON:** Định dạng JSON chuẩn **không cho phép viết ghi chú** bằng `//` hay `/* */`. Mọi ký tự ngoài cặp `"tên": giá trị` đều làm hỏng file.
3. **Cách sửa:** Xóa dòng ghi chú `// Thư viện thanh toán Stripe`, đảm bảo các dòng phía trên cách nhau bằng dấu phẩy nhưng dòng cuối cùng trong `"dependencies"` không có dấu phẩy ở cuối.

## Lỗi suy luận hay gặp

### "Hàm `await res.json()` tự động biến mọi dữ liệu về lại đúng kiểu ban đầu trên máy chủ, kể cả kiểu `Date`"

- **Vì sao sai:** `res.json()` chỉ đọc văn bản JSON sang các kiểu cơ bản của JSON. Những kiểu đặc biệt của JavaScript như `Date` (bị đổi thành chuỗi chữ) hay `undefined` (bị xóa mất khỏi đối tượng khi `JSON.stringify`) sẽ không tự khôi phục lại như cũ.
- **Cách sửa:** Khi nhận dữ liệu ngày giờ từ API, luôn coi nó là chuỗi chữ (`string`) và chủ động chuyển đổi bằng `new Date(...)` trước khi tính toán.

### "Gửi dữ liệu từ hàm `async` trên Server xuống Client hoặc qua API thì cứ nhét bất kỳ thứ gì vào cũng được"

- **Vì sao sai:** Mọi dữ liệu đi qua ranh giới mạng (HTTP API hoặc từ Server Component truyền xuống Client Component trong Next.js) đều phải đóng gói (serialize) được sang dạng tương đương JSON. Nếu truyền một hàm xử lý (`function`) hoặc kết nối database, ứng dụng sẽ báo lỗi ngay.
- **Cách sửa:** Chỉ truyền dữ liệu thuần (chữ, số, boolean, mảng, đối tượng đơn giản) qua API và giữa Server với Client.

### "File `.json` cũng giống file `.js` nên viết nháy đơn `'...'` hay không bọc ngoặc kép quanh tên trường cũng được"

- **Vì sao sai:** Trong JavaScript bạn viết `{ name: 'Lan' }` được, nhưng trong JSON bắt buộc cả tên trường lẫn giá trị chuỗi phải dùng **dấu ngoặc kép** `{"name": "Lan"}`.
- **Cách sửa:** Luôn dùng dấu ngoặc kép `"` trong JSON và chú ý vạch báo lỗi màu đỏ của trình soạn thảo khi sửa các file `.json`.
