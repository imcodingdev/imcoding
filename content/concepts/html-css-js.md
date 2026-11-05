---
id: html-css-js
title: HTML, CSS và JavaScript (HTML–CSS–JS)
group: web
prerequisites: [client-server]
priority: 1
stage: 2
format: 2
signals:
  - "className="
  - "globals.css"
  - "onClick"
  - "tailwind"
  - ".tsx"
---

## Nhắc lại

### Trong ứng dụng web, phần chạy trên trình duyệt của người dùng và phần chạy trên máy chủ từ xa gọi là gì?

Phần chạy trên trình duyệt gọi là **Client** (máy khách, hiển thị giao diện và nhận thao tác bấm), còn phần chạy trên máy chủ gọi là **Server** (xử lý nghiệp vụ ngầm, cất giữ khóa bí mật và kết nối cơ sở dữ liệu).

### Vì sao trong Next.js App Router, một file component mặc định không thể dùng ngay sự kiện bấm nút hay xem thông tin trình duyệt?

Vì mặc định mọi component trong thư mục `app/` của Next.js là **Server Component** (chạy trên máy chủ). Các thao tác tương tác trực tiếp của người dùng diễn ra ở trình duyệt nên cần đánh dấu `'use client'` ở đầu file để chuyển thành **Client Component**.

## Đoán trước

Bạn nhờ AI thêm nút `"Nhận mã giảm giá"` vào trang chủ. AI sửa xong, bạn mở web lên thấy nút màu cam rất đẹp, chữ rõ ràng, rê chuột vào vẫn đổi hiệu ứng. Nhưng khi bấm vào nút thì không có chuyện gì xảy ra, mở cửa sổ Console (F12) hay chạy máy chủ thấy báo lỗi đỏ: `"Event handlers cannot be passed to Client Component props"`. Nếu phần khung nút bấm và màu sắc đều đã hiện đúng trên màn hình, tại sao riêng hành động bấm nút lại làm sập trang?

### Đáp án

Một nút bấm trên web được ghép từ ba lớp tách biệt: khung nút là **HTML**, màu cam là **CSS**, còn hành động chạy khi bấm (`onClick`) là **JavaScript** tương tác trên trình duyệt. Trong Next.js App Router, các file giao diện mặc định chạy ở máy chủ (Server Component). Máy chủ có thể tạo sẵn khung HTML và màu CSS để gửi xuống màn hình, nhưng không thể gắn trực tiếp hàm xử lý bấm chuột `onClick` nếu file đó thiếu dòng `'use client'` ở trên cùng. Biết tách bạch ba lớp HTML, CSS và JavaScript giúp bạn nhìn lỗi là biết ngay lớp nào đang hỏng.

## Ví dụ mẫu

Hãy nhìn một cửa hàng như ba lớp. Lớp thứ nhất là **kệ, quầy, bảng tên, sản phẩm**: cửa hàng có những gì. Lớp thứ hai là **sơn tường, ánh đèn, cách bày biện**: mọi thứ trông ra sao. Lớp thứ ba là **nhân viên**: khách hỏi hay bấm chuông thì có người phản ứng.

Trình duyệt chỉ hiểu đúng ba thứ tương ứng: **HTML** là lớp khung và nội dung (tiêu đề, ô nhập, nút bấm); **CSS** là lớp trang trí (màu sắc, cỡ chữ, bố cục); **JavaScript (JS)** là lớp hành động (bấm nút thì chuyện gì xảy ra, gửi dữ liệu đi đâu). Dù dự án dùng React, Next.js hay Tailwind, cuối cùng mọi thứ vẫn quy về ba lớp này trong cùng một file `.tsx`.

Cách làm SAI (ghép tên class bằng biến khiến mất màu và quên khai báo chạy ở trình duyệt khi dùng `onClick`):

```tsx
// SAI: Có onClick (JS trình duyệt) nhưng thiếu 'use client' ở đầu file
export default function PromoButton({ color }: { color: string }) {
  return (
    // SAI: Ghép chuỗi bg-${color}-600 khiến Tailwind không tạo được CSS
    <button className={`bg-${color}-600 text-white px-4 py-2`} onClick={() => alert('Đã lưu!')}>
      Nhận mã
    </button>
  )
}
```

Cách làm ĐÚNG trong file giao diện tương tác:

```tsx
// ĐÚNG: Khai báo ___ ở dòng đầu tiên vì component có xử lý bấm nút (JS)
'use client'

export default function PromoButton({ isHot }: { isHot: boolean }) {
  return (
    <div className="flex gap-2 p-4 rounded-lg bg-amber-50">
      {/* Thẻ <button> là HTML, className là CSS, onClick là JS */}
      <button
        className={isHot ? 'bg-red-600 text-white px-3' : 'bg-amber-600 text-white px-3'}
        onClick={() => alert('Cảm ơn bạn đã đăng ký!')}
      >
        Đăng ký ngay
      </button>
    </div>
  )
}
```

## Tìm trong project của bạn

Hãy mở dự án của bạn và rà soát ba lớp theo các bước sau:

1. **Nhận diện ba lớp trong một file `.tsx`:** Mở một file giao diện bất kỳ trong `app/` hoặc `components/`. Tìm một thẻ `<button>` hoặc `<input>`, chỉ ra đâu là thẻ khung (HTML), đâu là chuỗi trang trí `className="..."` (CSS), và đâu là hàm sự kiện `onClick` / `onChange` (JS).
2. **Kiểm tra lỗi mất màu do ghép chuỗi Tailwind:** Bấm `Ctrl+Shift+F` (hoặc `Cmd+Shift+F`), tìm chuỗi `` className={` `` xem AI có viết kiểu ghép biến như `` `bg-${...}` `` hay `` `text-${...}` `` không.
3. **Kiểm tra sự kiện JS thiếu `'use client'`:** Tìm từ khóa `onClick=` hoặc `onSubmit=` trong toàn dự án. Mở từng file kết quả và kiểm tra xem dòng đầu tiên của file đó (hoặc file cha trực tiếp) đã có `'use client'` chưa.
4. **Kiểm tra lỗi chép HTML thuần vào React:** Tìm chuỗi `class="` (không có chữ `Name`) hoặc `for="` trong các file `.tsx` xem AI có chép nhầm cú pháp HTML thuần vào JSX không.
5. **Ghi lại kết quả của bạn:**
   - File `.tsx` bạn vừa mở có đủ cả 3 lớp HTML, CSS, JS không?: `[ Tên file: ... ]`
   - Có chỗ nào ghép biến vào giữa tên class Tailwind không?: `[ Có / Không - tên file: ... ]`
   - Có file nào dùng `onClick` mà thiếu `'use client'` hoặc dùng nhầm `class=` không?: `[ Có / Không ]`

## Tự giải thích

### Vì sao viết `` className={`bg-${color}-500`} `` thì nút bấm bị mất màu dù biến `color` có giá trị `'red'` hoàn toàn đúng?

Vì Tailwind CSS không chạy code JavaScript để tính giá trị biến, mà chỉ quét mặt chữ trong file code lúc đóng gói để tìm tên class hoàn chỉnh. Khi thấy chuỗi cắt rời `bg-${color}-500`, Tailwind không nhận diện được tên class `bg-red-500` nên không sinh ra đoạn CSS màu đỏ cho trình duyệt. Bạn phải viết nguyên vẹn cả cụm tên class như `'bg-red-500'`.

### Khi giao diện bị lệch bố cục hoặc sai màu sắc nhưng bấm nút vẫn gửi dữ liệu bình thường, bạn nên khoanh vùng lỗi cho AI sửa ở phần nào để AI không làm hỏng logic?

Lỗi nằm ở lớp **CSS** (trong thuộc tính `className` hoặc file `globals.css`), còn lớp **JavaScript** đang chạy tốt. Khi ra lệnh cho AI, bạn nên yêu cầu rõ: *"Chỉ sửa các class Tailwind trong `className` của nút để chỉnh lại màu/bố cục, giữ nguyên hàm `onClick` và logic hiện tại"*.

### Vì sao chép nguyên một đoạn code mẫu HTML trên mạng (có chữ `class="..."`) dán vào file `.tsx` của Next.js thì trình duyệt lại báo cảnh báo lỗi?

Vì file `.tsx` dùng cú pháp JSX của React (viết HTML bên trong JavaScript). Trong ngôn ngữ JavaScript, từ `class` và `for` đã được dành riêng cho mục đích khác, nên React bắt buộc đổi tên thuộc tính HTML `class` thành `className` và `for` thành `htmlFor`.

## Kiểm tra không dùng AI

### Tình huống: Bạn nhờ AI làm một nhãn trạng thái đơn hàng: nếu biến `status` là `'paid'` thì nền màu xanh lá (`green`), nếu là `'pending'` thì nền màu vàng (`amber`). AI viết đoạn code: `<span className={`px-2 py-1 rounded bg-${status === 'paid' ? 'green' : 'amber'}-100`}>Đã thanh toán</span>`. Khi chạy web, khung chữ vẫn bo góc và có khoảng đệm nhưng nền lại trong suốt không có màu. Hãy giải thích nguyên nhân và viết lại cách xử lý đúng.

#### Đáp án

- **Nguyên nhân:** Các class `px-2 py-1 rounded` được viết đầy đủ nên khoảng đệm và bo góc vẫn hoạt động. Tuy nhiên, class màu nền bị cắt vụn thành `bg-${...}-100`. Lúc quét file, Tailwind không thấy chuỗi nguyên vẹn `bg-green-100` hay `bg-amber-100` trong code nên bỏ qua, không tạo CSS màu nền cho hai class này.
- **Cách xử lý đúng:** Không ghép biến vào giữa tên class Tailwind mà chọn giữa hai tên class đầy đủ:
  `<span className={`px-2 py-1 rounded ${status === 'paid' ? 'bg-green-100' : 'bg-amber-100'}`}>Đã thanh toán</span>`

## Lỗi suy luận hay gặp

### "Web dùng React, Next.js và Tailwind nên không còn liên quan gì đến HTML, CSS hay JavaScript nữa"

- **Vì sao sai:** Trình duyệt web (Chrome, Safari...) không hiểu trực tiếp file `.tsx` hay tên gói React. Next.js và Tailwind chỉ là công cụ giúp lập trình viên và AI viết code gọn hơn, sau đó tự động biên dịch toàn bộ về đúng ba thứ duy nhất mà trình duyệt đọc được là HTML, CSS và JavaScript.
- **Cách sửa:** Khi kiểm tra lỗi trên trình duyệt (bấm F12 mở tab Elements, Styles, Console), hãy luôn quy chiếu về ba lớp: mất khung nội dung là HTML, sai hình dáng là CSS, bấm không chạy là JS.

### "Thấy nút bấm không hoạt động, bảo AI 'sửa lại cái nút' chung chung là đủ"

- **Vì sao sai:** Nói chung chung khiến AI dễ đoán mò: có khi lỗi do hàm JS trong `onClick`, nhưng AI lại đập đi viết lại cả khung HTML và đổi luôn class CSS làm vỡ giao diện đang đẹp.
- **Cách sửa:** Tách rõ lớp bị lỗi khi giao việc cho AI: nếu nút xấu thì bảo *"chỉ sửa `className`"*, nếu bấm không ăn thì bảo *"giữ nguyên giao diện và `className`, chỉ kiểm tra sự kiện `onClick` và `'use client'`"*.

### "Muốn đổi màu hàng loạt theo dữ liệu thì cứ ghép chuỗi `text-${color}-600` cho ngắn gọn"

- **Vì sao sai:** Thói quen ghép chuỗi của JavaScript xung đột với cơ chế quét văn bản tĩnh của Tailwind CSS, làm ứng dụng bị mất màu ngẫu nhiên khi lên môi trường thật.
- **Cách sửa:** Luôn viết trọn vẹn từng tên class Tailwind trong câu điều kiện hoặc lập một bảng ánh xạ (object) chứa sẵn các chuỗi tên class đầy đủ.
