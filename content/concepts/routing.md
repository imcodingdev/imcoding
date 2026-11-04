---
id: routing
title: Định tuyến trang (Routing)
group: frontend
prerequisites: [component]
priority: 1
signals:
  - "app/**/page.tsx"
  - "[id]"
  - "next/link"
  - "next/navigation"
  - "useRouter"
---

## Giải thích đời thường

Vào một siêu thị, bạn nhìn biển chỉ dẫn: "Gian 1: Đồ uống", "Gian 2: Bánh kẹo". Mỗi biển dẫn tới đúng một gian hàng. **Routing** là hệ thống biển chỉ dẫn của trang web: người dùng gõ hoặc bấm vào một địa chỉ (URL) như `/san-pham`, ứng dụng biết phải mở trang nào.

Next.js (kiểu App Router mà AI hay dùng) làm việc này bằng **thư mục**. Cấu trúc thư mục trong `app/` chính là sơ đồ siêu thị: thư mục `app/san-pham/` có file `page.tsx` thì địa chỉ `/san-pham` tồn tại. Không có `page.tsx` thì không có trang.

Có những gian "đánh số", ví dụ tủ gửi đồ: một mẫu tủ chung, mỗi ô một số. Thư mục có tên trong ngoặc vuông như `[id]` là ô đánh số như vậy: `app/don-hang/[id]/page.tsx` phục vụ cả `/don-hang/1`, `/don-hang/2`... và nhận con số đó để tìm đúng đơn hàng. Biết điều này, bạn có thể nhìn URL trên trình duyệt và tự tìm ra file cần sửa.

## Trong code trông như thế nào

Thư mục và địa chỉ tương ứng:

```text
app/page.tsx                  ->  /
app/san-pham/page.tsx         ->  /san-pham
app/don-hang/[id]/page.tsx    ->  /don-hang/123, /don-hang/abc ...
app/api/orders/route.ts       ->  /api/orders (API, không phải trang)
```

Trang có ô đánh số. Ở phiên bản Next.js hiện tại, `params` phải được `await`:

```tsx
import Link from 'next/link'

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <main>
      <h1>Đơn hàng {id}</h1>
      <Link href="/san-pham">Mua thêm</Link>
    </main>
  )
}
```

## Hay gặp lỗi gì

- **Trộn hai kiểu định tuyến.** Next.js có kiểu cũ (thư mục `pages/`, `next/router`) và kiểu mới (thư mục `app/`, `next/navigation`). AI đôi khi viết theo kiểu cũ. Cách nhận ra: lỗi "NextRouter was not mounted", hoặc dự án có cả `pages/` lẫn `app/`.
- **Dùng `params.id` mà không `await`.** Code cũ AI học được viết `params.id` trực tiếp; bản Next.js mới coi `params` là Promise. Cách nhận ra: `id` ra `undefined`, hoặc TypeScript báo lỗi ở dòng có `params.id`.
- **Tạo thư mục nhưng quên `page.tsx`, hoặc đặt sai tên file.** Cách nhận ra: vào địa chỉ đó thấy trang 404, dù thư mục đã có.
- **Dùng thẻ `<a>` thay cho `<Link>` khi đi giữa các trang trong web.** Mỗi lần bấm, cả trang tải lại từ đầu, chậm hơn. Cách nhận ra: màn hình chớp trắng khi chuyển trang.

## Tự kiểm tra

### Người dùng báo lỗi ở địa chỉ `/don-hang/123`. Bạn mở file nào trong dự án?

`app/don-hang/[id]/page.tsx`. Phần `123` được truyền vào trang qua `params` (lấy bằng `const { id } = await params`).

### Bạn muốn thêm trang "Giới thiệu" ở địa chỉ `/gioi-thieu`. Cần tạo gì?

Tạo thư mục `app/gioi-thieu/` và trong đó một file `page.tsx` có `export default function` trả về nội dung trang.

### Trong dự án của bạn, hãy liệt kê các trang đang có bằng cách nhìn vào thư mục `app/`.

Mỗi file `page.tsx` là một trang; đường dẫn thư mục chứa nó (bỏ phần `app`) là địa chỉ của trang. Thư mục có tên trong ngoặc tròn như `(shop)` chỉ để gom nhóm, không xuất hiện trong địa chỉ.
