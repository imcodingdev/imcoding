---
id: component
title: Thành phần giao diện (Component)
group: frontend
prerequisites: [html-css-js]
priority: 1
stage: 2
signals:
  - "components/"
  - "export default function"
  - ".tsx"
  - "props"
---

## Giải thích đời thường

Một chuỗi cửa hàng không thiết kế lại kệ trưng bày cho từng sản phẩm. Họ làm một **mẫu kệ chuẩn**: khung, bảng giá, đèn chiếu. Sau đó đặt mẫu kệ ấy ở khắp nơi, mỗi kệ chỉ thay sản phẩm và giá. Muốn đổi màu bảng giá, sửa mẫu một lần là mọi kệ đổi theo.

**Component** trong React là mẫu kệ như vậy cho giao diện. Đó là một hàm trả về một mảnh giao diện: thẻ sản phẩm, nút mua, thanh menu, cả một trang. Bạn ghép các component nhỏ thành component lớn, như ghép kệ, quầy, bảng hiệu thành cửa hàng.

Phần thông tin "điền vào" mỗi lần dùng mẫu gọi là **props** (tên sản phẩm, giá, ảnh). Khi đọc code AI viết, hãy tìm thư mục `components/`: mỗi file ở đó thường là một mẫu kệ. Hiểu component giúp bạn ra lệnh cho AI gọn hơn: "sửa `ProductCard` để hiện giá khuyến mãi" thay vì "sửa cái ô sản phẩm ở trang chủ".

## Trong code trông như thế nào

Một component tên `ProductCard`, thường nằm ở `components/ProductCard.tsx`:

```tsx
type Props = { name: string; price: number }

export default function ProductCard({ name, price }: Props) {
  return (
    <div className="border rounded p-3">
      <h3 className="font-bold">{name}</h3>
      <p>{price.toLocaleString('vi-VN')} đ</p>
    </div>
  )
}
```

Dùng lại mẫu đó nhiều lần trong một trang:

```tsx
import ProductCard from '@/components/ProductCard'

export default function HomePage() {
  return (
    <main className="grid grid-cols-2 gap-4">
      <ProductCard name="Cà phê sữa" price={29000} />
      <ProductCard name="Trà đào" price={35000} />
    </main>
  )
}
```

## Hay gặp lỗi gì

- **AI tạo component mới thay vì dùng lại cái có sẵn.** Dự án dần có `ProductCard`, `ProductItem`, `ItemCard` làm cùng một việc, sửa chỗ này chỗ kia không đổi theo. Cách nhận ra: thư mục `components/` có nhiều file tên na ná nhau.
- **Thiếu `key` khi hiển thị danh sách.** Dùng `products.map(...)` mà không có `key={p.id}`, Console báo "Each child in a list should have a unique key prop". Danh sách có thể hiển thị lộn xộn khi thêm hoặc xóa.
- **Tên component viết thường.** React hiểu `<productCard />` là thẻ HTML lạ chứ không phải component của bạn. Cách nhận ra: không hiện gì và Console có cảnh báo về thẻ không nhận ra. Tên component phải viết hoa chữ đầu.
- **Một file khổng lồ.** Một component dài vài trăm dòng làm mọi việc. Cách nhận ra: file trong `app/` dài hơn 300 dòng; nên nhờ AI tách thành các component nhỏ.

## Tự kiểm tra

### Mở thư mục `components/` trong dự án của bạn, chọn một file. Component đó đang được dùng ở những trang nào?

Tìm trong toàn dự án chuỗi `<TênComponent` (ví dụ `<ProductCard`). Mỗi kết quả là một chỗ dùng mẫu đó; sửa file component thì tất cả chỗ đó đổi theo.

### Bạn muốn mọi thẻ sản phẩm trên web hiện thêm chữ "Hết hàng". Bạn sửa một file hay nhiều file?

Một file: chính file component thẻ sản phẩm (ví dụ `ProductCard.tsx`), có thể thêm một prop như `inStock` để biết khi nào hiện chữ đó.
