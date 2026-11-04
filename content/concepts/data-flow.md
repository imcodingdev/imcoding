---
id: data-flow
title: Dòng chảy dữ liệu (Data Flow)
group: systems
prerequisites: [client-server, api-endpoint, database-table]
priority: 1
signals:
  - "onSubmit"
  - "fetch('/api/"
  - "prisma."
  - "revalidatePath"
  - "router.refresh"
---

## Giải thích đời thường

Theo chân một đơn hàng trong quán: khách ghi phiếu ở bàn, nhân viên mang phiếu tới quầy, quầy kiểm tra còn nguyên liệu không, ghi vào sổ bán hàng, rồi đưa lại khách tờ hóa đơn. Nếu khách than "tôi gọi rồi mà không thấy món", người quản lý giỏi sẽ dò từng trạm: phiếu có tới quầy không? quầy có ghi sổ không? hóa đơn có về bàn không?

**Dòng chảy dữ liệu** là thói quen nhìn một tính năng như hành trình của dữ liệu qua các trạm. Với một ứng dụng web điển hình, hành trình là: **giao diện** (người dùng nhập) → **yêu cầu HTTP** → **endpoint trên máy chủ** (kiểm tra, xử lý) → **database** (lưu) → **phản hồi** quay về → **giao diện cập nhật**.

Khi có lỗi, đừng bảo AI "sửa đi" chung chung. Hãy xác định dữ liệu đã dừng ở trạm nào, rồi chỉ cho AI đúng trạm đó. Cách này cũng giúp bạn hiểu những phần code AI viết nằm ở đâu trên hành trình, thay vì thấy một mớ file rời rạc.

## Trong code trông như thế nào

Hành trình của "thêm sản phẩm", rút gọn qua ba trạm:

```tsx
// Trạm 1 - giao diện: components/AddProductForm.tsx ('use client')
const router = useRouter() // từ 'next/navigation', khai báo trong component
async function save(form: FormData) { // dùng qua <form action={save}>
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: form.get('name'), price: Number(form.get('price')) }),
  })
  if (res.ok) router.refresh() // Trạm 5 - xin dữ liệu mới để vẽ lại trang
}
```

```ts
// Trạm 2, 3, 4 - app/api/products/route.ts: nhận, lưu vào database, trả lời
export async function POST(req: Request) {
  const { name, price } = await req.json()
  const product = await prisma.product.create({ data: { name, price } })
  return Response.json(product, { status: 201 })
}
```

## Hay gặp lỗi gì

- **"Lưu rồi mà không thấy".** Database đã có dòng mới nhưng trang vẫn hiện danh sách cũ, vì giao diện không được báo để tải lại. Cách nhận ra: tải lại trang (F5) thì thấy; cần `router.refresh()` hoặc `revalidatePath(...)` sau khi lưu.
- **Tên trường lệch giữa các trạm.** Giao diện gửi `productName`, máy chủ đọc `name`, nên lưu ra giá trị rỗng. Cách nhận ra: so tab Payload trong Network với dòng `await req.json()` trong `route.ts`.
- **Dò lỗi sai trạm.** Sửa mãi phần giao diện trong khi lỗi nằm ở máy chủ. Cách nhận ra: chưa mở tab Network. Đó là chỗ chia đôi hành trình: mã `4xx`/`5xx` thì xem phía máy chủ, mã `2xx` mà màn hình sai thì xem phía giao diện.
- **Cùng một dữ liệu lưu ở hai nơi.** Giỏ hàng vừa ở `localStorage` vừa ở database, hai bên lệch nhau. Cách nhận ra: mỗi thiết bị thấy một giỏ hàng khác nhau.

## Tự kiểm tra

### Chọn một tính năng có nút "Lưu" trong dự án của bạn. Liệt kê các file mà dữ liệu đi qua, theo thứ tự.

Thường gồm: file component có form (`onSubmit` hoặc `action`), file `route.ts` hoặc hàm `'use server'` mà nó gọi, chỗ ghi database (`prisma.`, `supabase.from(`), rồi chỗ cập nhật lại giao diện.

### Bấm "Lưu" không báo lỗi nhưng dữ liệu không xuất hiện. Bạn kiểm tra theo thứ tự nào?

Mở tab Network xem yêu cầu có gửi đi và mã trạng thái là gì; mở database xem dòng mới có được ghi không; cuối cùng xem giao diện có được tải lại sau khi lưu không.
