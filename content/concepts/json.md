---
id: json
title: Định dạng dữ liệu JSON (JSON)
group: api
prerequisites: [http-request-response]
priority: 1
stage: 2
signals:
  - "JSON.stringify"
  - "JSON.parse"
  - "await res.json()"
  - "'Content-Type': 'application/json'"
  - "package.json"
---

## Giải thích đời thường

Hãy tưởng tượng mọi nhà cung cấp và mọi cửa hàng thống nhất dùng **một mẫu phiếu giao hàng chuẩn**: mỗi dòng là "tên mục: giá trị", ví dụ "Khách hàng: Lan", "Số lượng: 2". Nhờ chung mẫu, bên nào nhận phiếu cũng đọc được, dù hai bên dùng phần mềm khác nhau.

**JSON** là mẫu phiếu chuẩn đó cho dữ liệu trên Internet. Nó là văn bản thuần, gồm các cặp `"tên": giá trị`, đặt trong dấu ngoặc nhọn `{ }`; danh sách thì đặt trong ngoặc vuông `[ ]`. Giá trị có thể là chữ (trong ngoặc kép), số, `true`/`false`, `null`, hoặc một JSON khác lồng bên trong.

Khi trình duyệt gửi đơn hàng lên máy chủ hay máy chủ trả danh sách sản phẩm về, gần như luôn là JSON. Đi trên đường truyền thì JSON chỉ là chuỗi chữ; trong code, ta "đóng gói" dữ liệu thành chuỗi trước khi gửi và "mở gói" thành dữ liệu sau khi nhận. File cấu hình như `package.json` cũng viết bằng JSON, nên luật viết giống hệt.

## Trong code trông như thế nào

Một đơn hàng dạng JSON:

```json
{
  "id": "DH001",
  "customer": { "name": "Lan", "phone": "0901234567" },
  "items": [{ "product": "Cà phê sữa", "quantity": 2, "price": 29000 }],
  "paid": false,
  "createdAt": "2026-11-03T08:30:00.000Z"
}
```

Đóng gói khi gửi đi và mở gói khi nhận về:

```ts
const res = await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ productId: 'cafe-sua', quantity: 2 }), // dữ liệu -> chuỗi
})
const order = await res.json() // chuỗi -> dữ liệu
```

## Hay gặp lỗi gì

- **"Unexpected token '<' ... is not valid JSON".** Code chờ JSON nhưng máy chủ trả về một trang HTML (thường là trang 404 hoặc trang lỗi). Cách nhận ra: thông báo có chữ `<!DOCTYPE`; kiểm tra lại địa chỉ gọi và mã trạng thái trong tab Network.
- **Quên `JSON.stringify` khi gửi.** Máy chủ nhận được chuỗi `"[object Object]"`. Cách nhận ra: `body: { ... }` truyền thẳng một đối tượng vào `fetch`.
- **Ngày tháng biến thành chuỗi.** JSON không có kiểu ngày; `createdAt` về tới trình duyệt là chuỗi chữ, gọi `.getFullYear()` sẽ lỗi. Cách nhận ra: lỗi kiểu "getFullYear is not a function"; cần `new Date(order.createdAt)`.
- **Viết sai luật JSON trong file cấu hình.** JSON chuẩn không cho dấu phẩy thừa ở cuối và không cho ghi chú. Cách nhận ra: `npm` báo lỗi đọc `package.json` sau khi bạn sửa tay.

## Tự kiểm tra

### Mở tab Network, bấm một nút gửi dữ liệu trên web của bạn. Tìm JSON đã gửi đi và JSON nhận về ở đâu?

Bấm vào yêu cầu đó: tab Payload hiện JSON gửi đi, tab Response (hoặc Preview) hiện JSON máy chủ trả về.

### Bạn gặp lỗi "Unexpected token '<'". Việc đầu tiên nên kiểm tra là gì?

Xem mã trạng thái và nội dung phản hồi trong tab Network. Rất có thể địa chỉ gọi sai (404) hoặc máy chủ lỗi (500) nên trả về trang HTML thay vì JSON.
