---
id: html-css-js
title: HTML, CSS và JavaScript (HTML–CSS–JS)
group: web
prerequisites: [client-server]
priority: 1
stage: 2
signals:
  - "className="
  - "globals.css"
  - "onClick"
  - "tailwind"
  - ".tsx"
---

## Giải thích đời thường

Hãy nhìn một cửa hàng như ba lớp. Lớp thứ nhất là **kệ, quầy, bảng tên, sản phẩm**: cửa hàng có những gì. Lớp thứ hai là **sơn tường, ánh đèn, cách bày biện**: mọi thứ trông ra sao. Lớp thứ ba là **nhân viên**: khách hỏi hay bấm chuông thì có người phản ứng.

Trình duyệt chỉ hiểu đúng ba thứ tương ứng. **HTML** là lớp kệ và sản phẩm: tiêu đề, đoạn chữ, ô nhập, nút bấm. **CSS** là lớp trang trí: màu, cỡ chữ, khoảng cách, bố cục. **JavaScript (JS)** là lớp nhân viên: bấm nút thì chuyện gì xảy ra, dữ liệu được gửi đi đâu.

Dự án của bạn có thể dùng React, Next.js, Tailwind, TypeScript. Đó chỉ là công cụ giúp viết nhanh hơn; cuối cùng mọi thứ vẫn được chuyển thành HTML, CSS và JS để trình duyệt hiểu. Biết một dòng code thuộc lớp nào giúp bạn tả lỗi cho AI chính xác hơn: "nút bị lệch" là chuyện CSS, "bấm không ăn" là chuyện JS.

## Trong code trông như thế nào

AI thường sinh ra file `.tsx` trộn cả ba lớp trong một chỗ:

```tsx
'use client'

export default function Newsletter() {
  return (
    <div className="flex gap-2 p-4 rounded-lg bg-amber-50">
      <input type="email" placeholder="Email của bạn" />
      <button className="bg-amber-600 text-white px-3" onClick={() => alert('Cảm ơn!')}>
        Đăng ký
      </button>
    </div>
  )
}
```

- Các thẻ `<div>`, `<input>`, `<button>` là **HTML** (viết theo kiểu JSX của React).
- Chuỗi trong `className="..."` là **CSS** viết bằng Tailwind: `p-4` là khoảng đệm, `bg-amber-50` là màu nền.
- `onClick={() => ...}` là **JavaScript**: việc xảy ra khi bấm.

## Hay gặp lỗi gì

- **Ghép tên class Tailwind bằng biến.** Viết `` className={`bg-${color}-500`} `` thì Tailwind không thấy tên class đầy đủ nên không tạo CSS, màu không hiện. Cách nhận ra: viết cứng thì đúng màu, đổi sang biến thì mất màu. Cần viết đủ tên, ví dụ chọn giữa `'bg-red-500'` và `'bg-green-500'`.
- **Gắn `onClick` vào component chạy trên máy chủ.** Next.js báo lỗi kiểu "Event handlers cannot be passed to Client Component props". Cách nhận ra: file có `onClick` hoặc `useState` nhưng thiếu dòng `'use client'` ở đầu.
- **Chép HTML thuần vào JSX.** HTML viết `class=` và `for=`, JSX phải viết `className=` và `htmlFor=`. Cách nhận ra: cảnh báo "Invalid DOM property" trong Console.

## Tự kiểm tra

### Mở một file `.tsx` có nút bấm trong dự án của bạn. Chỉ ra phần HTML, phần CSS và phần JS của nút đó.

Thẻ `<button>` là HTML, chuỗi trong `className` là CSS (Tailwind), còn hàm truyền vào `onClick` là JavaScript.

### Bạn muốn đổi màu nút từ cam sang xanh dương. Bạn sửa ở lớp nào?

Lớp CSS: đổi class màu trong `className`, ví dụ từ `bg-amber-600` sang `bg-blue-600`. Không cần đụng tới phần JS.
