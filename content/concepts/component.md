---
id: component
title: Thành phần giao diện (Component)
group: frontend
prerequisites: [html-css-js]
priority: 1
stage: 2
format: 2
signals:
  - "components/"
  - "export default function"
  - ".tsx"
  - "props"
---

## Nhắc lại

### Trong một file `.tsx` của Next.js, ba phần: thẻ `<button>`, thuộc tính `className="..."`, và sự kiện `onClick={...}` lần lượt thuộc lớp nào?

Thẻ `<button>` thuộc lớp **HTML** (khung nội dung), chuỗi trong `className="..."` thuộc lớp **CSS** (trang trí giao diện bằng Tailwind), và hàm trong `onClick={...}` thuộc lớp **JavaScript** (hành động khi người dùng bấm).

### Vì sao không nên viết tên class Tailwind theo kiểu cắt ghép biến như `` className={`bg-${color}-500`} ``?

Vì Tailwind chỉ quét mặt chữ tĩnh trong code để tạo file CSS; nếu ghép biến vào giữa, Tailwind không nhìn thấy tên class đầy đủ như `bg-red-500` nên sẽ không sinh ra màu đó.

## Đoán trước

Trang web bán hàng của bạn có thẻ sản phẩm xuất hiện ở 3 nơi: Trang chủ, Trang danh mục và Kết quả tìm kiếm. Hôm nay bạn bảo AI: *"Sửa thẻ sản phẩm ở trang chủ để hiện thêm nhãn Giảm giá màu đỏ"*. AI làm xong rất nhanh. Nhưng khi bạn bấm sang Trang danh mục và Trang tìm kiếm, các thẻ sản phẩm ở đó vẫn giữ nguyên kiểu cũ, không có nhãn giảm giá; tệ hơn, phông chữ giá tiền ở 3 trang bắt đầu lệch nhau. Tại sao sửa cùng một "thẻ sản phẩm" mà các trang lại không đồng bộ?

### Đáp án

Khi bạn chỉ mô tả vị trí trên màn hình (*"ở trang chủ"*), AI thường chọn cách dễ nhất là viết thẳng code HTML/CSS vào riêng file trang chủ, hoặc tự đẻ thêm các file mới na ná nhau như `ProductCard.tsx`, `ProductItem.tsx`, `SearchCard.tsx` thay vì dùng chung một **Component (Thành phần giao diện)** duy nhất. Đúng nguyên tắc, toàn bộ web chỉ nên có một mẫu `ProductCard` nằm trong thư mục `components/`. Khi mọi trang cùng lấy mẫu kệ đó ra dùng, bạn chỉ cần sửa đúng file `ProductCard.tsx` một lần là cả 3 trang tự động cập nhật đồng bộ.

## Ví dụ mẫu

Một chuỗi cửa hàng không thiết kế lại kệ trưng bày cho từng món hàng. Họ đóng một **mẫu kệ chuẩn** gồm khung, bảng giá, đèn chiếu, rồi đặt mẫu kệ ấy ở khắp nơi; mỗi kệ chỉ thay tên món và giá tiền. Muốn đổi màu bảng giá, chỉ cần sửa mẫu chuẩn một lần là mọi kệ trong chuỗi đổi theo.

Trong React và Next.js, **Component (Thành phần giao diện)** chính là mẫu kệ chuẩn đó: một hàm trả về một mảnh giao diện (thẻ sản phẩm, nút mua, thanh menu). Phần thông tin truyền riêng vào mỗi lần đặt kệ (tên món, giá tiền) gọi là **props**.

Cách làm SAI (viết thường chữ cái đầu của tên component và lặp danh sách thiếu định danh `key`):

```tsx
// SAI: Tên hàm viết thường chữ đầu (productCard) khiến React tưởng là thẻ HTML lạ
export function productCard({ name, price }: { name: string; price: number }) {
  return <div className="border p-3">{name} - {price} đ</div>
}

export default function MenuList({ items }: { items: { id: string; name: string; price: number }[] }) {
  // SAI: Dùng .map() tạo danh sách nhưng thiếu thuộc tính định danh cho từng phần tử
  return <div>{items.map((item) => <productCard name={item.name} price={item.price} />)}</div>
}
```

Cách làm ĐÚNG với file mẫu `components/ProductCard.tsx` và tái sử dụng:

```tsx
// ĐÚNG: Tên Component bắt buộc viết hoa chữ cái đầu (ProductCard)
type Props = { name: string; price: number }

export function ProductCard({ name, price }: Props) {
  return (
    <div className="border rounded p-3">
      <h3 className="font-bold">{name}</h3>
      <p>{price.toLocaleString('vi-VN')} đ</p>
    </div>
  )
}

export default function HomePage({ products }: { products: { id: string; name: string; price: number }[] }) {
  return (
    <main className="grid grid-cols-2 gap-4">
      {products.map((p) => (
        <ProductCard ___={p.id} name={p.name} price={p.price} />
      ))}
    </main>
  )
}
```

## Tìm trong project của bạn

Kiểm tra cách AI đang tổ chức các thành phần giao diện trong dự án của bạn:

1. **Khám phá kho mẫu kệ (`components/`):** Mở thư mục `components/` ở cây thư mục bên trái. Đọc lướt tên các file `.tsx` xem có những file nào tên gần giống nhau (như `ProductCard.tsx`, `ItemCard.tsx`, `CardProduct.tsx`) đang làm trùng một việc không.
2. **Kiểm tra một component được dùng ở mấy nơi:** Chọn một tên component bất kỳ (như `Navbar` hoặc `Button`), bấm `Ctrl+Shift+F` / `Cmd+Shift+F` và tìm chuỗi `<TênComponent` (có dấu `<` ở đầu).
3. **Kiểm tra lỗi thiếu `key` khi lặp danh sách:** Tìm chuỗi `.map(` trong toàn dự án. Nhìn dòng thẻ hoặc component nằm ngay bên trong `.map(` xem đã có thuộc tính `key={...}` (thường là `key={item.id}`) chưa.
4. **Phát hiện file "khổng lồ" chưa tách component:** Mở các file `page.tsx` trong thư mục `app/`. Xem có file nào dài quá 300 dòng, nhồi nhét cả thanh menu, biểu mẫu, danh sách thẻ trong cùng một chỗ không.
5. **Ghi lại kết quả:**
   - Có những file nào trong `components/` đang bị trùng lặp chức năng không?: `[ Có / Không - tên file: ... ]`
   - Các vòng lặp `.map(` trong dự án đã có đủ `key={...}` dùng mã định danh riêng chưa?: `[ Đã đủ / Còn thiếu ở file: ... ]`
   - Có file `page.tsx` nào dài trên 300 dòng cần tách nhỏ không?: `[ Có / Không - tên file: ... ]`

## Tự giải thích

### Vì sao khi muốn thêm chữ "Hết hàng" cho mọi ô sản phẩm trên toàn trang web, việc gom chung vào một component `ProductCard` lại an toàn hơn nhiều so với viết rời ở từng trang?

Nếu viết rời ở 4 trang khác nhau, bạn hoặc AI phải nhớ sửa đủ 4 file; chỉ cần sót 1 file là khách thấy trang chủ báo hết hàng nhưng trang tìm kiếm vẫn cho bấm mua. Khi dùng chung một component `ProductCard`, bạn chỉ cần thêm một prop (như `inStock`) và sửa đúng 1 file `components/ProductCard.tsx`, mọi nơi dùng mẫu đó sẽ tự động hiển thị nhất quán.

### Vì sao trong React, tên hàm component bắt buộc phải viết hoa chữ cái đầu (như `ProductCard`) mà không được viết thường (`productCard`)?

Trong JSX, React phân biệt thẻ có sẵn của trình duyệt và component tự tạo bằng chữ cái đầu tiên. Chữ đầu viết thường (`<div>`, `<button>`, `<productCard>`) bị coi là thẻ HTML thuần; trình duyệt không có thẻ `productCard` nên sẽ không hiển thị đúng và báo cảnh báo. Chữ đầu viết hoa (`<ProductCard />`) mới báo cho React biết cần chạy hàm component của bạn.

### Chuyện gì xảy ra nếu bạn dùng `products.map(...)` để hiển thị 10 thẻ `<ProductCard />` mà quên truyền `key={p.id}`?

React sẽ báo cảnh báo đỏ trong Console: *"Each child in a list should have a unique key prop"*. Nghiêm trọng hơn, khi xóa bớt 1 sản phẩm ở giữa hoặc đổi thứ tự danh sách, React không phân biệt được thẻ nào ứng với sản phẩm nào nên có thể giữ nhầm trạng thái (ô đánh dấu, số lượng đang nhập) của sản phẩm cũ gắn sang sản phẩm khác.

## Kiểm tra không dùng AI

### Tình huống: Trong dự án của bạn đã có sẵn file `components/CourseCard.tsx` để hiện khóa học ở trang chủ. Hôm nay bạn cần làm thêm trang `/khoa-hoc-cua-toi`, chỉ khác trang chủ là mỗi thẻ có thêm thanh tiến độ học tập (`progress`: từ 0 đến 100%). Nếu bạn bảo AI tạo thêm một file mới tên `MyCourseCard.tsx` bằng cách copy nguyên `CourseCard.tsx` sang, rủi ro về sau là gì? Bạn nên yêu cầu AI xử lý thế nào cho đúng chuẩn Component?

#### Đáp án

- **Rủi ro nếu copy ra file mới (`MyCourseCard.tsx`):** Dự án bị nhân bản code. Khi muốn đổi thiết kế khung thẻ khóa học (bo góc, cỡ chữ tiêu đề, ảnh bìa), bạn hoặc AI sửa ở `CourseCard.tsx` thì trang `/khoa-hoc-cua-toi` không đổi theo, làm giao diện hai trang lệch nhau và tốn gấp đôi công sửa lỗi.
- **Cách xử lý đúng:** Giữ nguyên một component duy nhất là `components/CourseCard.tsx`. Yêu cầu AI thêm một prop tùy chọn `progress?: number` vào `CourseCard`. Nơi nào truyền `progress` vào (trang khóa học của tôi) thì hiện thêm thanh tiến độ; nếu không truyền (trang chủ) thì ẩn đi.

## Lỗi suy luận hay gặp

### "Cứ để AI viết hết giao diện của một trang vào một file `page.tsx` dài 800 dòng cho dễ tìm, tách file làm gì cho rối"

- **Vì sao sai:** Khi một file dài hàng trăm dòng, mỗi lần nhờ AI sửa một chi tiết nhỏ, AI phải đọc và sinh lại toàn bộ file lớn đó: vừa tốn token, chạy chậm, lại rất dễ làm hỏng các phần code khác nằm chung trong file.
- **Cách sửa:** Khi thấy file dài quá 200–300 dòng hoặc có khối giao diện lặp lại từ 2 lần trở lên, hãy yêu cầu AI tách khối đó thành component riêng trong `components/`.

### "Khi ra lệnh cho AI sửa giao diện, chỉ cần tả vị trí trên màn hình như 'cái hộp bên phải ở trang thanh toán' là được"

- **Vì sao sai:** AI không nhìn màn hình như mắt người mà tìm theo tên file. Tả mơ hồ khiến AI sửa nhầm file hoặc tự tạo thêm component mới đè lên chỗ cũ, làm thư mục `components/` rác dần.
- **Cách sửa:** Tìm tên chính xác của component (như `OrderSummary` trong `components/OrderSummary.tsx`) và nói rõ: *"Mở file `components/OrderSummary.tsx`, sửa component `OrderSummary` để..."*.

### "Dùng thứ tự đếm `index` (0, 1, 2...) trong `.map((item, index) => <Card key={index} />)` là hết báo lỗi thiếu `key`"

- **Vì sao sai:** Dùng `key={index}` chỉ làm tắt cảnh báo trên Console chứ không giải quyết gốc rễ: khi xóa phần tử số 0, phần tử số 1 tụt xuống thành số 0, khiến React tưởng nhầm hai phần tử đó là một và hiển thị sai dữ liệu bên trong.
- **Cách sửa:** Luôn dùng mã định danh gắn liền với bản ghi dữ liệu như `key={item.id}` hoặc `key={item.slug}` thay vì số thứ tự `index`.
